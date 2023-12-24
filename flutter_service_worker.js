'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"version.json": "776f75c752d569a490528e07798d8072",
"index.html": "f304831b4520779f45c53680c7e10e0c",
"/": "f304831b4520779f45c53680c7e10e0c",
"main.dart.js": "a99be6a62b93f77f14cbd3fcbbf1916a",
"flutter.js": "6fef97aeca90b426343ba6c5c9dc5d4a",
"favicon.png": "22ce9e2c4e204bba7ab6819a4a857bd8",
"icons/favicon.ico": "a9e9c29d9f8975d8c8db690612d89443",
"icons/apple-touch-icon.png": "f1546563ce6f321882ab584001a99014",
"icons/icon-192.png": "3e0b0a52d162026d710fdc9949592012",
"icons/icon-192-maskable.png": "e24ac2d508053a46844fbc9dcd24fcd7",
"icons/icon-512-maskable.png": "22ce9e2c4e204bba7ab6819a4a857bd8",
"icons/README.txt": "d3df3991a31f034bfa98afdfa3c622e1",
"icons/icon-512.png": "de6540271f7763ba7e2a1bb04091ade6",
"manifest.json": "12aef3b73765db7e36056ed5cca2da8c",
"assets/AssetManifest.json": "c5632ec559e778bcb67c8d9887cde24c",
"assets/NOTICES": "d768238865a59ff11cdd61b96db6a2c4",
"assets/FontManifest.json": "1e2b2284e66a9e54db0bfe7ac4f8d5d6",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "57d849d738900cfd590e9adc7e208250",
"assets/shaders/ink_sparkle.frag": "f8b80e740d33eb157090be4e995febdf",
"assets/AssetManifest.bin": "d6eadf44400e00b7323da2c7c78d1d82",
"assets/fonts/MaterialIcons-Regular.otf": "d9fb6adc6bb0673841b98d71eab16e42",
"assets/assets/images/loginEmote.png": "80fbf7ba335438be819ca086c8e9a855",
"assets/assets/images/logo.png": "1bdeef413f94ec3a8b5ec4ac54f2a36c",
"assets/assets/images/awards/til.png": "29bcab21c96b5e777fd3b3373d784bc9",
"assets/assets/images/awards/helpful.png": "72c9575d678ee05777487f35ced7513d",
"assets/assets/images/awards/plusone.png": "170b80f51d4c1f40772b9ea5ad1917c8",
"assets/assets/images/awards/rocket.png": "6d1fd63191f8649764d903ae0c7fc333",
"assets/assets/images/awards/thankyou.png": "d2a970a4aa259609c1d933f3981bceac",
"assets/assets/images/awards/awesomeanswer.png": "48dd19b8245739c3b265db345a75c0bf",
"assets/assets/images/awards/gold.png": "16626cd5b64ca33df639428b6868ad29",
"assets/assets/images/awards/platinum.png": "e7b2641a5f76806d1e4e40663c3a4825",
"assets/assets/images/google.png": "a343e13eee5ddcac9eb154cea0bcf575",
"assets/assets/fonts/MyFlutterApp.ttf": "895f3c72794e34c1ed7c168407088c1e",
"canvaskit/skwasm.js": "1df4d741f441fa1a4d10530ced463ef8",
"canvaskit/skwasm.wasm": "6711032e17bf49924b2b001cef0d3ea3",
"canvaskit/chromium/canvaskit.js": "8c8392ce4a4364cbb240aa09b5652e05",
"canvaskit/chromium/canvaskit.wasm": "fc18c3010856029414b70cae1afc5cd9",
"canvaskit/canvaskit.js": "76f7d822f42397160c5dfc69cbc9b2de",
"canvaskit/canvaskit.wasm": "f48eaf57cada79163ec6dec7929486ea",
"canvaskit/skwasm.worker.js": "19659053a277272607529ef87acf9d8a"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
