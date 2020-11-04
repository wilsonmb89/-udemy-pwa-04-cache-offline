//const cacheName = 'cache-1';

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';
const CACHE_DYNAMIC_LIMIT = 50;

const limpiarCache = (cacheName, numeroItems) => {
  caches.open(cacheName).then(
    cache => {
      return cache.keys().then(
        cacheKeys => {
          if (cacheKeys.length > numeroItems) {
            cache.delete(cacheKeys[0]).then(
              limpiarCache(cacheName, numeroItems)
            );
          }
        } 
      );
    }
  );
};

self.addEventListener('install', event => {

  const cachesPromise = caches.open(CACHE_STATIC_NAME).then(
    cache => {
      return cache.addAll([
        '/',
        'index.html',
        'css/style.css',
        'js/app.js'
      ]);
    }
  );

  const cachesInmutablePromise = caches.open(CACHE_INMUTABLE_NAME).then(
    cache => {
      return cache.add('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css');
    }
  );
  
  event.waitUntil(Promise.all([cachesPromise, cachesInmutablePromise]));
});

/**
 * 1- Cache Only
 * Se debe asegurar que todos los recursos se encuentren almacenados previamente
 * en el cache (usando el evento install)
 */
/* self.addEventListener('fetch', e => {
  e.respondWith(caches.open(cacheName).then(cache => cache.match(e.request)));
}); */

/**
 * 2- Cache with network fallback
 */
/* self.addEventListener('fetch', e => {
  const fetchRes = caches.match(e.request).then(
    objCache => {
      if (!!objCache) {
        return objCache;
      }
      return fetch(e.request).then(
        fetchObj => {
          caches.open(CACHE_DYNAMIC_NAME).then(
            cache => {
              cache.put(e.request, fetchObj);
              limpiarCache(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
            }
          );
          return fetchObj.clone();
        }
      );
    }
  )
  e.respondWith(fetchRes);
}); */

/**
 * 3- Network with cache fallback
 */
/* self.addEventListener('fetch', e => {
  const fetchRes = fetch(e.request).then(
    res => {
      if (!res) {
        return caches.match(e.request);
      }
      caches.open(CACHE_DYNAMIC_NAME).then(
        cache => {
          cache.put(e.request, res);
          limpiarCache(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
        }
      );
      return res.clone();
    }
  ).catch(err => caches.match(e.request));
  e.respondWith(fetchRes);
}); */

/**
 * 4- Cache with network update
 * Cuando el rendimiento es crítico
 */
/* self.addEventListener('fetch', e => {
  if (e.request.url.includes('bootstrap')) {
    return caches.match(e.request);
  }
  const fetchRes = caches.open(CACHE_STATIC_NAME).then(
    cache => {
      fetch(e.request).then(fetchObj => cache.put(e.request, fetchObj));
      return cache.match(e.request);
    }
  )
  e.respondWith(fetchRes);
}); */

/**
 * 5- Cache y network race
 */
self.addEventListener('fetch', e => {
  if (/\.(png|jpg)$/i.test(e.request.url)) {
    const cacheProm = caches.match(e.request).then(cacheObj => {
      if (!!cacheObj) {
        return cacheObj;
      }
      return fetch(e.request).then(
        fetchObj => {
          caches.open(CACHE_DYNAMIC_NAME).then(
            cache => {
              cache.put(e.request, fetchObj);
              limpiarCache(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
            }
          );
          return fetchObj.clone();
        }
      );
    });
    const networkProm = fetch(e.request).then(
      res => {
        if (!res) {
          return caches.match(e.request);
        }
        caches.open(CACHE_DYNAMIC_NAME).then(
          cache => {
            cache.put(e.request, res);
            limpiarCache(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
          }
        );
        return res.clone();
      }
    ).catch(err => caches.match(e.request));
    const raceProm = Promise.race([
      cacheProm,
      networkProm
    ]);
    e.respondWith(raceProm);
  }
})