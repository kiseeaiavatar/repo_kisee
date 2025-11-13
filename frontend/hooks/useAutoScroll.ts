import { type RefObject, useEffect, useRef } from "react";

export default function useAutoScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function scrollToBottom() {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }

    if (scrollRef.current) {
      const resizeObserver = new ResizeObserver(scrollToBottom);

      resizeObserver.observe(scrollRef.current);
      scrollToBottom();

      return () => resizeObserver.disconnect();
    }
  }, [scrollRef]);

  return {
    scrollRef,
  };
}
