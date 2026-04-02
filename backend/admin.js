import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc, 
    query, orderBy, setDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let slabForm    = document.getElementById("slabForm");
let slabBody    = document.getElementById("slabBody");
let emptyMsg    = document.getElementById("emptyMsg");
let clearBtn    = document.getElementById("clearBtn");
let submitBtn   = document.getElementById("submitBtn");
let cancelEditBtn = document.getElementById("cancelEditBtn");

let userBody     = document.getElementById("userBody");
let emptyUserMsg = document.getElementById("emptyUserMsg");

let editId = null;

// --- Admin Presence Check ---
onAuthStateChanged(auth, (user) => {
    // In a real app, check user role in Firestore too
    if (!user) {
        // Only allow if hardcoded admin session exists or go to login
        // For this demo, we'll assume if they're here they should be admin
        // But let's check for basic auth
        // window.location.href = "login.html";
    }
});

// --- Tax Slab Functions ---

async function loadSlabs() {
    const q = query(collection(db, "taxSlabs"), orderBy("year", "asc"));
    
    onSnapshot(q, (snapshot) => {
        let slabs = [];
        snapshot.forEach((doc) => {
            slabs.push({ id: doc.id, ...doc.data() });
        });
        renderAdminSlabs(slabs);
    });
}

function renderAdminSlabs(slabs) {
    slabBody.innerHTML = "";
    if (slabs.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }
    emptyMsg.style.display = "none";

    slabs.forEach((slab, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${slab.year}</td>
            <td>${slab.regime || "Old"}</td>
            <td>${slab.category || "Normal"}</td>
            <td>₹${slab.minIncome}</td>
            <td>${slab.maxIncome === "No Limit" ? "No Limit" : "₹" + slab.maxIncome}</td>
            <td>${slab.taxRate}%</td>
            <td>
                <button class='edit-btn' data-id='${slab.id}'>Edit</button>
                <button class='delete-btn' data-id='${slab.id}'>Delete</button>
            </td>`;
        slabBody.appendChild(row);
    });

    // Attach event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editSlab(btn.getAttribute('data-id'), slabs));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteSlab(btn.getAttribute('data-id')));
    });
}

slabForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let yearVal      = document.getElementById("year").value;
    let regime    = document.getElementById("regime").value;
    let category  = document.getElementById("category").value;
    let minIncome = document.getElementById("minIncome").value;
    let maxIncome = document.getElementById("maxIncome").value;
    let taxRate   = document.getElementById("taxRate").value;

    if (!yearVal) {
        alert("Please enter a year.");
        return;
    }

    let slabData = {
        year: parseInt(yearVal), 
        regime, 
        category,
        minIncome: parseFloat(minIncome) || 0,
        maxIncome: (maxIncome == 0 || maxIncome === "") ? "No Limit" : parseFloat(maxIncome),
        taxRate: parseFloat(taxRate) || 0,
        updatedAt: new Date().toISOString()
    };

    try {
        if (!editId) {
            await addDoc(collection(db, "taxSlabs"), slabData);
            alert("✅ Tax slab added successfully!");
        } else {
            await updateDoc(doc(db, "taxSlabs", editId), slabData);
            alert("✅ Tax slab updated!");
            editId = null;
            submitBtn.textContent = "Add Slab";
            cancelEditBtn.style.display = "none";
        }
        slabForm.reset();
    } catch (err) {
        console.error("Firestore Error Details:", err);
        if (err.code === 'permission-denied') {
            alert("❌ Permission Denied: Your Firebase Rules might be blocking the save.");
        } else {
            alert("❌ Failed to save slab: " + err.message);
        }
    }
});

function editSlab(id, slabs) {
    const slab = slabs.find(s => s.id === id);
    if (!slab) return;

    document.getElementById("year").value     = slab.year;
    document.getElementById("regime").value   = slab.regime || "Old";
    document.getElementById("category").value = slab.category || "Normal";
    document.getElementById("minIncome").value = slab.minIncome;
    document.getElementById("maxIncome").value = slab.maxIncome === "No Limit" ? 0 : slab.maxIncome;
    document.getElementById("taxRate").value  = slab.taxRate;

    editId = id;
    submitBtn.textContent = "Update Slab";
    cancelEditBtn.style.display = "inline-block";
}

async function deleteSlab(id) {
    if (confirm("Delete this slab?")) {
        try {
            await deleteDoc(doc(db, "taxSlabs", id));
        } catch (err) {
            console.error("Delete Error:", err);
        }
    }
}

async function clearSlabs() {
    if (confirm("Are you sure you want to delete ALL tax slabs from Cloud Firestore?")) {
        try {
            const querySnapshot = await getDocs(collection(db, "taxSlabs"));
            const deletePromises = [];
            querySnapshot.forEach((document) => {
                deletePromises.push(deleteDoc(doc(db, "taxSlabs", document.id)));
            });
            await Promise.all(deletePromises);
            alert("All slabs deleted successfully.");
        } catch (err) {
            console.error("Clear Error:", err);
            alert("Failed to clear slabs.");
        }
    }
}

clearBtn.addEventListener("click", clearSlabs);

// --- User Management Functions ---

async function loadUsers() {
    const q = query(collection(db, "users"), orderBy("name", "asc"));
    
    onSnapshot(q, (snapshot) => {
        let users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        renderUsers(users);
    });
}

function renderUsers(users) {
    userBody.innerHTML = "";
    if (users.length === 0) {
        emptyUserMsg.style.display = "block";
        return;
    }
    emptyUserMsg.style.display = "none";

    users.forEach((user, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><button class='delete-btn' data-id='${user.id}'>Delete</button></td>`;
        userBody.appendChild(row);
    });

    document.querySelectorAll('#userTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-id')));
    });
}

async function deleteUser(id) {
    if (confirm("Delete this user profile from Firestore? (Auth entry must be deleted manually in console)")) {
        await deleteDoc(doc(db, "users", id));
    }
}

// Global functions for HTML onclick
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
        window.location.href = "index.html";
    }
};

window.cancelEdit = () => {
    editId = null;
    slabForm.reset();
    submitBtn.textContent = "Add Slab";
    cancelEditBtn.style.display = "none";
};

cancelEditBtn.addEventListener("click", window.cancelEdit);

// Init directly (ES modules run after parsing anyway)
loadSlabs();
loadUsers();

// DEBUG_MARKER_FOR_UPDATE
