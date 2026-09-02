"use client";

import { Suspense } from "react";

import QuizPlayContent from "./QuizPlayContent";

function QuizLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-5">
      <div className="w-full max-w-sm">
        <div className="relative mx-auto mb-7 h-28 w-28">
          <div className="absolute inset-0 animate-ping rounded-4xl bg-emerald-100 opacity-70" />

          <div className="relative flex h-28 w-28 items-center justify-center rounded-4xl border-4 border-white bg-linear-to-br from-emerald-400 to-emerald-600 text-6xl shadow-[0_8px_0_#159447]">
            🧠
          </div>
        </div>

        <div className="rounded-4xl border border-slate-100 bg-white p-7 text-center shadow-xl">
          <div className="mx-auto mb-4 flex items-center justify-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
          </div>

          <h1 className="text-xl font-black text-slate-950">
            Préparation du quiz...
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Nous préparons tes questions.
            <br />
            Prépare-toi à relever le défi ✨
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-linear-to-r from-emerald-400 to-emerald-600" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QuizPlayPage() {
  return (
    <Suspense fallback={<QuizLoading />}>
      <QuizPlayContent />
    </Suspense>
  );
}