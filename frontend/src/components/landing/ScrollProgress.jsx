import { useEffect, useState } from "react";

function ScrollProgress() {

  const [progress, setProgress] =
    useState(0);

  useEffect(() => {

    const updateProgress = () => {

      const scrollTop =
        window.scrollY;

      const documentHeight =
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      const percentage =
        documentHeight > 0
          ? (scrollTop / documentHeight) * 100
          : 0;

      setProgress(percentage);
    };

    window.addEventListener(
      "scroll",
      updateProgress
    );

    updateProgress();

    return () =>
      window.removeEventListener(
        "scroll",
        updateProgress
      );

  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "4px",
        background: "#0b5ed7",
        zIndex: 9999,
      }}
    />
  );
}

export default ScrollProgress;