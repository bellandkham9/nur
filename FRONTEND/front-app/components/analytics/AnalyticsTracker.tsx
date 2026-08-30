"use client";

import { useEffect } from "react";

import {
  trackAnalyticsEvent,
} from "@/lib/analytics";

import {
  initializeOfflineSync,
} from "@/lib/offlineSync";

export default function AnalyticsTracker() {
  useEffect(() => {
    // ========================================================
    // INITIALISATION SYNCHRONISATION
    // ========================================================

    initializeOfflineSync();

    // ========================================================
    // APP OPEN
    // ========================================================

    trackAnalyticsEvent(
      "APP_OPEN",
    );

    // ========================================================
    // PAGE VIEW
    // ========================================================

    trackAnalyticsEvent(
      "PAGE_VIEW",
    );

    // ========================================================
    // ONLINE
    // ========================================================

    const handleOnline = () => {
      trackAnalyticsEvent(
        "ONLINE",
      );
    };

    // ========================================================
    // OFFLINE
    // ========================================================

    const handleOffline = () => {
      trackAnalyticsEvent(
        "OFFLINE",
      );
    };

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    // ========================================================
    // PWA INSTALL
    // ========================================================

    const handleAppInstalled = () => {
      trackAnalyticsEvent(
        "PWA_INSTALL",
      );
    };

    window.addEventListener(
      "appinstalled",
      handleAppInstalled,
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled,
      );
    };
  }, []);

  return null;
}