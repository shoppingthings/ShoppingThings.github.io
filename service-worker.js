const CACHE_NAME = 'shoppingthings-cache-v1';
// 캐시할 파일 목록: HTML에서 fetch하는 데이터 파일을 포함합니다.
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  '/service-worker.js',
  // --- 아이콘 파일 (manifest 및 html에 명시된 모든 파일) ---
  'images/icons/general/logo_shoppingthings_512h.png',
  'images/icons/general/symbol_shoppingthings_512h.ico',
  'images/icons/general/symbol_shoppingthings_512h.png',

  // --- 라이브러리 (CDN 파일을 오프라인에서 사용하려면 캐시 필요) ---
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap',
];

// 설치: 서비스 워커가 설치될 때 에셋을 캐시에 추가합니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets.');
        // 필수 리소스 캐시
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets during install:', error);
      })
  );
  self.skipWaiting(); // 설치 후 즉시 활성화
});

// 활성화: 오래된 캐시를 정리합니다.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // 서비스 워커가 즉시 페이지를 제어하도록 설정
});

// 가져오기: 네트워크 요청을 가로채 캐시된 응답을 제공합니다. (Cache-First 전략)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시 히트 시 캐시된 응답 반환
        if (response) {
          return response;
        }
        // 캐시 미스 시 네트워크 요청
        return fetch(event.request).then(
          (response) => {
            // 응답이 유효한 경우에만 캐시에 저장
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 응답 복사본을 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 캐시 목록에 있는 항목만 캐시하도록 추가 필터링이 필요할 수 있지만, 
                // 일단 네트워크에서 가져온 항목을 모두 캐시합니다.
                // CDN 자원은 CORS 문제로 type이 'opaque'일 수 있으나, fetch API가 처리합니다.
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});