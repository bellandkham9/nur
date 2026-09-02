"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useQuizMusic } from "@/lib/quiz/useQuizMusic";

type QuizCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  question_count: number;
};

const QUESTION_COUNTS = [5, 10, 20];

export default function QuizPage() {
  const router = useRouter();
  const { playEffect } = useQuizMusic();

  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    null,
  );
  const [questionCount, setQuestionCount] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch("/api/quiz/categories/");

      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Impossible de charger les catégories du quiz.",
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedCategoryData = useMemo(
    () => categories.find((category) => category.id === selectedCategory),
    [categories, selectedCategory],
  );

  const startQuiz = () => {
    playEffect("click");

    const params = new URLSearchParams();

    if (selectedCategory !== null) {
      params.set("category", String(selectedCategory));
    }

    params.set("count", String(questionCount));

    router.push(`/quiz/play?${params.toString()}`);
  };

  const handleBack = () => {
    playEffect("click");
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6faf8] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="mx-auto h-8 w-44 rounded-full bg-slate-200" />
            <div className="mx-auto mt-5 h-12 w-72 rounded-2xl bg-slate-200" />
            <div className="mx-auto mt-4 h-5 w-full max-w-xl rounded-lg bg-slate-200" />

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <div className="h-36 rounded-3xl bg-white shadow-sm" />
              <div className="h-36 rounded-3xl bg-white shadow-sm" />
              <div className="h-36 rounded-3xl bg-white shadow-sm" />
              <div className="h-36 rounded-3xl bg-white shadow-sm" />
            </div>

            <div className="mt-8 h-40 rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6faf8] text-slate-800">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-8">
        {/* TOP NAVIGATION */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-600 active:translate-y-0"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1">
              ←
            </span>
            <span>Accueil</span>
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm sm:flex">
            <span>🧠</span>
            Quiz Bahá&apos;í
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm">
            {categories.length} catégories
          </div>
        </div>

        {/* HERO */}
        <section className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 shadow-sm">
            <span>✨</span>
            Apprends en t&apos;amusant
          </div>

          <div className="relative mx-auto mb-6 w-fit">
            <div className="absolute inset-0 rounded-[2rem] bg-emerald-300/30 blur-xl" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border-4 border-white bg-linear-to-br from-emerald-400 to-emerald-600 text-5xl shadow-[0_10px_0_#159447]">
              🧠
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Quiz Bahá&apos;í
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Teste tes connaissances, découvre de nouvelles choses et gagne de
            l&apos;XP à chaque bonne réponse.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                😕
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-black text-red-800">
                  Impossible de charger les catégories
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={loadCategories}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700 active:scale-95"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CARD */}
        <div className="mx-auto max-w-4xl">
          {/* STEP 1 */}
          <section className="mb-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                    1
                  </span>

                  <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                    Ton parcours
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Choisis une catégorie
                </h2>
              </div>
            </div>

            {/* ALL */}
            <button
              type="button"
              onClick={() => {
                playEffect("click");
                setSelectedCategory(null);
              }}
              className={`group mb-4 w-full overflow-hidden rounded-3xl border-2 text-left transition-all duration-200 ${
                selectedCategory === null
                  ? "border-emerald-500 bg-emerald-50 shadow-[0_5px_0_#10b981]"
                  : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4 p-5 sm:p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 text-3xl shadow-[0_4px_0_#159447]">
                  🌎
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-950 sm:text-lg">
                      Toutes les catégories
                    </h3>

                    {selectedCategory === null && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Un mélange de toutes les connaissances bahá&apos;íes.
                  </p>
                </div>

                <span className="hidden text-2xl text-emerald-400 sm:block">
                  ✦
                </span>
              </div>
            </button>

            {/* CATEGORIES */}
            {categories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {categories.map((category) => {
                  const selected = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        playEffect("click");
                        setSelectedCategory(category.id);
                      }}
                      className={`group relative overflow-hidden rounded-3xl border-2 p-5 text-left transition-all duration-200 sm:p-6 ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 shadow-[0_5px_0_#10b981]"
                          : "border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                      }`}
                    >
                      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-100/60 transition-transform duration-500 group-hover:scale-125" />

                      <div className="relative flex items-start gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm"
                          style={{
                            backgroundColor: category.color || "#e8f7ef",
                          }}
                        >
                          {category.icon || "📚"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-black text-slate-950 sm:text-lg">
                              {category.name}
                            </h3>

                            {selected && (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                                ✓
                              </span>
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {category.description}
                          </p>

                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                            <span>📝</span>
                            {category.question_count} questions
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              !error && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div className="text-4xl">📚</div>
                  <p className="mt-3 font-black text-slate-700">
                    Aucune catégorie disponible
                  </p>
                </div>
              )
            )}
          </section>

          {/* STEP 2 */}
          <section className="mb-8">
            <div className="mb-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-white">
                  2
                </span>

                <span className="text-xs font-black uppercase tracking-[0.16em] text-sky-600">
                  Durée du défi
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Combien de questions ?
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {QUESTION_COUNTS.map((count) => {
                const selected = questionCount === count;

                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      playEffect("click");
                      setQuestionCount(count);
                    }}
                    className={`relative overflow-hidden rounded-3xl border-2 p-4 transition-all duration-200 sm:p-6 ${
                      selected
                        ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[0_5px_0_#0ea5e9]"
                        : "border-slate-200 bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">
                        ✓
                      </span>
                    )}

                    <div className="text-3xl font-black sm:text-4xl">
                      {count}
                    </div>

                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider opacity-60 sm:text-xs">
                      questions
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* PREVIEW */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="bg-linear-to-r from-emerald-50 via-white to-sky-50 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  🎵
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">
                    Ambiance
                  </p>

                  <h3 className="mt-1 font-black text-slate-900">
                    Une expérience sonore t&apos;attend
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Musique de fond, effets de réponse, compte à rebours et
                    petites interactions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="px-2 text-center">
                <div className="text-2xl font-black text-slate-950 sm:text-3xl">
                  {questionCount}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">
                  Questions
                </div>
              </div>

              <div className="px-2 text-center">
                <div className="text-2xl sm:text-3xl">⏱️</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">
                  30 s / question
                </div>
              </div>

              <div className="px-2 text-center">
                <div className="text-2xl sm:text-3xl">🏆</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">
                  Défi
                </div>
              </div>
            </div>

            {selectedCategoryData && (
              <div className="mt-4 border-t border-slate-100 pt-4 text-center">
                <span className="text-xs font-bold text-slate-400">
                  Parcours sélectionné :
                </span>

                <span className="ml-1 text-xs font-black text-emerald-600">
                  {selectedCategoryData.name}
                </span>
              </div>
            )}
          </section>

          {/* START */}
          <button
            type="button"
            onClick={startQuiz}
            disabled={categories.length === 0}
            className="group relative w-full overflow-hidden rounded-3xl bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-lg font-black text-white shadow-[0_7px_0_#159447] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_0_#159447] active:translate-y-1 active:shadow-[0_3px_0_#159447] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span>Commencer le quiz</span>
              <span className="text-2xl transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>

            <span className="absolute inset-y-0 -left-24 w-20 rotate-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[120%]" />
          </button>

          <p className="mt-4 text-center text-xs font-semibold text-slate-400">
            Tu peux quitter le quiz à tout moment.
          </p>
        </div>
      </div>
    </main>
  );
}