import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const selectLayout = (Layout) => {
  return function NewComponent(props) {
    const [isAuthLayout, setIsAuthLayout] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
      location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname === "/forgetpassword"
        ? setIsAuthLayout(() => true)
        : setIsAuthLayout(() => false);
    }, [isAuthLayout, location.pathname]);

    return isAuthLayout !== true ? (
      <Layout {...props} />
    ) : (
      <>{props.children}</>
    );
  };
};

export default selectLayout;
