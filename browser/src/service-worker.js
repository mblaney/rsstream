/* eslint-disable no-restricted-globals */

import {clientsClaim} from "workbox-core"
import {precacheAndRoute, createHandlerBoundToURL} from "workbox-precaching"
import {registerRoute} from "workbox-routing"
import {CacheFirst} from "workbox-strategies"
import {RangeRequestsPlugin} from "workbox-range-requests"
import {imageCache, googleFontsCache} from "workbox-recipes"

clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$")
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({request, url}) => {
    // If this isn't a navigation, skip.
    if (request.mode !== "navigate") {
      return false
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith("/_")) {
      return false
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false
    } // Return true to signal that we want to use the handler.

    return true
  },
  createHandlerBoundToURL("/index.html"),
)

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Any other custom service worker logic can go here.
imageCache({maxAgeSeconds: 14 * 24 * 60 * 60, maxEntries: 5000})
googleFontsCache()

// Cache audio and video for offline playback. No hard quota — the browser
// manages eviction.
registerRoute(
  ({request}) => request.destination === "audio",
  new CacheFirst({
    cacheName: "audio",
    plugins: [new RangeRequestsPlugin()],
  }),
)

registerRoute(
  ({request}) => request.destination === "video",
  new CacheFirst({
    cacheName: "video",
    plugins: [new RangeRequestsPlugin()],
  }),
)
