"use client";

import { DM_Mono } from "next/font/google";
import Link from "next/link";
import { MouseEventHandler } from "react";

const font = DM_Mono({
  weight: "400",
  subsets: ["latin"],
});

export function Button({
  className = "",
  kind = "primary",
  onClick,
  href,
  children,
  disabled = false,
}: Readonly<{
  className?: string;
  kind?: "primary" | "secondary" | "icon";
  onClick?: MouseEventHandler;
  href?: string;
  children: React.ReactNode;
  disabled: boolean;
}>) {
  const cnBase = `px-16 py-3 rounded-3xl ${className} ${font.className}`;

  let cn = "";
  if (kind == "primary") {
    cn = `${cnBase} bg-primary-500 text-white hover:bg-primary-300 hover:text-primary-500`;
  } else if (kind == "secondary") {
    cn = `${cnBase} bg-secondary-500 text-black hover:bg-green-500 hover:text-green-800`;
  }

  if (kind == "icon") {
    cn = "bg-primary-300 rounded-[100%] p-3 hover:bg-primary-400";
  }

  if (disabled) {
    cn = `${cn} opacity-75 pointer-events-none`;
  }

  if (href) {
    return (
      <Link className={cn} href={{ pathname: href }}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn} {...(onClick && { onClick })} disabled={disabled}>
      {children}
    </button>
  );
}
