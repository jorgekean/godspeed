// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDZ5oM3La4aGJDTSmFNLqsbao775b04ndk",
    authDomain: "godspeed-grader.firebaseapp.com",
    projectId: "godspeed-grader",
    storageBucket: "godspeed-grader.firebasestorage.app",
    messagingSenderId: "515597800644",
    appId: "1:515597800644:web:b374fa536875ca7b436591",
    measurementId: "G-76EBR7N58E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Auth
export const auth = getAuth(app);
const analytics = getAnalytics(app);