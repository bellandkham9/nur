"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { enablePushNotifications } from "@/lib/push";

export default function PushNotificationManager() {
  const initialized = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // Ne jamais initialiser Push sur les pages publiques
    if (
      pathname === "/login" ||
      pathname === "/register"
    ) {
      console.log(
        "🔕 Push ignoré : utilisateur non connecté"
      );

      return;
    }

    // Vérifier qu'un token existe
    const accessToken =
      localStorage.getItem("access_token");

    if (!accessToken) {
      console.log(
        "🔕 Push ignoré : aucun token d'accès"
      );

      return;
    }

    if (initialized.current) {
      return;
    }

    initialized.current = true;

    console.log(
      "🚀 PushNotificationManager chargé"
    );

    console.log(
      "🔎 Initialisation Push..."
    );

    const initializePush = async () => {
      try {
        const subscription =
          await enablePushNotifications();

        console.log(
          "📡 Abonnement Push final :",
          subscription
        );
      } catch (error) {
        console.error(
          "❌ Initialisation des notifications impossible :",
          error
        );
      }
    };

    initializePush();
  }, [pathname]);

  return null;
}