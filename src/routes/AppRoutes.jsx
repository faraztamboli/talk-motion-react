import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import Login from "../pages/Login";
import Error from "../pages/Errors/404Error";
import { Skeleton } from "antd";
import ResetPassword from "../pages/ResetPassword";
import AuthPagesLoader from "../components/ui/AuthPagesLoader";
import Setting from "../pages/Setting";
import MySubscriptions from "../pages/MySubscriptions";
// import Payment from "../components/ui/Payment";
// import Payment from "../components/ui/TestCheckoutForm";

// React lazy components
const Converter = React.lazy(() => import("../pages/Converter"));
const Trainer = React.lazy(() => import("../pages/Trainer"));
const Collector = React.lazy(() => import("../pages/Collector"));
const ModelTrainer = React.lazy(() =>
  import("../pages/ModelTrainer")
);
const UploadVideo = React.lazy(() =>
  import("../components/ui/UploadVideo")
);
const Models = React.lazy(() => import("../pages/Models"));
const MyModels = React.lazy(() => import("../pages/MyModels"));
const TrainingModels = React.lazy(() =>
  import("../pages/TrainingModels")
);

const VideoSubtitlesDesigner = React.lazy(() =>
  import("../pages/VideoSubtitlesDesigner")
);
const VideoSubtitlesLibrary = React.lazy(() =>
  import("../pages/VideoSubtitlesLibrary")
);
const VideoSubtitlesMyLibrary = React.lazy(() =>
  import("../pages/VideoSubtitlesMyLibrary")
);
const VideoWithSubtitles = React.lazy(() =>
  import("../pages/VideoWithSubtitles")
);
const FolderManager = React.lazy(() =>
  import("../pages/FolderManager")
);
const Courses = React.lazy(() => import("../pages/Courses"));
const CourseDetail = React.lazy(() => import("../pages/CourseDetail"));
const CourseTreeManager = React.lazy(() =>
  import("../pages/CourseTreeManager")
);
const UserModel = React.lazy(() => import("../pages/UserModel"));
const ModelFiles = React.lazy(() => import("../pages/ModelFiles"));
const ModelConcepts = React.lazy(() =>
  import("../pages/ModelConcepts")
);
const ConceptDetails = React.lazy(() =>
  import("../pages/ConceptDetails")
);
const Classrooms = React.lazy(() => import("../pages/Classrooms"));
const ClassroomsRedesigned = React.lazy(() =>
  import("../pages/ClassroomsRedesigned")
);
const StaffClassrooms = React.lazy(() =>
  import("../pages/StaffClassrooms")
);
const StaffRooms = React.lazy(() => import("../pages/StaffRooms"));
const Classroom = React.lazy(() => import("../pages/Classroom"));
const ClassroomDetail = React.lazy(() =>
  import("../pages/ClassroomDetail")
);
const Profile = React.lazy(() => import("../pages/Profile"));
const PublicUserProfile = React.lazy(() =>
  import("../pages/PublicUserProfile")
);
const Signup = React.lazy(() => import("../pages/Signup"));
const Payment = React.lazy(() => import("../pages/Payment"));
const PaymentConfirmation = React.lazy(() =>
  import("../pages/paymentConfirmation")
);
// const Payment = React.lazy(() => import("../pages/Payment"));
// const Payment = React.lazy(() => import("../components/ui/Payment"));
const ForgotPassword = React.lazy(() =>
  import("../pages/ForgotPassword")
);
const ContactUs = React.lazy(() => import("../pages/ContactUs"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const DashboardNew = React.lazy(() => import("../pages/DashboardNew"));

function AppRoutes(props) {
  const { sm, md, collapsedWidth } = props;
  const skeletonStyle = { padding: "24px", height: "90vh" };

  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route
          index
          path="/"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <DashboardNew 
                collapsedWidth={collapsedWidth}
                sm={sm}
                md={md}
              />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/dashboard" element={<PrivateRoute />}>
        <Route
          path="/dashboard"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <DashboardNew 
                collapsedWidth={collapsedWidth}
                sm={sm}
                md={md}
              />
            </React.Suspense>
          }
        />
      </Route>
      <Route exact path="/converter" element={<PrivateRoute />}>
        <Route
          path="/converter"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Converter
                sm={sm}
                md={md}
                collapsedWidth={collapsedWidth}
              />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/trainer" element={<PrivateRoute />}>
        <Route
          path="/trainer"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Trainer collapsedWidth={collapsedWidth} sm={sm} />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/trainer/collect" element={<PrivateRoute />}>
        <Route
          path="/trainer/collect"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Collector />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/trainer/train" element={<PrivateRoute />}>
        <Route
          path="/trainer/train"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ModelTrainer />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/trainer/upload" element={<PrivateRoute />}>
        <Route
          path="/trainer/upload"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <UploadVideo />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/models" element={<PrivateRoute />}>
        <Route
          path="/models"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Models collapsedWidth={collapsedWidth} sm={sm} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/models" element={<PrivateRoute />}>
        <Route
          path=":modelid"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <UserModel collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
        <Route
          path=":modelid/files"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ModelFiles collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
        <Route
          path=":modelid/concepts"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ModelConcepts collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
        <Route
          path=":modelid/concepts/:concepttitle"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ConceptDetails />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/my-models" element={<PrivateRoute />}>
        <Route
          path="/my-models"
          exact
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <MyModels collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>
      <Route
        path="/models/training-models"
        element={<PrivateRoute />}
      >
        <Route
          path="/models/training-models"
          exact
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <TrainingModels collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/designer"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/designer"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <VideoSubtitlesDesigner />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/designer/:recordingId"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/designer/:recordingId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <VideoSubtitlesDesigner />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/library"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/library"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <VideoSubtitlesLibrary />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/mylibrary"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/mylibrary"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <VideoSubtitlesMyLibrary />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/library/:recordingId"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/library/:recordingId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <VideoWithSubtitles />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/folder-manager"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/folder-manager"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <CourseDetail collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
        <Route
          path="/video-subtitles/folder-manager/:folderId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <CourseDetail collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      {/* New Courses Route */}
      <Route path="/courses" element={<PrivateRoute />}>
        <Route
          path="/courses"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Courses collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      {/* Course Tree Manager Route */}
      <Route path="/courses/tree-manager" element={<PrivateRoute />}>
        <Route
          path="/courses/tree-manager"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <CourseTreeManager collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/courses/:folderId"
        element={<PrivateRoute />}
      >
        <Route
          path="/courses/:folderId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Courses collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/profile/:username" element={<PrivateRoute />}>
        <Route
          path="/profile/:username"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <PublicUserProfile collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/classrooms"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/classrooms"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Classrooms collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      {/* New Redesigned Classrooms Route */}
      <Route path="/classrooms" element={<PrivateRoute />}>
        <Route
          path="/classrooms"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ClassroomsRedesigned collapsedWidth={collapsedWidth} sm={sm} />
            </React.Suspense>
          }
        />
      </Route>

      {/* New Classroom Detail Route */}
      <Route path="/classroom/:classroomId" element={<PrivateRoute />}>
        <Route
          path="/classroom/:classroomId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <ClassroomDetail collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/staff-classrooms"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/staff-classrooms"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <StaffClassrooms collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      {/* New Staff Rooms Route */}
      <Route path="/staff-rooms" element={<PrivateRoute />}>
        <Route
          path="/staff-rooms"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <StaffRooms collapsedWidth={collapsedWidth} sm={sm} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/classrooms/:classroomId"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/classrooms/:classroomId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Classroom collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/store/classrooms" element={<PrivateRoute />}>
        <Route
          path="/store/classrooms"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Classrooms collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/store/classrooms/:classroomId"
        element={<PrivateRoute />}
      >
        <Route
          path="/store/classrooms/:classroomId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Classroom collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/video-subtitles/folder-manager/:folderId"
        element={<PrivateRoute />}
      >
        <Route
          path="/video-subtitles/folder-manager/:folderId"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <CourseDetail collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/profile" element={<PrivateRoute />}>
        <Route
          path="/profile"
          exact
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Profile collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/setting" element={<PrivateRoute />}>
        <Route
          path="/setting"
          exact
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Setting collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/my-subscriptions" element={<PrivateRoute />}>
        <Route
          path="/my-subscriptions"
          exact
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <MySubscriptions collapsedWidth={collapsedWidth} />
            </React.Suspense>
          }
        />
      </Route>

      <Route path="/payment" element={<PrivateRoute />}>
        <Route
          path="/payment"
          element={
            // <React.Suspense
            //   fallback={<Skeleton active style={skeletonStyle} />}
            // >
            <Payment />
            // {/* </React.Suspense> */}
          }
        />
      </Route>

      <Route
        path="/payment-confirmation"
        exact
        element={<PrivateRoute />}
      >
        <Route
          path="/payment-confirmation"
          exact
          element={<PaymentConfirmation />}
        />
      </Route>

      <Route path="/cart" element={<PrivateRoute />}>
        <Route
          path="/cart"
          element={
            <React.Suspense
              fallback={<Skeleton active style={skeletonStyle} />}
            >
              <Payment />
            </React.Suspense>
          }
        />
      </Route>

      <Route
        path="/signup"
        exact
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <Signup md={md} />
          </React.Suspense>
        }
      />

      <Route
        path="/resetpassword"
        exact
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <ResetPassword md={md} />
          </React.Suspense>
        }
      />

      <Route path="/login" exact element={<Login md={md} />} />

      <Route
        path="/forgetpassword"
        exact
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <ForgotPassword md={md} />
          </React.Suspense>
        }
      />

      <Route
        path="/contact-us"
        exact
        element={
          <React.Suspense
            fallback={<Skeleton active style={skeletonStyle} />}
          >
            <ContactUs collapsedWidth={collapsedWidth} />
          </React.Suspense>
        }
      />

      <Route path="*" element={<Error />} />
    </Routes>
  );
}

export default AppRoutes;
