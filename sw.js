const CACHE_NAME = 'quran-scheduler-v3'; // **مهم جدًا: قم بزيادة الرقم مع كل تحديث**

const URLS_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'data/quran_juzs.js',
  'data/quran_pages.js',
  'data/quran_rubs.js',
  'data/quran_surahs.js'
  // ملاحظة: لا نضع رابط خط جوجل هنا لأنه قد يتغير ويسبب مشاكل في الكاش
];

// التثبيت: تخزين كل الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // تفعيل الـ SW الجديد فورًا
  );
});

// التفعيل: حذف أي كاش قديم
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // السيطرة على الصفحات المفتوحة فورًا
  );
});

// اعتراض الطلبات: استراتيجية "الكاش أولاً"
self.addEventListener('fetch', (event) => {
  // لا نطبق الكاش على طلبات جوجل فونتس
  if (event.request.url.indexOf('fonts.googleapis.com') > -1 || event.request.url.indexOf('fonts.gstatic.com') > -1) {
    return; // دع الطلب يذهب إلى الشبكة كالمعتاد
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا وجدنا نسخة في الكاش، نرجعها. وإلا، نطلبها من الشبكة.
        return response || fetch(event.request);
      })
  );
});