import { useEffect, useRef } from "react";

export default function useAutoScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const resizeObserver = new ResizeObserver(scrollToBottom);
      resizeObserver.observe(scrollRef.current);
      scrollToBottom();

      return () => resizeObserver.disconnect();
    }
  }, [scrollRef]);

  return {
    scrollRef,
    scrollToBottom,
  };
}
