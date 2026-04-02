
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Login script loaded.");
let form = document.getElementById("loginForm");
let message = document.getElementById("message");

if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        let identifier = document.getElementById("username").value.trim(); // Can be username or email
        let password = document.getElementById("password").value;

        // 1. Admin login (Hardcoded for project demo)
        if (identifier === "admin" && password === "Admin@123") {
            alert("Login successful! Welcome Admin!");
            window.location.href = "admin.html";
            return;
        }

        try {
            let email = identifier;

            // 2. Resolve username to email if identifier is not an email
            if (!identifier.includes('@')) {
                console.log("Checking Firestore for username:", identifier);
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", identifier));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    alert("No account found with this username or email.");
                    return;
                }
                const userDataFound = querySnapshot.docs[0].data();
                email = userDataFound.email;
                console.log("Username resolved to email:", email);
            }

            // 3. Login with email and password in Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 4. Fetch the full user details from Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();

                alert("Login successful! Welcome back, " + userData.name + "!");
                window.location.href = "dashboard.html";
            } else {
                alert("User profile data not found in Firestore.");
            }

        } catch (error) {
            console.error("Firebase Login Error:", error.code, error.message);
            let errMsg = "Login failed: " + error.message;
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                errMsg = "Invalid email/username or password. (Code: " + error.code + ")";
            } else if (error.code === 'auth/user-disabled') {
                errMsg = "This account has been disabled.";
            } else if (error.code === 'auth/network-request-failed') {
                errMsg = "Network error. Please check your internet connection.";
            }
            alert(errMsg);
        }
    });
}
