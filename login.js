import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
    apiKey: "AIzaSyBjnfrqymhhE88LkFBIrC7tvV7YyXRCTh4",
    authDomain: "sgelar-web-store.firebaseapp.com",
    projectId: "sgelar-web-store",
    storageBucket: "sgelar-web-store.firebasestorage.app",
    messagingSenderId: "984584108456",
    appId: "1:984584108456:web:51ca48c53cbf16d459059d",
    measurementId: "G-Q0FD7RSMQQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// =========================
// REDIRECT AFTER LOGIN
// =========================
function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect === "cart") {
        window.location.href = "cart.html";
    } else {
        window.location.href = "index.html";
    }
}

// =========================
// LOGIN
// =========================
window.login = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        redirectAfterLogin(); // ✅ THIS WAS MISSING
    } catch (e) {
        alert(e.message);
    }
};

// =========================
// SIGN UP
// =========================
window.signup = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        redirectAfterLogin(); // ✅ THIS WAS MISSING
    } catch (e) {
        alert(e.message);
    }
};
