// اسم الكاش الخاص بالتطبيق. غيّره عند تحديث أي ملف من ملفات التطبيق
const CACHE_NAME = 'quran-scheduler-v1';

// قائمة الملفات التي سيتم تخزينها في الكاش
const URLS_TO_CACHE = [
  '.', // هذا يعني index.html
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'data/quran_juzs.js',
  'data/quran_pages.js',
  'data/quran_rubs.js',
  'data/quran_surahs.js',
  // رابط خط جوجل مهم جدًا لتجنب أخطاء الأوفلاين
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap'
];

// 1. تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// 2. تفعيل الـ Service Worker وحذف أي كاش قديم
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
    })
  );
});

// 3. اعتراض طلبات الشبكة وإرجاع نسخة من الكاش إذا كانت متاحة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا وجدنا نسخة في الكاش، نرجعها
        if (response) {
          return response;
        }
        // وإلا، نطلبها من الشبكة
        return fetch(event.request);
      }
    )
  );
});