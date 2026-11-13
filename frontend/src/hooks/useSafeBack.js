import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Go back only when React Router has a known in-app entry; direct links use a local fallback. */
export default function useSafeBack(fallback) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const previousPath = location.state?.from?.pathname;
    if (previousPath && previousPath !== location.pathname) {
      navigate(-1);
      return;
    }

    const historyIndex = window.history.state?.idx;
    if (Number.isInteger(historyIndex) && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(fallback, { replace: true });
  }, [fallback, location.pathname, location.state, navigate]);
}
