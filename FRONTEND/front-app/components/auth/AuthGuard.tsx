
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = [
  "/login",
  "/register",
];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    if (
      PUBLIC_PATHS.some(
        (path) =>
          pathname === path ||
          pathname.startsWith(`${path}/`)
      )
    ) {
      setChecking(false);
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace(
        `/login?next=${encodeURIComponent(
          pathname
        )}`
      );

      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-3xl">
            🌿
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Vérification de votre session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}