import { initializeApp } from "firebase/app"
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw"

const firebaseConfig = { 
  apiKey: "AIzaSyA1qyTHr5dAJpNWqJYa92wVEJu5l8oMmxA",
  authDomain: "project-2-8d8ee.firebaseapp.com",
  projectId: "project-2-8d8ee",
  storageBucket: "project-2-8d8ee.firebasestorage.app",
  messagingSenderId: "918274351948",
  appId: "1:918274351948:web:5274dcd6cbac57d2b925e9"
};

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, { body, icon: '/pwa-192x192.png' })
})