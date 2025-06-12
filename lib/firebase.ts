import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const firebaseConfig = {
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

// Initialize messaging only in the browser
let messaging: ReturnType<typeof getMessaging> | undefined;
if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

// Request permission to send notifications
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn("Firebase messaging is not initialized in this environment.");
    return;
  }
  try {
    const permission = Notification.permission;
    if (permission === "denied") {
      console.error("Notification permission has been blocked by the user.");
      return;
    }
    const token = await getToken(messaging, { vapidKey: 'BKwbQvPYoLai6IUt2B0D-xdJARhE93UbJDI6cH4lxOqC7HIkyR_r8erpiYeH8IbqCTCXCMUScZw_tilXHW--6b4' });
    if (token) {
      console.log('Notification permission granted. Token:', token);
      // Send the token to your server to save it
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

// Handle incoming messages
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // Customize how you handle the notification here
  });
}