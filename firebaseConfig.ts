// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/analytics";
import "firebase/compat/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtlQeKWmLqtlIs0vJIVLoENDf_8I6cUiU",
  authDomain: "fir-salesforce-7eac7.firebaseapp.com",
  databaseURL: "https://fir-salesforce-7eac7-default-rtdb.firebaseio.com",
  projectId: "fir-salesforce-7eac7",
  storageBucket: "fir-salesforce-7eac7.firebasestorage.app",
  messagingSenderId: "629994465619",
  appId: "1:629994465619:web:af3d9179990a03288659a6",
  measurementId: "G-J4R6WW16JD"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const analytics = firebase.analytics();
const db = firebase.database();

export { app, analytics, db };