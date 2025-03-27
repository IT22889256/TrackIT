import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';S
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCeLlWvGNwH4pWEJE8cPojqF25oxWt3zS0",
  authDomain: "trackit-3e5e3.firebaseapp.com",
  databaseURL: "https://trackit-3e5e3-default-rtdb.firebaseio.comS",
  projectId: "trackit-3e5e3",
  storageBucket: "trackit-3e5e3.firebasestorage.app",
  messagingSenderId: "562674376018",
  appId: "1:562674376018:web:7718363ecf713a14e76e8b",
  measurementId: "G-0EF0HG3V61",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app };
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
