import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const navigationHandler: RuntimeCaching = {
  matcher: ({ request }) => request.mode === "navigate",
  handler: new NetworkFirst({
    cacheName: "pages",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [navigationHandler, ...defaultCache],
  fallbacks: {
    entries: [
      {
        matcher: ({ request }) => request.mode === "navigate",
        url: "/offline",
      },
    ],
  },
});

serwist.addEventListeners();
