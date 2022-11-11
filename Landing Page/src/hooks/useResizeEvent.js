import React from "react";

function useResizeEvent() {
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [sm, setSm] = React.useState(false);
  const [md, setMd] = React.useState(false);
  const [lg, setLg] = React.useState(false);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
    if (windowWidth <= 992) {
      setLg(true);
    } else {
      setLg(false);
    }
    if (windowWidth <= 768) {
      setMd(true);
    } else if (windowWidth > 768) {
      setMd(false);
    }
    if (windowWidth < 576) {
      setSm(true);
    } else if (windowWidth > 576) {
      setSm(false);
    }
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
      if (windowWidth <= 992) {
        setLg(true);
      } else {
        setLg(false);
      }
      if (windowWidth <= 768) {
        setMd(true);
      } else if (windowWidth > 768) {
        setMd(false);
      }
    });
  }, [windowWidth]);

  return { sm, md, lg };
}

export default useResizeEvent;
