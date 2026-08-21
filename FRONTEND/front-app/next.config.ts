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

  disable: process.env.NODE_ENV === "development",
})(nextConfig);