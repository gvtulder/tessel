import { manifest, version } from "@parcel/service-worker";
import { clientsClaim, setCacheNameDetails } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

clientsClaim();

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
