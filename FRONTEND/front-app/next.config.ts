import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",

  register: true,

  swSrc: "service-worker/sw-custom.js",

  skipWaiting: true,

  /*
   * IMPORTANT :
   *
   * La page d'accueil peut varier selon que
   * l'utilisateur est connecté ou non.
   *
   * On évite donc de la considérer comme une
   * start URL statique à mettre automatiquement
   * en cache.
   */
  cacheStartUrl: false,

  /*
   * Le Service Worker est désactivé en développement.
   * Cela évite énormément de faux problèmes de cache
   * pendant le développement.
   */
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

