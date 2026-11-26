/**
 * Classrooms and courses ("Teach and learn") on classicApi. Server functions live in
 * TalkMotionServer (classroom_service.py, folder_service.get_course_view); every one checks
 * access itself, so these endpoints only shape data.
 *
 * Roles in a classroom: owner | teacher | student (null for someone who isn't in it).
 * Course access: owner | edit | view.
 */
import { classicApi } from "../../app/classicApi";
import { hasRpc } from "../../api/rpc";

/** True when the connected server has the classroom functions this area needs. */
export const teachServerReady = () => hasRpc("listMyClassrooms") && hasRpc("getCourse");

const LIST = { type: "ClassroomList", id: "LIST" };
const REQUESTS = { type: "ClassroomRequest", id: "LIST" };
const COURSES = { type: "CourseList", id: "LIST" };
const classroomTag = (id) => ({ type: "Classroom", id: String(id) });
const courseTag = (id) => ({ type: "Course", id: String(id) });

/** Server classroom row -> UI shape. */
export function normalizeClassroom(c) {
  if (!c) return null;
  return {
    id: String(c.id),
    name: c.name || "Untitled classroom",
    description: c.description || "",
    image: c.image || null,
    isPublic: Boolean(c.is_public),
    owner: c.owner || null,
    role: c.role || null,
    pending: c.pending || null,
    studentCount: Number(c.student_count || 0),
    teacherCount: Number(c.teacher_count || 0),
    requestCount: Number(c.request_count || 0),
    note: c.note || "",
    can: c.can || {},
    people: (c.people || []).map(normalizePerson),
    requests: (c.requests || []).map(normalizePerson),
    courses: (c.courses || []).map((k) => ({
      id: String(k.id),
      name: k.name || "Untitled course",
      description: k.description || "",
      owner: k.owner || null,
      canEdit: Boolean(k.can_edit),
    })),
  };
}

export function normalizePerson(p) {
  return {
    userId: p.user_id != null ? String(p.user_id) : null,
    username: p.username || null,
    name: p.name || p.username || "Someone",
    image: p.image || null,
    role: p.role || null,
    requestId: p.request_id != null ? String(p.request_id) : null,
    isMe: Boolean(p.is_me),
    classroomId: p.classroom_id != null ? String(p.classroom_id) : null,
    classroomName: p.classroom_name || null,
  };
}

export function normalizeCourseSummary(f) {
  return {
    id: String(f.id),
    name: f.name || "Untitled course",
    description: f.description || "",
    owner: f.owner || null,
    access: f.access || "view",
    lessonCount: Number(f.lesson_count || 0),
    sectionCount: Number(f.section_count || 0),
  };
}

export function normalizeCourse(c) {
  if (!c) return null;
  return {
    id: String(c.id),
    name: c.name || "Untitled course",
    description: c.description || "",
    owner: c.owner || null,
    access: c.access || "view",
    path: (c.path || []).map((p) => ({ id: String(p.id), name: p.name || "Untitled" })),
    sections: (c.sections || []).map((s) => ({
      id: String(s.id),
      name: s.name || "Untitled section",
      description: s.description || "",
      lessonCount: Number(s.lesson_count || 0),
      sectionCount: Number(s.section_count || 0),
    })),
    lessons: (c.lessons || []).map((l) => ({
      id: String(l.id),
      contentId: String(l.content_id),
      type: l.type,
      title: l.title || "Untitled",
      description: l.description || "",
      owner: l.owner || null,
    })),
    shares: (c.shares || []).map((s) => ({
      type: s.type,
      id: String(s.id),
      name: s.name || "Unknown",
      username: s.username || null,
      canEdit: Boolean(s.can_edit),
    })),
  };
}

/**
 * Flatten the legacy folder tree (getFolderAndContentsAndPermissions(null)) into move
 * destinations, leaving out `exclude` and everything inside it.
 */
export function moveDestinations(tree, exclude) {
  const out = [];
  const walk = (nodes, depth, trail) => {
    for (const node of nodes || []) {
      const id = String(node.id);
      if (id === String(exclude)) continue;
      const label = [...trail, node.name || "Untitled"].join(" › ");
      out.push({ id, label, depth });
      walk(node.children, depth + 1, [...trail, node.name || "Untitled"]);
    }
  };
  walk(tree?.children, 0, []);
  return out;
}

