// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCohFsqy8DTRYcUqS0aWHWqWN1keM4EXl8',
  authDomain: 'xsync-64254.firebaseapp.com',
  projectId: 'xsync-64254',
  storageBucket: 'xsync-64254.appspot.com',
  messagingSenderId: '927946827172',
  appId: '1:927946827172:web:9207c10fa7af282e498d31',
  measurementId: 'G-PEBXP5PYDF',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const database = getFirestore(app);
export const storage = getStorage();
