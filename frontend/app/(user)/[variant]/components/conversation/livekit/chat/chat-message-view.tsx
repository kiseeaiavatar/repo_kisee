"use client";

import { cn } from "@/lib/utils";

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const ChatMessageView = ({ className, children, ...props }: ChatProps) => {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
};
