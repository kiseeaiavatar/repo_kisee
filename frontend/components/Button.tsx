"use client";

import Link from "next/link";
import { MouseEventHandler } from "react";

export function Button({
  className = "",
  kind = "primary",
  onClick,
  href,
  children,
}: Readonly<{
  className?: string;
  kind?: "primary" | "secondary" | "icon";
  onClick?: MouseEventHandler;
  href?: string;
  children: React.ReactNode;
}>) {
  const cnBase = `px-16 py-3 rounded-3xl ${className}`;

  let cn = "";
  if (kind == "primary") {
    cn = `${cnBase} bg-primary-500 text-white hover:bg-primary-300 hover:text-primary-500`;
  } else if (kind == "secondary") {
    cn = `${cnBase} bg-green-800 text-white hover:bg-green-500 hover:text-green-800`;
  }

  if (kind == "icon") {
    cn = "bg-primary-300 rounded-[100%] p-3 hover:bg-primary-400";
  }

  if (href) {
    return (
      <Link className={cn} href={{ pathname: href }}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn} {...(onClick && { onClick })}>
      {children}
    </button>
  );
}
