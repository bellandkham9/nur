"use client";

import { useEffect, useRef } from "react";

import {
  enablePushNotifications,
  isPushSupported,
} from "@/lib/push";

export default function PushNotificationManager() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    const initializePush = async () => {
      console.log(
        "🚀 PushNotificationManager chargé",
      );

      if (!isPushSupported()) {
        console.warn(
          "❌ Web Push non supporté par ce navigateur.",
        );

        return;
      }

      console.log(
        "🔎 Initialisation Push...",
      );

      try {
        const subscription =
          await enablePushNotifications();

        console.log(
          "✅ Push activé !",
          subscription,
        );

      } catch (error) {
        console.error(
          "❌ Initialisation Push échouée :",
          error,
        );
      }
    };

    initializePush();
  }, []);

  return null;
}