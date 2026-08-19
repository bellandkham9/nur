"use client";

import { useRouter } from "next/navigation";

import DailyQuoteCard from "@/components/daily-quotes/DailyQuoteCard";
import { useDailyQuote } from "@/hooks/useDailyQuote";


export default function DailyQuotesPage() {

  const router = useRouter();

  const {
    quote,
    loading,
    error,
  } = useDailyQuote();


  return (
    <main className="mx-auto max-w-3xl p-6">

      {/* ======================================================
          RETOUR
          ====================================================== */}

      <button
        type="button"
        onClick={() => router.back()}
        className="
          mb-6
          flex
          items-center
          gap-2
          text-sm
          font-medium
          opacity-70
          transition
          hover:opacity-100
        "
      >
        <span className="text-lg">
          ←
        </span>

        Retour
      </button>


      {/* ======================================================
          TITRE
          ====================================================== */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          Parole du jour
        </h1>

        <p className="mt-1 text-sm opacity-60">
          Une pensée pour accompagner votre journée.
        </p>

      </div>


      {/* ======================================================
          CHARGEMENT
          ====================================================== */}

      {loading && (
        <div className="rounded-2xl border p-6">
          <p className="text-sm opacity-70">
            Chargement de la Parole du jour...
          </p>
        </div>
      )}


      {/* ======================================================
          ERREUR
          ====================================================== */}

      {!loading && error && (
        <div className="rounded-2xl border p-6">

          <p className="text-sm text-red-500">
            {error}
          </p>

        </div>
      )}


      {/* ======================================================
          AUCUNE CITATION
          ====================================================== */}

      {!loading && !error && !quote && (
        <div className="rounded-2xl border p-6">

          <p className="text-sm opacity-70">
            Aucune parole n'est disponible pour ce moment.
          </p>

        </div>
      )}


      {/* ======================================================
          CITATION
          ====================================================== */}

      {!loading && !error && quote && (
        <DailyQuoteCard
          quote={quote}
        />
      )}

    </main>
  );
}