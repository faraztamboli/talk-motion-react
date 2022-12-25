import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import UploadVideo from "../components/ui/UploadVideo";
import Login from "../pages/Login";
import Error from "../pages/Errors/404Error";
import { Skeleton } from "antd";

// React lazy components
const Converter = React.lazy(() => import("../pages/Converter"));
const Trainer = React.lazy(() => import("../pages/Trainer"));
const Models = React.lazy(() => import("../pages/Models"));
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
      <Route path="/uploadvideo" element={<PrivateRoute />}>
        <Route
          path="/uploadvideo"
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
      <Route
        path="my-models"
        exact
        element={
          <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
            <Profile collapsedWidth={collapsedWidth} />
          </React.Suspense>
        }
      />
      <Route
        path="profile"
        exact
        element={
          <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
            <Profile collapsedWidth={collapsedWidth} />
          </React.Suspense>
        }
      />
      <Route
        path="setting"
        exact
        element={
          <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
            <Profile collapsedWidth={collapsedWidth} />
          </React.Suspense>
        }
      />
      <Route
        path="/signup"
        exact
        element={
          <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
            <Signup md={md} />
          </React.Suspense>
        }
      />

      <Route path="/login" exact element={<Login md={md} />} />

      <Route
        path="/forgetpassword"
        exact
        element={
          <React.Suspense fallback={<Skeleton active style={skeletonStyle} />}>
            <ForgotPassword md={md} />
          </React.Suspense>
        }
      />
      <Route path="*" element={<Error />} />
    </Routes>
  );
}

export default AppRoutes;
