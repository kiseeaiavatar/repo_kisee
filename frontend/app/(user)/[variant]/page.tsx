"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  return (
    <div className="h-full bg-secondary-500 flex justify-center">
      <div className="m-auto p-8">
        <Link href={`${pathname}/start`}>
          <p className="text-center text-white mb-16 text-2xl">
            Willkommen
            <br />
            bei
          </p>
          <Image src="/your-wai-logo.svg" alt="Your wAI Logo" width={620} height={280} />
        </Link>
      </div>
    </div>
  );
}
