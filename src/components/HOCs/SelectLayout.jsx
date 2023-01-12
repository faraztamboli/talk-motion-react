import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { noAuthLayoutPages } from "../../config/layoutConfig";

const selectLayout = (Layout) => {
  return function NewComponent(props) {
    const [isAuthLayout, setIsAuthLayout] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
      let path = location.pathname;

      // eslint-disable-next-line
      let firstPath = path === "/" ? "" : path.match(/^\/([^\/]+)/)[1];

      noAuthLayoutPages.includes(firstPath)
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
