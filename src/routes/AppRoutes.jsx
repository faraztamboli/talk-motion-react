import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import FlagRoute from "../components/flags/FlagRoute";
import Login from "../pages/Login";
import Error from "../pages/Errors/404Error";
import { Skeleton } from "antd";
import ResetPassword from "../pages/ResetPassword";
import AuthPagesLoader from "../components/ui/AuthPagesLoader";
import Setting from "../pages/Setting";
// import Payment from "../components/ui/Payment";
// import Payment from "../components/ui/TestCheckoutForm";

// React lazy components
const Converter = React.lazy(() => import("../pages/Converter"));
const ModelsPage = React.lazy(() => import("../features/models/ModelsPage"));
const StorePage = React.lazy(() => import("../features/store/StorePage"));
const CartPage = React.lazy(() => import("../features/store/CartPage"));
const CheckoutPage = React.lazy(() => import("../features/store/CheckoutPage"));
const CheckoutCompletePage = React.lazy(() => import("../features/store/CheckoutCompletePage"));
const PurchasesPage = React.lazy(() => import("../features/store/PurchasesPage"));
const ModelPage = React.lazy(() => import("../features/models/ModelPage"));
const ModelOverview = React.lazy(() => import("../features/models/ModelOverview"));
const ConceptsTab = React.lazy(() => import("../features/models/ConceptsTab"));
const ConceptSamples = React.lazy(() => import("../features/models/ConceptSamples"));
const CollectTab = React.lazy(() => import("../features/models/CollectTab"));
const TrainTab = React.lazy(() => import("../features/models/TrainTab"));
const TrainersTab = React.lazy(() => import("../features/models/TrainersTab"));
const SettingsTab = React.lazy(() => import("../features/models/SettingsTab"));

/** Suspense boundary for a lazy page or tab. */
function Page({ children }) {
  return <React.Suspense fallback={<Skeleton active style={{ padding: "24px" }} />}>{children}</React.Suspense>;
}

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
// // const Payment = React.lazy(() => import("../components/ui/Payment"));
const ForgotPassword = React.lazy(() =>
  import("../pages/ForgotPassword")
);
const ContactUs = React.lazy(() => import("../pages/ContactUs"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
// TalkMotion 2.0 Conversation Mode
const ConversationStart = React.lazy(() =>
  import("../features/conversation/pages/ConversationStart")
);
const ConversationPage = React.lazy(() =>
  import("../features/conversation/pages/ConversationPage")
);
const JoinPage = React.lazy(() => import("../features/conversation/pages/JoinPage"));
const ConversationHistory = React.lazy(() =>
  import("../features/conversation/pages/ConversationHistory")
);
const LocationsPage = React.lazy(() => import("../features/locations/LocationsPage"));
const LocationDetail = React.lazy(() => import("../features/locations/LocationDetail"));
const AnalyticsPage = React.lazy(() => import("../features/admin/AnalyticsPage"));
const GuestConversationPage = React.lazy(() =>
  import("../features/conversation/pages/GuestConversationPage")
);
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
      {/* Models hub. /models lists your models; /models/:modelId has tabs for words and phrases,
          recording, training, trainers and settings. The old trainer pages and model lists
          redirect into it, and the store moved to /store/models. */}
      <Route path="/models" element={<FlagRoute flag="legacy_models_visible" />}>
        <Route index element={<Page><ModelsPage /></Page>} />
        <Route path="training-models" element={<Navigate to="/models?show=trainable" replace />} />
        <Route path=":modelId" element={<Page><ModelPage /></Page>}>
          <Route index element={<Page><ModelOverview /></Page>} />
          <Route path="concepts" element={<Page><ConceptsTab /></Page>} />
          <Route path="concepts/:concept" element={<Page><ConceptSamples /></Page>} />
          <Route path="collect" element={<Page><CollectTab /></Page>} />
          <Route path="train" element={<Page><TrainTab /></Page>} />
          <Route path="trainers" element={<Page><TrainersTab /></Page>} />
          <Route path="settings" element={<Page><SettingsTab /></Page>} />
          <Route path="files" element={<Navigate to="../concepts" replace />} />
        </Route>
      </Route>
      <Route path="/store" element={<FlagRoute flag="legacy_models_visible" />}>
        <Route path="models" element={<Page><StorePage /></Page>} />
        <Route path="cart" element={<Page><CartPage /></Page>} />
        <Route path="checkout" element={<Page><CheckoutPage /></Page>} />
        <Route path="checkout/complete" element={<Page><CheckoutCompletePage /></Page>} />
        <Route path="purchases" element={<Page><PurchasesPage /></Page>} />
      </Route>
      <Route path="/cart" element={<Navigate to="/store/cart" replace />} />
      <Route path="/payment" element={<Navigate to="/store/checkout" replace />} />
      <Route path="/payment-confirmation" element={<Navigate to="/store/purchases" replace />} />
      <Route path="/my-subscriptions" element={<Navigate to="/store/purchases" replace />} />
      <Route path="/my-models" element={<Navigate to="/models" replace />} />
      <Route path="/trainer/*" element={<Navigate to="/models" replace />} />

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

      {/* Conversation Mode (TalkMotion 2.0 API). Signed-in owners need conversation_v2;
          joining by code is public, because the person joining may have no account. */}
      <Route
        path="/conversation"
        element={<FlagRoute flag="conversation_v2" auth="api" fallback="404" />}
      >
        <Route
          path="/conversation"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <ConversationStart />
            </React.Suspense>
          }
        />
        <Route
          path="history"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <ConversationHistory />
            </React.Suspense>
          }
        />
        <Route
          path=":conversationId"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <ConversationPage />
            </React.Suspense>
          }
        />
      </Route>

      {/* Venue locations (pharmacies, clinics) and platform analytics: API session only. */}
      <Route path="/locations" element={<PrivateRoute auth="api" />}>
        <Route
          path="/locations"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <LocationsPage />
            </React.Suspense>
          }
        />
        <Route
          path=":locationId"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <LocationDetail />
            </React.Suspense>
          }
        />
      </Route>
      <Route path="/admin/analytics" element={<PrivateRoute auth="api" />}>
        <Route
          path="/admin/analytics"
          element={
            <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
              <AnalyticsPage />
            </React.Suspense>
          }
        />
      </Route>
      <Route
        path="/join"
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <JoinPage />
          </React.Suspense>
        }
      />
      <Route
        path="/c/:code"
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <JoinPage />
          </React.Suspense>
        }
      />
      <Route
        path="/join/live/:conversationId"
        element={
          <React.Suspense fallback={<AuthPagesLoader />}>
            <GuestConversationPage />
          </React.Suspense>
        }
      />

      <Route path="*" element={<Error />} />
    </Routes>
  );
}

export default AppRoutes;
