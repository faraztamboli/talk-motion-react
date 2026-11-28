import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import "../videoSubtitles/testI18n";
import { makeStore } from "../../test/renderWithProviders";
import { moveDestinations, normalizeClassroom, normalizeCourse } from "./teachApi";
import { checklistSteps } from "../home/GettingStarted";

// ------------------------------------------------------------------ pure rules

describe("normalizers", () => {
  it("shapes a classroom with its people, requests and courses", () => {
    const c = normalizeClassroom({
      id: 4,
      name: "Maths",
      is_public: 1,
      role: "owner",
      student_count: "3",
      request_count: 2,
      can: { edit: true },
      people: [{ user_id: 1, username: "ann", name: "Ann", role: "owner" }],
      requests: [{ user_id: 9, name: "Dan", role: "student", request_id: 12 }],
      courses: [{ id: 7, name: "Signs", can_edit: 0 }],
    });
    expect(c).toMatchObject({ id: "4", isPublic: true, studentCount: 3, requestCount: 2, can: { edit: true } });
    expect(c.people[0]).toMatchObject({ userId: "1", role: "owner" });
    expect(c.requests[0]).toMatchObject({ userId: "9", requestId: "12" });
    expect(c.courses[0]).toEqual({ id: "7", name: "Signs", description: "", owner: null, canEdit: false });
  });

  it("shapes a course with its path, sections, lessons and shares", () => {
    const c = normalizeCourse({
      id: 2,
      name: "Week 1",
      access: "view",
      path: [{ id: 1, name: "Signs 101" }, { id: 2, name: "Week 1" }],
      sections: [{ id: 3, name: "Extra", lesson_count: 1 }],
      lessons: [{ id: 5, content_id: 11, type: "recording", title: "Hello" }],
      shares: [{ type: "classroom", id: 4, name: "Maths", can_edit: false }],
    });
    expect(c.path.map((p) => p.id)).toEqual(["1", "2"]);
    expect(c.sections[0]).toMatchObject({ id: "3", lessonCount: 1, sectionCount: 0 });
    expect(c.lessons[0]).toMatchObject({ id: "5", contentId: "11", type: "recording" });
    expect(c.shares[0]).toMatchObject({ type: "classroom", id: "4", canEdit: false });
  });

  it("lists move destinations without the item being moved or anything inside it", () => {
    const tree = {
      children: [
        { id: 1, name: "A", children: [{ id: 2, name: "A1", children: [{ id: 3, name: "A1x", children: [] }] }] },
        { id: 4, name: "B", children: [] },
      ],
    };
    expect(moveDestinations(tree, 2).map((d) => [d.id, d.label])).toEqual([
      ["1", "A"],
      ["4", "B"],
    ]);
    expect(moveDestinations(tree, 9).map((d) => d.label)).toEqual(["A", "A › A1", "A › A1 › A1x", "B"]);
    expect(moveDestinations(null, 1)).toEqual([]);
  });
});

describe("getting started", () => {
  it("ticks steps off from real activity", () => {
    const none = checklistSteps({});
    expect(none.map((s) => s.done)).toEqual([false, false, false, false]);
    const some = checklistSteps({ videos: 2, classrooms: 1, courses: 0, tried: ["translate"] });
    expect(some.filter((s) => s.done).map((s) => s.key)).toEqual(["translate", "video", "classroom"]);
    expect(some.find((s) => s.key === "course").path).toBe("/courses?new=1");
  });
});

// ------------------------------------------------------------------ pages (data hooks mocked)

const api = vi.hoisted(() => ({
  list: { data: { rows: [], total: 0 }, isLoading: false },
  requests: { data: [] },
  classroom: { data: null, isLoading: false },
  course: { data: null, isLoading: false },
  courses: { data: { mine: [], shared: [] }, isLoading: false },
  browse: { data: { rows: [], total: 0 }, isLoading: false },
  calls: (globalThis.__teachCalls = []),
}));

const mutation = vi.hoisted(() => (name, result = {}) => () => [
  (arg) => {
    globalThis.__teachCalls.push([name, arg]);
    return { unwrap: async () => result };
  },
  { isLoading: false },
]);

vi.mock("./teachApi", async (orig) => {
  const real = await orig();
  return {
    ...real,
    teachServerReady: () => true,
    useListMyClassroomsQuery: () => api.list,
    useGetMyClassroomRequestsQuery: () => api.requests,
    useGetClassroomQuery: () => api.classroom,
    useGetCourseQuery: () => api.course,
    useListCoursesQuery: () => api.courses,
    useBrowseClassroomsQuery: () => api.browse,
    useFindPeopleQuery: () => ({ data: [] }),
    useGetCourseTreeQuery: () => ({ data: null }),
    useCreateClassroomMutation: mutation("createClassroom", { id: "31", name: "ASL 1" }),
    useUpdateClassroomMutation: mutation("updateClassroom"),
    useArchiveClassroomMutation: mutation("archiveClassroom"),
    useAddClassroomMemberMutation: mutation("addClassroomMember"),
    useRequestToJoinMutation: mutation("requestToJoin"),
    useAnswerRequestMutation: mutation("answerRequest"),
    useRemoveClassroomMemberMutation: mutation("removeClassroomMember"),
    useShareCourseMutation: mutation("shareCourse"),
    useUnshareCourseMutation: mutation("unshareCourse"),
    useCreateCourseMutation: mutation("createCourse", { id: "40" }),
    useRenameCourseMutation: mutation("renameCourse"),
    useDeleteCourseMutation: mutation("deleteCourse"),
    useMoveCourseMutation: mutation("moveCourse"),
    useAddLessonsMutation: mutation("addLessons", { added: 1 }),
    useRemoveLessonMutation: mutation("removeLesson"),
  };
});

