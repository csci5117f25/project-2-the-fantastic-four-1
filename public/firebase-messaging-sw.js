importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA1qyTHr5dAJpNWqJYa92wVEJu5l8oMmxA",
  authDomain: "project-2-8d8ee.firebaseapp.com",
  projectId: "project-2-8d8ee",
  storageBucket: "project-2-8d8ee.firebasestorage.app",
  messagingSenderId: "918274351948",
  appId: "1:918274351948:web:5274dcd6cbac57d2b925e9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png'
  });
});