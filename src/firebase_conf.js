// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getMessaging } from 'firebase/messaging'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1qyTHr5dAJpNWqJYa92wVEJu5l8oMmxA",
  authDomain: "project-2-8d8ee.firebaseapp.com",
  projectId: "project-2-8d8ee",
  storageBucket: "project-2-8d8ee.firebasestorage.app",
  messagingSenderId: "918274351948",
  appId: "1:918274351948:web:5274dcd6cbac57d2b925e9"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)

export const messaging = getMessaging(firebaseApp)