import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import Login from "../pages/Login";
import Error from "../pages/Errors/404Error";
import { Skeleton } from "antd";
import ResetPassword from "../pages/ResetPassword";
import AuthPagesLoader from "../components/ui/AuthPagesLoader";
import Setting from "../pages/Setting";

// React lazy components
const Converter = React.lazy(() => import("../pages/Converter"));
const Trainer = React.lazy(() => import("../pages/Trainer"));
const Collector = React.lazy(() => import("../pages/Collector"));
const ModelTrainer = React.lazy(() => import("../pages/ModelTrainer"));
const UploadVideo = React.lazy(() => import("../components/ui/UploadVideo"));
const Models = React.lazy(() => import("../pages/Models"));
const MyModels = React.lazy(() => import("../pages/MyModels"));
const UserModel = React.lazy(() => import("../pages/UserModel"));
const ModelFiles = React.lazy(() => import("../pages/ModelFiles"));
const ModelConcepts = React.lazy(() => import("../pages/ModelConcepts"));
const ConceptDetails = React.lazy(() => import("../pages/ConceptDetails"));
const Profile = React.lazy(() => import("../pages/Profile"));
const Signup = React.lazy(() => import("../pages/Signup"));
const ForgotPassword = React.lazy(() => import("../pages/ForgotPassword"));

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
              <Converter sm={sm} md={md} collapsedWidth={collapsedWidth} />
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
              <Converter sm={sm} md={md} collapsedWidth={collapsedWidth} />
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
      <Route exact path="/models" element={<PrivateRoute />}>
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
      <Route path="*" element={<Error />} />
    </Routes>
  );
}

export default AppRoutes;
