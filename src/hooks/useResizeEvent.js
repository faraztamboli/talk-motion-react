import React from "react";

function useResizeEvent() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [collapsedWidth, setCollapsedWidth] = React.useState(80);
  const [sideBarWidth, setSideBarWidth] = React.useState(200);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [md, setMd] = React.useState(false);
  const [sm, setSm] = React.useState(false);

  const onCollapsed = () => {
    setCollapsed(!collapsed);
  };

  React.useEffect(() => {
    if (windowWidth <= 768) {
      setMd(true);
    } else if (windowWidth > 768) {
      setMd(false);
    }
    if (windowWidth <= 576) {
      setSm(true);
      setCollapsedWidth(0);
      setSideBarWidth(60);
      setCollapsed(true);
    } else if (windowWidth > 576) {
      setSm(false);
      setCollapsedWidth(60);
      setSideBarWidth(200);
    }
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
      if (windowWidth <= 768) {
        setMd(true);
      } else if (windowWidth > 768) {
        setMd(false);
      }
      if (windowWidth < 576) {
        setCollapsedWidth(0);
        setSideBarWidth(60);
        setCollapsed(true);
      } else if (windowWidth > 576) {
        setCollapsedWidth(80);
        setSideBarWidth(200);
      }
    });
  }, [windowWidth, collapsedWidth]);

  return { collapsed, collapsedWidth, onCollapsed, sideBarWidth, md, sm };
}

export default useResizeEvent;