import ClassroomsPage, { WaitingBanner, filterClassrooms } from "./ClassroomsPage";
import ClassroomPage, { canRemove } from "./ClassroomPage";
import NewClassroomPage from "./NewClassroomPage";
import CoursesPage from "./CoursesPage";
import CoursePage, { lessonLink } from "./CoursePage";
import { joinState } from "./FindClassroomsPage";

function renderAt(path, routePattern, element, user = "cat") {
  const store = makeStore({ user: { username: user } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePattern} element={element} />
          <Route path="*" element={<div>other page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

const classroom = (over = {}) =>
  normalizeClassroom({
    id: 4,
    name: "Maths",
    description: "numbers",
    is_public: 1,
    role: "student",
    student_count: 1,
    can: {},
    people: [
      { user_id: 1, username: "ann", name: "Ann Lee", role: "owner" },
      { user_id: 3, username: "cat", name: "Cat Wu", role: "student" },
    ],
    requests: [],
    courses: [],
    ...over,
  });

beforeEach(() => {
  api.calls.length = 0;
});

describe("rules shared with the server", () => {
  it("lets owners remove teachers, teachers remove students, and anyone but the owner leave", () => {
    expect(canRemove("owner", "teacher")).toBe(true);
    expect(canRemove("teacher", "student")).toBe(true);
    expect(canRemove("teacher", "teacher")).toBe(false);
    expect(canRemove("student", "student")).toBe(false);
    expect(canRemove("owner", "owner")).toBe(false);
    expect(canRemove("student", "student", true)).toBe(true);
    expect(canRemove("owner", "owner", true)).toBe(false);
  });

  it("filters classrooms by what the person does in them", () => {
    const rows = [{ role: "owner" }, { role: "teacher" }, { role: "student" }];
    expect(filterClassrooms(rows, "teaching")).toHaveLength(2);
    expect(filterClassrooms(rows, "learning")).toHaveLength(1);
    expect(filterClassrooms(rows, "all")).toHaveLength(3);
  });

  it("offers one join action per listed classroom", () => {
    expect(joinState({ role: "student" })).toBe("member");
    expect(joinState({ role: null, pending: "student" })).toBe("pending");
    expect(joinState({ role: null, pending: null })).toBe("can-ask");
  });

  it("opens videos in the viewer and models in the models hub", () => {
    expect(lessonLink({ type: "recording", contentId: "11" })).toBe("/video-subtitles/library/11");
    expect(lessonLink({ type: "model", contentId: "5" })).toBe("/models/5");
  });
});

describe("ClassroomsPage", () => {
  it("offers two plain choices when the person has no classrooms", () => {
    api.list = { data: { rows: [], total: 0 }, isLoading: false };
    renderAt("/classrooms", "/classrooms", <ClassroomsPage />);
    expect(screen.getByRole("button", { name: /Start my own classroom/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Join someone's classroom/ })).toBeInTheDocument();
  });

  it("lists classrooms with the person's role and waiting requests", () => {
    api.list = {
      data: {
        rows: [
          classroom({ role: "owner", request_count: 2, name: "Art" }),
          classroom({ id: 5, role: "student", name: "Maths" }),
        ],
        total: 2,
      },
      isLoading: false,
    };
    api.requests = { data: [{ requestId: "1" }, { requestId: "2" }] };
    renderAt("/classrooms", "/classrooms", <ClassroomsPage />);
    expect(screen.getByRole("link", { name: /Art/ })).toHaveAttribute("href", "/classroom/4");
    expect(screen.getByText("You run this")).toBeInTheDocument();
    expect(screen.getByText("You're learning")).toBeInTheDocument();
    expect(screen.getByText("2 asking to join")).toBeInTheDocument();
    expect(screen.getByText(/2 people are asking to join/)).toBeInTheDocument();
    // both kinds exist, so the filter shows
    expect(screen.getByText("I teach (1)")).toBeInTheDocument();
  });
});

describe("WaitingBanner", () => {
  it("says one person in the singular and opens the requests", () => {
    api.requests = { data: [{ requestId: "1" }] };
    renderAt("/", "/", <WaitingBanner />);
    expect(screen.getByText(/1 person is asking to join your classrooms/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review requests" }));
    expect(screen.getByText("other page")).toBeInTheDocument();
  });

  it("shows nothing when nobody is waiting", () => {
    api.requests = { data: [] };
    const { container } = renderAt("/", "/", <WaitingBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ClassroomPage", () => {
  it("shows a student their courses and a way to leave, but no teacher tools", () => {
    api.classroom = {
      data: classroom({ courses: [{ id: 7, name: "Signs 101", owner: "ann" }] }),
      isLoading: false,
    };
    renderAt("/classroom/4", "/classroom/:classroomId", <ClassroomPage />);
    expect(screen.getByRole("heading", { name: "Maths", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Signs 101/ })).toHaveAttribute("href", "/courses/7");
    expect(screen.queryByRole("button", { name: /Add people/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Leave classroom/ })).toBeInTheDocument();
  });

  it("lets a teacher let people in", async () => {
    api.classroom = {
      data: classroom({
        role: "owner",
        can: { edit: true, add_teacher: true, add_student: true },
        requests: [{ user_id: 9, name: "Dan", role: "student", request_id: 12 }],
      }),
      isLoading: false,
    };
    renderAt("/classroom/4", "/classroom/:classroomId", <ClassroomPage />, "ann");
    expect(screen.getByText("Asking to join (1)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Let in/ }));
    await waitFor(() =>
      expect(api.calls).toContainEqual(["answerRequest", { requestId: "12", role: "student", approve: true, classroomId: "4" }])
    );
    expect(screen.getByRole("button", { name: /Add people/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument(); // Cat, a student
  });

  it("lets a stranger ask to join a listed classroom", async () => {
    api.classroom = { data: classroom({ role: null, people: [] }), isLoading: false };
    renderAt("/classroom/4", "/classroom/:classroomId", <ClassroomPage />, "eve");
    fireEvent.click(screen.getByRole("button", { name: /Ask to join/ }));
    await waitFor(() => expect(api.calls).toContainEqual(["requestToJoin", { classroomId: "4", role: "student" }]));
    expect(screen.queryByText("Teachers")).toBeNull();
  });

  it("tells a stranger their request is waiting", () => {
    api.classroom = { data: classroom({ role: null, pending: "student", people: [] }), isLoading: false };
    renderAt("/classroom/4", "/classroom/:classroomId", <ClassroomPage />, "dan");
    expect(screen.getByText("Your request has been sent.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ask to join/ })).toBeNull();
  });
});

describe("NewClassroomPage", () => {
  it("names the classroom, chooses who can join, creates it, then offers to add people", async () => {
    renderAt("/classrooms/new", "/classrooms/new", <NewClassroomPage />, "ann");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Please type a name.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("What is your classroom called?"), { target: { value: "  ASL 1 " } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Only people I add")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Anyone can find it and ask to join"));
    fireEvent.click(screen.getByRole("button", { name: "Create classroom" }));

    await waitFor(() =>
      expect(api.calls).toContainEqual(["createClassroom", { name: "ASL 1", description: "", isPublic: true }])
    );
    expect(await screen.findByText(/is ready. Who should be in it/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Skip for now/ }));
    expect(await screen.findByText("other page")).toBeInTheDocument();
  }, 30000); // four screens; slow when the whole suite runs in parallel
});

describe("courses", () => {
  it("guides a first course", () => {
    api.courses = { data: { mine: [], shared: [] }, isLoading: false };
    renderAt("/courses", "/courses", <CoursesPage />, "ann");
    expect(screen.getByRole("button", { name: /Make my first course/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Make a video first/ })).toBeInTheDocument();
  });

  it("shows a watch-only course without editing tools", () => {
    api.course = {
      data: normalizeCourse({
        id: 2,
        name: "Week 1",
        access: "view",
        path: [{ id: 1, name: "Signs 101" }, { id: 2, name: "Week 1" }],
        sections: [],
        lessons: [{ id: 5, content_id: 11, type: "recording", title: "Hello sign" }],
      }),
      isLoading: false,
    };
    renderAt("/courses/2", "/courses/:courseId", <CoursePage />, "cat");
    expect(screen.getByRole("link", { name: "Signs 101" })).toHaveAttribute("href", "/courses/1");
    expect(screen.getByRole("link", { name: "Hello sign" })).toHaveAttribute("href", "/video-subtitles/library/11");
    expect(screen.getByText("You can watch this course.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add videos/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Take out/ })).toBeNull();
  });

  it("guides the owner of an empty course", () => {
    api.course = {
      data: normalizeCourse({ id: 1, name: "Signs 101", access: "owner", path: [{ id: 1, name: "Signs 101" }] }),
      isLoading: false,
    };
    renderAt("/courses/1", "/courses/:courseId", <CoursePage />, "ann");
    expect(screen.getByRole("button", { name: /Add my first videos/ })).toBeInTheDocument();
    expect(screen.getByText(/Only you can see this course/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Share/ })).toBeInTheDocument();
  });
});
