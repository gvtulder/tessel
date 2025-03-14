import { manifest, version } from "@parcel/service-worker";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

clientsClaim();

self.addEventListener("install", (evt) => {
  console.log(evt);
});

self.addEventListener("waiting", (evt) => {
  console.log(evt);
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

setCacheNameDetails({
  prefix: "tilegame",
  suffix: version,
});

precacheAndRoute(
  manifest.map((url) => ({
    url: url,
    revision: version,
  })),
);

cleanupOutdatedCaches();
