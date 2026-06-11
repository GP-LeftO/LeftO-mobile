/* Firebase Cloud Messaging service worker — handles background web push.
   Served at the site root (Expo copies /public to the export root). */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA2chgZMmffmf1EdNSPf3VD4ZRftUR9wl4",
  authDomain: "lefto-6f61b.firebaseapp.com",
  projectId: "lefto-6f61b",
  storageBucket: "lefto-6f61b.firebasestorage.app",
  messagingSenderId: "654325071291",
  appId: "1:654325071291:web:d871714affc221f992d89e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const n = (payload && payload.notification) || {};
  self.registration.showNotification(n.title || "LeftO", {
    body: n.body || "",
    icon: "/favicon.ico",
    data: (payload && payload.data) || {},
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
