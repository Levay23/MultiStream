import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyApMgccqaL4fgzmmjkdEcDmTXTngw7R48Y",
  authDomain: "ventas-stream.firebaseapp.com",
  projectId: "ventas-stream",
  storageBucket: "ventas-stream.firebasestorage.app",
  messagingSenderId: "468433204890",
  appId: "1:468433204890:web:9475820f3cd5b41e4f5123",
  measurementId: "G-19X5XVCYDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };
