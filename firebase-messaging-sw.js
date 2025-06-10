importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.js');

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNKVBtTlUtQ8WF06gmrAtFpiICkHh9CUs",
  authDomain: "findsafety-c108d.firebaseapp.com",
  projectId: "findsafety-c108d",
  storageBucket: "findsafety-c108d.firebasestorage.app",
  messagingSenderId: "317397918414",
  appId: "1:317397918414:web:3df759fac9fdbf2c28a69f",
  measurementId: "G-9FN0PTKJNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});