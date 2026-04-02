import { auth, db } from "../backend/firebase-config.js";
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});

window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

window.resetPassword = async () => {
    const user = auth.currentUser;
    if (user && user.email) {
        try {
            await sendPasswordResetEmail(auth, user.email);
            alert("Password reset email sent to " + user.email);
        } catch (error) {
            console.error("Reset Error:", error);
            alert("Failed to send reset email.");
        }
    }
};

window.clearData = () => {
    if(confirm("Are you sure you want to log out? Your cloud profile will remain intact.")) {
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    }
};