export const teachApi = classicApi.injectEndpoints({
  endpoints: (build) => ({
    // -------------------------------------------------------------- classrooms
    listMyClassrooms: build.query({
      query: ({ search = "", offset = 0, limit = 48, show = "all" } = {}) => ({
        fn: "listMyClassrooms",
        args: [search, offset, limit, show],
      }),
      transformResponse: (res) => ({
        rows: (res?.rows || []).map(normalizeClassroom),
        total: Number(res?.total || 0),
      }),
      providesTags: (result) => [LIST, ...(result?.rows || []).map((c) => classroomTag(c.id))],
    }),
    browseClassrooms: build.query({
      query: ({ search = "", offset = 0, limit = 24 } = {}) => ({ fn: "browseClassrooms", args: [search, offset, limit] }),
      transformResponse: (res) => ({
        rows: (res?.rows || []).map(normalizeClassroom),
        total: Number(res?.total || 0),
      }),
      providesTags: [LIST],
    }),
    getClassroom: build.query({
      query: (id) => ({ fn: "getClassroomDetails", args: [Number(id)] }),
      transformResponse: normalizeClassroom,
      providesTags: (result, error, id) => [classroomTag(id)],
    }),
    getMyClassroomRequests: build.query({
      query: () => ({ fn: "getMyClassroomRequests" }),
      transformResponse: (res) => (Array.isArray(res) ? res : []).map(normalizePerson),
      providesTags: [REQUESTS],
    }),
    findPeople: build.query({
      query: (search) => ({ fn: "findPeople", args: [search, 8] }),
      transformResponse: (res) => (Array.isArray(res) ? res : []).map(normalizePerson),
      keepUnusedDataFor: 30,
    }),
    createClassroom: build.mutation({
      query: ({ name, description, isPublic }) => ({
        fn: "createClassroomSimple",
        args: [name, description || null, Boolean(isPublic)],
      }),
      transformResponse: (res) => ({ id: String(res?.id), name: res?.name }),
      invalidatesTags: [LIST],
    }),
    updateClassroom: build.mutation({
      query: ({ id, name, description, isPublic, note }) => ({
        fn: "updateClassroomDetails",
        args: [Number(id), name, description ?? null, isPublic ?? null, note ?? null],
      }),
      invalidatesTags: (result, error, { id }) => [classroomTag(id), LIST],
    }),
    archiveClassroom: build.mutation({
      query: (id) => ({ fn: "archiveClassroom", args: [Number(id)] }),
      invalidatesTags: (result, error, id) => [classroomTag(id), LIST, REQUESTS],
    }),
    addClassroomMember: build.mutation({
      query: ({ classroomId, userId, role }) => ({
        fn: "addClassroomMember",
        args: [Number(classroomId), Number(userId), role],
      }),
      invalidatesTags: (result, error, { classroomId }) => [classroomTag(classroomId), LIST, REQUESTS],
    }),
    requestToJoin: build.mutation({
      query: ({ classroomId, role = "student" }) => ({ fn: "requestToJoinClassroom", args: [Number(classroomId), role] }),
      invalidatesTags: (result, error, { classroomId }) => [classroomTag(classroomId), LIST],
    }),
    answerRequest: build.mutation({
      query: ({ requestId, role, approve }) => ({
        fn: "answerClassroomRequest",
        args: [Number(requestId), role, Boolean(approve)],
      }),
      invalidatesTags: (result, error, { classroomId }) => [
        ...(classroomId ? [classroomTag(classroomId)] : [{ type: "Classroom" }]),
        LIST,
        REQUESTS,
      ],
    }),
    removeClassroomMember: build.mutation({
      query: ({ classroomId, userId, role }) => ({
        fn: "removeClassroomMember",
        args: [Number(classroomId), Number(userId), role],
      }),
      invalidatesTags: (result, error, { classroomId }) => [classroomTag(classroomId), LIST, COURSES],
    }),

    // -------------------------------------------------------------- courses
    listCourses: build.query({
      query: () => ({ fn: "listCourses" }),
      transformResponse: (res) => ({
        mine: (res?.mine || []).map(normalizeCourseSummary),
        shared: (res?.shared || []).map(normalizeCourseSummary),
      }),
      providesTags: [COURSES],
    }),
    getCourse: build.query({
      query: (id) => ({ fn: "getCourse", args: [Number(id)] }),
      transformResponse: normalizeCourse,
      providesTags: (result, error, id) => [courseTag(id)],
    }),
    getCourseTree: build.query({
      query: () => ({ fn: "getFolderAndContentsAndPermissions", args: [null], raw: true }),
      providesTags: [COURSES],
    }),
    createCourse: build.mutation({
      query: ({ name, description, parentId }) => ({
        fn: "createCourse",
        args: [name, description || null, parentId != null ? Number(parentId) : null],
      }),
      transformResponse: (res) => ({ id: String(res?.id) }),
      invalidatesTags: (result, error, { parentId }) => [COURSES, ...(parentId ? [courseTag(parentId)] : [])],
    }),
    renameCourse: build.mutation({
      query: ({ id, name, description }) => ({ fn: "updateFolder", args: [Number(id), name, description ?? null, null, null] }),
      invalidatesTags: () => [COURSES, { type: "Course" }],
    }),
    deleteCourse: build.mutation({
      query: (id) => ({ fn: "deleteFolder", args: [Number(id)] }),
      invalidatesTags: () => [COURSES, { type: "Course" }, { type: "Classroom" }],
    }),
    moveCourse: build.mutation({
      query: ({ id, destinationId }) => ({
        fn: "moveFolder",
        args: [Number(id), destinationId != null ? Number(destinationId) : null],
      }),
      invalidatesTags: () => [COURSES, { type: "Course" }],
    }),
    addLessons: build.mutation({
      async queryFn({ courseId, items }, api, extra, baseQuery) {
        let added = 0;
        for (const item of items) {
          const res = await baseQuery({
            fn: "addLessonToCourse",
            args: [Number(courseId), item.type || "recording", String(item.id), item.title || null],
          });
          if (res.error) return { error: res.error };
          if (res.data?.status === "added") added += 1;
        }
        return { data: { added } };
      },
      invalidatesTags: (result, error, { courseId }) => [courseTag(courseId), COURSES],
    }),
    removeLesson: build.mutation({
      query: ({ lessonId }) => ({ fn: "removeLessonFromCourse", args: [Number(lessonId)] }),
      invalidatesTags: (result, error, { courseId }) => [courseTag(courseId), COURSES],
    }),
    shareCourse: build.mutation({
      query: ({ courseId, type, id, canEdit }) => ({
        fn: "shareCourse",
        args: [Number(courseId), type, Number(id), Boolean(canEdit)],
      }),
      invalidatesTags: (result, error, { courseId, type, id }) => [
        courseTag(courseId),
        ...(type === "classroom" ? [classroomTag(id)] : []),
      ],
    }),
    unshareCourse: build.mutation({
      query: ({ courseId, type, id }) => ({ fn: "unshareCourse", args: [Number(courseId), type, Number(id)] }),
      invalidatesTags: (result, error, { courseId, type, id }) => [
        courseTag(courseId),
        ...(type === "classroom" ? [classroomTag(id)] : []),
      ],
    }),
  }),
});

export const {
  useListMyClassroomsQuery,
  useBrowseClassroomsQuery,
  useGetClassroomQuery,
  useGetMyClassroomRequestsQuery,
  useFindPeopleQuery,
  useCreateClassroomMutation,
  useUpdateClassroomMutation,
  useArchiveClassroomMutation,
  useAddClassroomMemberMutation,
  useRequestToJoinMutation,
  useAnswerRequestMutation,
  useRemoveClassroomMemberMutation,
  useListCoursesQuery,
  useGetCourseQuery,
  useGetCourseTreeQuery,
  useCreateCourseMutation,
  useRenameCourseMutation,
  useDeleteCourseMutation,
  useMoveCourseMutation,
  useAddLessonsMutation,
  useRemoveLessonMutation,
  useShareCourseMutation,
  useUnshareCourseMutation,
} = teachApi;
