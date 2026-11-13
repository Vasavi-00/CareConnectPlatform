import { useEffect, useRef } from "react";

/** Keep keyboard focus inside an open mobile navigation drawer. */
export default function useFocusTrap(active, onEscape) {
  const containerRef = useRef(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    if (!active || !containerRef.current) return undefined;
    const container = containerRef.current;
    const previousFocus = document.activeElement;
    const getFocusable = () => Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"));

    getFocusable()[0]?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onEscapeRef.current) {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [active]);

  return containerRef;
}
