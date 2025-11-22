import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBh77_xORlcrZsDrQ6jzdQYamCjjeSpRDw",
    authDomain: "algorooms-e39f2.firebaseapp.com",
    projectId: "algorooms-e39f2",
    storageBucket: "algorooms-e39f2.appspot.com",
    messagingSenderId: "635317290241",
    appId: "1:635317290241:web:85d37592b6aafb8a850700",
    measurementId: "G-T1M7WNL1ZW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, googleProvider };
