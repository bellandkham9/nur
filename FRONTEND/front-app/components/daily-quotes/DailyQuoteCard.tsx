"use client";

import type { DailyQuote } from "@/types/dailyQuote";


interface DailyQuoteCardProps {
  quote: DailyQuote;
}


export default function DailyQuoteCard({
  quote,
}: DailyQuoteCardProps) {

  const momentLabel =
    quote.moment === "MORNING"
      ? "Parole du matin"
      : "Parole du soir";


  return (
    <section
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        text-gray-900
        shadow-sm
        dark:border-gray-700
        dark:bg-gray-900
        dark:text-gray-100
      "
    >

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}

      <div className="mb-4">

        <p className="text-sm font-medium opacity-70">
          {momentLabel}
        </p>

        <p className="text-xs opacity-50">
          {quote.date}
        </p>

      </div>


      {/* ======================================================
          TEXTE
          ====================================================== */}

      <blockquote
        className="
          text-lg
          leading-relaxed
          font-medium
        "
      >

        « {quote.text} »

      </blockquote>


      {/* ======================================================
          SOURCE
          ====================================================== */}

      <div className="mt-5">

        {quote.author && (
          <p className="font-semibold">
            {quote.author}
          </p>
        )}

        {quote.source && (
          <p className="text-sm opacity-70">
            {quote.source}
          </p>
        )}

        {quote.source_reference && (
          <p className="text-sm opacity-60">
            {quote.source_reference}
          </p>
        )}

      </div>

    </section>
  );
}