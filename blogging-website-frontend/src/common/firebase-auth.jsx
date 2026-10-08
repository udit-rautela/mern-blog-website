import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const getFirebaseAuth = () => {
    const {
        VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_APP_ID
    } = import.meta.env;

    const missingSettings = [
        ["VITE_FIREBASE_API_KEY", VITE_FIREBASE_API_KEY],
        ["VITE_FIREBASE_AUTH_DOMAIN", VITE_FIREBASE_AUTH_DOMAIN],
        ["VITE_FIREBASE_PROJECT_ID", VITE_FIREBASE_PROJECT_ID],
        ["VITE_FIREBASE_APP_ID", VITE_FIREBASE_APP_ID]
    ].filter(([, value]) => !value).map(([name]) => name);

    if (missingSettings.length) {
        throw new Error(`Google sign-in is not configured. Set ${missingSettings.join(", ")}.`);
    }

    const firebaseConfig = {
        apiKey: VITE_FIREBASE_API_KEY,
        authDomain: VITE_FIREBASE_AUTH_DOMAIN,
        projectId: VITE_FIREBASE_PROJECT_ID,
        appId: VITE_FIREBASE_APP_ID
    };
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    return getAuth(app);
};

export const authWithGoogle = async () => {
    const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    return result.user.getIdToken();
};
