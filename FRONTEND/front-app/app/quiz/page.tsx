"use client";

import { useEffect, useState } from "react";
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

  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [questionCount, setQuestionCount] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // CHARGEMENT DES CATÉGORIES
  // ----------------------------------------------------------

  const { playEffect } = useQuizMusic();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch("/api/quiz/categories/");

      setCategories(data);
    } catch (err: any) {
      console.error(err);

      setError(err?.message || "Impossible de charger les catégories du quiz.");
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    playEffect("click");

    window.location.href = "/";
  };

  // ----------------------------------------------------------
  // COMMENCER
  // ----------------------------------------------------------

  function startQuiz() {
    const params = new URLSearchParams();

    if (selectedCategory !== null) {
      params.set("category", String(selectedCategory));
    }

    params.set("count", String(questionCount));

    router.push(`/quiz/play?${params.toString()}`);
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="mx-auto h-10 w-64 rounded-xl bg-gray-200" />

            <div className="mx-auto h-5 w-80 rounded-lg bg-gray-200" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-36 rounded-3xl bg-gray-200" />
              <div className="h-36 rounded-3xl bg-gray-200" />
              <div className="h-36 rounded-3xl bg-gray-200" />
              <div className="h-36 rounded-3xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-800">
      {/* =====================================================
          DÉCORATION
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute -right-20 top-80 h-72 w-72 rounded-full bg-yellow-200/30 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="mb-10 text-center">
          {/* petit badge */}

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            <span>✨</span>
            <span>Apprends en t'amusant</span>
          </div>

          {/* icône */}

          <div className="mx-auto mb-5 flex h-24 w-24 animate-[float_3s_ease-in-out_infinite] items-center justify-center rounded-4xl bg-emerald-500 text-5xl shadow-[0_8px_0_#159447]">
            🧠
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Quiz Bahá'í
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500 md:text-lg">
            Teste tes connaissances, découvre de nouvelles choses et gagne de
            l'XP au fil de tes réponses.
          </p>
        </section>

        {/* =====================================================
            ERREUR
        ====================================================== */}

        {error && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">😕</span>

              <div>
                <div className="font-bold">Impossible de charger le quiz</div>

                <p className="mt-1 text-sm">{error}</p>

                <button
                  type="button"
                  onClick={loadCategories}
                  className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            CARD PRINCIPALE
        ====================================================== */}

        <div className="mx-auto max-w-4xl">
          {/* =================================================
              CATÉGORIE
          ================================================== */}

          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                  Étape 1
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Choisis ton parcours
                </h2>
              </div>

              <span className="hidden text-sm font-medium text-slate-400 sm:block">
                {categories.length} catégories
              </span>
            </div>

            {/* Toutes les catégories */}

            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`mb-4 w-full rounded-3xl border-2 p-5 text-left transition-all duration-200 ${
                selectedCategory === null
                  ? "border-emerald-500 bg-emerald-50 shadow-[0_5px_0_#10b981]"
                  : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-3xl shadow-[0_4px_0_#159447]">
                  🌎
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900">
                      Toutes les catégories
                    </h3>

                    {selectedCategory === null && (
                      <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Un mélange de toutes les connaissances bahá'íes.
                  </p>
                </div>

                <div className="hidden text-sm font-bold text-slate-400 sm:block">
                  ∞
                </div>
              </div>
            </button>

            {/* Catégories */}

            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category) => {
                const selected = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative overflow-hidden rounded-3xl border-2 p-5 text-left transition-all duration-200 ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-[0_5px_0_#10b981]"
                        : "border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                    }`}
                  >
                    {/* décoration */}

                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/50 transition-transform duration-300 group-hover:scale-125" />

                    <div className="relative flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm"
                        style={{
                          backgroundColor: category.color || "#e8f7ef",
                        }}
                      >
                        {category.icon || "📚"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-black text-slate-900">
                            {category.name}
                          </h3>

                          {selected && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                              ✓
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                          {category.description}
                        </p>

                        <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                          📝 {category.question_count} questions
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* =================================================
              NOMBRE DE QUESTIONS
          ================================================== */}

          <section className="mb-8">
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-wide text-sky-600">
                Étape 2
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
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
                    onClick={() => setQuestionCount(count)}
                    className={`relative rounded-2xl border-2 px-4 py-5 font-black transition-all duration-200 ${
                      selected
                        ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[0_4px_0_#0ea5e9]"
                        : "border-slate-200 bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-sky-300"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 text-sm">✓</span>
                    )}

                    <div className="text-2xl">{count}</div>

                    <div className="mt-1 text-xs font-bold uppercase tracking-wide opacity-60">
                      questions
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* =================================================
              AMBIANCE
          ================================================== */}

          <section className="mb-8 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-3xl shadow-[0_4px_0_#d4a900]">
                🎵
              </div>

              <div className="flex-1">
                <h3 className="font-black text-slate-900">
                  Une ambiance sonore t'attend !
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Musique de fond, sons de réussite, erreurs, compte à rebours
                  et petites interactions.
                </p>
              </div>

              <div className="hidden text-2xl sm:block">🔊</div>
            </div>
          </section>

          {/* =================================================
              RÉSUMÉ
          ================================================== */}

          <section className="mb-6 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {questionCount}
                </div>

                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Questions
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-emerald-500">⚡</div>

                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  XP à gagner
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-yellow-500">🏆</div>

                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Défi
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              BOUTON COMMENCER
          ================================================== */}
          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-slate-500 transition hover:bg-white hover:text-emerald-600"
            >
              <span className="transition group-hover:-translate-x-1">←</span>
              Retour à l'acceuil
            </button>

            <button
              type="button"
              onClick={startQuiz}
              className="group relative w-full overflow-hidden rounded-2xl bg-emerald-500 px-6 py-5 text-lg font-black text-white shadow-[0_6px_0_#159447] transition-all duration-150 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_8px_0_#159447] active:translate-y-1 active:shadow-[0_3px_0_#159447]"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <span>Commencer le quiz</span>

                <span className="text-2xl transition-transform duration-200 group-hover:translate-x-1">
                  🚀
                </span>
              </span>

              {/* shine */}

              <span className="absolute inset-y-0 -left-20 w-16 rotate-12 bg-white/20 blur-sm transition-all duration-700 group-hover:left-[120%]" />
            </button>
          </div>
          {/* =================================================
              PETITE INFO
          ================================================== */}

          <p className="mt-5 text-center text-xs font-medium text-slate-400">
            💡 Prends ton temps, lis attentivement chaque question et amuse-toi
            !
          </p>
        </div>
      </div>

      {/* =====================================================
          ANIMATION CSS
      ====================================================== */}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </main>
  );
}
