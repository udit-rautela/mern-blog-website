import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyDiS7K-SwpTCyQK5Gx3sTdZmah6osC8dnA",
  authDomain: "reactjs-blogging-website-d6bea.firebaseapp.com",
  projectId: "reactjs-blogging-website-d6bea",
  storageBucket: "reactjs-blogging-website-d6bea.firebasestorage.app",
  messagingSenderId: "892568999233",
  appId: "1:892568999233:web:0c6e7d277fd74ca9d4fdc0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// google auth provider

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
    let user = null;

    await signInWithPopup(auth, provider)
    .then((result) => {
        user = result.user;
    })
    .catch((error) => {
        console.log(error);
    });

    return user;
}