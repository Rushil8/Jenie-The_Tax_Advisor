
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let form = document.getElementById("registerForm");
let message = document.getElementById("message");

if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        let name = document.getElementById("name").value.trim();
        let username = document.getElementById("username").value.trim();
        let email = document.getElementById("email").value.trim();
        let phone = document.getElementById("phone_number").value.trim();
        let password = document.getElementById("password").value;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save additional profile data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                username: username,
                email: email,
                phone: phone,
                role: "user",
                createdAt: new Date().toISOString()
            });

            alert("Registration successful! Welcome to Jenie.");
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Firebase Error:", error.code, error.message);
            let errMsg = "Registration failed.";
            if (error.code === 'auth/email-already-in-use') {
                errMsg = "This email is already registered.";
            } else if (error.code === 'auth/weak-password') {
                errMsg = "Password is too weak. (Min 6 characters)";
            } else if (error.code === 'auth/invalid-email') {
                errMsg = "Invalid email format.";
            }
            alert(errMsg);
        }
    });
}
