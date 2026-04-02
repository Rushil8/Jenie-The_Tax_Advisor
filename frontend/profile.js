import { auth, db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let profileName = document.getElementById("profileName");
let profileUsername = document.getElementById("profileUsername");
let profileEmail = document.getElementById("profileEmail");
let profilePhone = document.getElementById("profilePhone");
let profileRole = document.getElementById("profileRole");

// UI Elements for history
let historyTable = document.getElementById("historyTable");
let historyBody = document.getElementById("historyBody");
let noHistoryMsg = document.getElementById("noHistoryMsg");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadProfile(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

async function loadProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            profileName.textContent = userData.name || "N/A";
            profileUsername.textContent = userData.username || "N/A";
            profileEmail.textContent = userData.email || "N/A";
            profilePhone.textContent = userData.phone || "N/A";
            if (profileRole) profileRole.textContent = (userData.role || "user").toUpperCase();

            await loadHistory(uid);
        } else {
            profileName.textContent = "Profile not found";
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

async function loadHistory(uid) {
    try {
        const historyRef = collection(db, "users", uid, "taxHistory");
        const q = query(historyRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            noHistoryMsg.style.display = "none";
            historyTable.style.display = "table";
            historyBody.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const calc = doc.data();
                
                // Handle Firebase Timestamp or String date
                let displayDate = "N/A";
                if (calc.timestamp) {
                    if (typeof calc.timestamp.toDate === 'function') {
                        displayDate = calc.timestamp.toDate().toLocaleString();
                    } else {
                        displayDate = new Date(calc.timestamp).toLocaleString();
                    }
                } else if (calc.date) {
                    displayDate = calc.date;
                }

                let row = document.createElement("tr");
                row.style.borderBottom = "1px solid var(--border-color)";
                row.style.color = "var(--text-secondary)";
                row.style.transition = "background-color 0.2s ease";
                
                row.innerHTML = `
                    <td style='padding: 12px 10px;'>${displayDate}</td>
                    <td style='padding: 12px 10px;'>${calc.year}</td>
                    <td style='padding: 12px 10px;'>₹${Number(calc.grossIncome).toLocaleString("en-IN")}</td>
                    <td style='padding: 12px 10px;'>₹${Number(calc.netTaxable).toLocaleString("en-IN")}</td>
                    <td style='padding: 12px 10px; font-weight: bold; color: var(--text-primary); text-align: right;'>₹${Number(calc.totalTax).toLocaleString("en-IN")}</td>
                `;
                historyBody.appendChild(row);
            });
        } else {
            noHistoryMsg.style.display = "block";
            historyTable.style.display = "none";
        }
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

window.toggleEdit = () => {
    let isEditing = document.getElementById("editName").style.display === "block";
    
    if (!isEditing) {
        document.getElementById("editName").value = profileName.textContent;
        document.getElementById("editEmail").value = profileEmail.textContent;
        document.getElementById("editPhone").value = profilePhone.textContent;
        
        profileName.style.display = "none";
        profileEmail.style.display = "none";
        profilePhone.style.display = "none";
        
        document.getElementById("editName").style.display = "block";
        document.getElementById("editEmail").style.display = "block";
        document.getElementById("editPhone").style.display = "block";
        
        document.getElementById("editBtn").style.display = "none";
        document.getElementById("saveBtn").style.display = "inline-block";
    }
};

window.saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    let nameVal = document.getElementById("editName").value.trim();
    let emailVal = document.getElementById("editEmail").value.trim();
    let phoneVal = document.getElementById("editPhone").value.trim();
    
    if (!nameVal) { alert("Name cannot be empty."); return; }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
        alert("Please enter a valid email address.");
        return;
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phoneVal)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }
    
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name: nameVal,
            email: emailVal,
            phone: phoneVal
        });

        profileName.textContent = nameVal;
        profileEmail.textContent = emailVal;
        profilePhone.textContent = phoneVal;

        document.getElementById("editName").style.display = "none";
        document.getElementById("editEmail").style.display = "none";
        document.getElementById("editPhone").style.display = "none";
        
        profileName.style.display = "block";
        profileEmail.style.display = "block";
        profilePhone.style.display = "block";
        
        document.getElementById("saveBtn").style.display = "none";
        document.getElementById("editBtn").style.display = "inline-block";
        
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Update Error:", error);
        alert("Failed to update profile in Firestore.");
    }
}
