"use client";

import { useDailyQuote } from "@/hooks/useDailyQuote";

import DailyQuoteCard
  from "./DailyQuoteCard";


export default function DailyQuoteSection() {

  const {
    quote,
    loading,
    error,
  } = useDailyQuote();


  if (loading) {
    return (
      <section className="rounded-2xl border p-6">
        <p>Chargement de la parole du jour...</p>
      </section>
    );
  }


  if (error) {
    return (
      <section className="rounded-2xl border p-6">
        <p>{error}</p>
      </section>
    );
  }


  if (!quote) {
    return (
      <section className="rounded-2xl border p-6">
        <p>
          Aucune parole disponible pour ce moment.
        </p>
      </section>
    );
  }


  return (
    <DailyQuoteCard
      quote={quote}
    />
  );
}