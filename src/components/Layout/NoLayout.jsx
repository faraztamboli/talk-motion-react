import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const selectLayout = (Layout) => {
  return function NewComponent(props) {
    const [isAuthLayout, setIsAuthLayout] = useState(false);
    const location = useLocation();

    const noAuthLayoutPages = [
      "",
      "converter",
      "trainer",
      "models",
      "profile",
      "my-models",
      "setting",
      "uploadvideo",
    ];

    React.useEffect(() => {
      noAuthLayoutPages.includes(location.pathname.slice(1))
        ? setIsAuthLayout(() => false)
        : setIsAuthLayout(() => true);
    }, [isAuthLayout, location.pathname]);

    return isAuthLayout !== true ? (
      <>
        <Layout {...props} />
      </>
    ) : (
      <>{props.children}</>
    );
  };
};

export default selectLayout;
