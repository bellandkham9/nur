"use client";

import { Suspense } from "react";

import QuizPlayContent from "./QuizPlayContent";

export default function QuizPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-6">
          <div className="w-full max-w-sm text-center">
            <div className="relative mx-auto mb-7 h-28 w-28">
              <div className="absolute inset-0 animate-ping rounded-4xl bg-emerald-100 opacity-60" />

              <div className="relative flex h-28 w-28 items-center justify-center rounded-4xl border border-emerald-100 bg-white text-6xl shadow-xl">
                🧠
              </div>
            </div>

            <div className="rounded-4xl border border-slate-100 bg-white p-7 shadow-sm">
              <h1 className="text-xl font-black text-slate-900">
                Préparation du quiz...
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Prépare-toi à apprendre en t'amusant ✨
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <QuizPlayContent />
    </Suspense>
  );
}