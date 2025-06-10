importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDNKVBtTlUtQ8WF06gmrAtFpiICkHh9CUs",
  authDomain: "findsafety-c108d.firebaseapp.com",
  projectId: "findsafety-c108d",
  storageBucket: "findsafety-c108d.firebaseapp.com",
  messagingSenderId: "317397918414",
  appId: "1:317397918414:web:3df759fac9fdbf2c28a69f",
  measurementId: "G-9FN0PTKJNJ"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/firebase-logo.png' // optional
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});