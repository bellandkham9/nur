"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  DailyQuote,
} from "@/types/dailyQuote";

import {
  getTodayQuote,
  getQuoteById,
} from "@/lib/dailyQuotes";

import {
  getCurrentQuoteMoment,
} from "@/lib/dailyQuoteMoment";


export function useDailyQuote() {

  const [
    quote,
    setQuote,
  ] = useState<DailyQuote | null>(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  useEffect(() => {

    let cancelled = false;


    async function loadQuote() {

      try {

        setLoading(true);
        setError(null);


        /* ==================================================
           VÉRIFICATION D'UN QUOTE_ID
           ================================================== */

        const params =
          new URLSearchParams(
            window.location.search
          );


        const quoteIdParam =
          params.get("quote_id");


        /* ==================================================
           CITATION PRÉCISE
           ================================================== */

        if (quoteIdParam) {

          const quoteId =
            Number(quoteIdParam);


          if (
            Number.isInteger(quoteId)
            && quoteId > 0
          ) {

            console.log(
              "📖 Chargement citation #",
              quoteId
            );


            const result =
              await getQuoteById(
                quoteId
              );


            if (!cancelled) {
              setQuote(result);
            }


            return;
          }
        }


        /* ==================================================
           CITATION DU JOUR
           ================================================== */

        const moment =
          getCurrentQuoteMoment();


        console.log(
          "📖 Chargement citation du jour :",
          moment
        );


        const result =
          await getTodayQuote(
            moment
          );


        if (!cancelled) {
          setQuote(result);
        }

      } catch (err) {

        console.error(
          "Erreur chargement citation :",
          err
        );


        if (!cancelled) {

          setError(
            "Impossible de charger la citation."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadQuote();


    return () => {
      cancelled = true;
    };

  }, []);


  return {
    quote,
    loading,
    error,
  };
}