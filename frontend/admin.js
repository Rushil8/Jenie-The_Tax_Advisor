let slabForm = document.getElementById("slabForm");
let slabBody = document.getElementById("slabBody");
let emptyMsg = document.getElementById("emptyMsg");
let clearBtn = document.getElementById("clearBtn");
let submitBtn = document.getElementById("submitBtn");
let cancelEditBtn = document.getElementById("cancelEditBtn");

let userBody = document.getElementById("userBody");
let emptyUserMsg = document.getElementById("emptyUserMsg");

let editIndex = -1;

// Global variables
let allGlobalSlabs = [];
const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:5000"
    : "https://your-online-app.onrender.com";

async function fetchFromGlobal() {
    try {
        let res = await fetch(API_BASE + "/api/slabs");
        let data = await res.json();
        
        allGlobalSlabs = data.slabs.map((s, index) => ({
            id: index + 1,
            year: s.year,
            regime: s.regime,
            category: s.category,
            minIncome: s.min_income,
            maxIncome: s.max_income == null ? "No Limit" : s.max_income,
            taxRate: s.tax_rate
        }));
        
        renderAdminSlabs();
    } catch (err) {
        console.error("Server unavailable. Fallback to local.", err);
        allGlobalSlabs = JSON.parse(localStorage.getItem("taxSlabs")) || [];
        renderAdminSlabs();
    }
}

async function syncToGlobal() {
    try {
        await fetch(API_BASE + "/api/slabs/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slabs: allGlobalSlabs })
        });
        localStorage.setItem("taxSlabs", JSON.stringify(allGlobalSlabs)); // Fallback UI caching
    } catch(err) {
        console.error(err);
    }
}

fetchFromGlobal(); // Initialize admin table
loadUsers();

slabForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let year = document.getElementById("year").value;
    let regime = document.getElementById("regime").value;
    let category = document.getElementById("category").value;
    let minIncome = document.getElementById("minIncome").value;
    let maxIncome = document.getElementById("maxIncome").value;
    let taxRate = document.getElementById("taxRate").value;

    if (editIndex === -1) {
        let newSlab = {
            id: allGlobalSlabs.length + 1,
            year: year,
            regime: regime,
            category: category,
            minIncome: minIncome,
            maxIncome: maxIncome == 0 ? "No Limit" : maxIncome,
            taxRate: taxRate
        };
        allGlobalSlabs.push(newSlab);
        alert("Tax slab saved globally!");
    } else {
        allGlobalSlabs[editIndex].year = year;
        allGlobalSlabs[editIndex].regime = regime;
        allGlobalSlabs[editIndex].category = category;
        allGlobalSlabs[editIndex].minIncome = minIncome;
        allGlobalSlabs[editIndex].maxIncome = maxIncome == 0 ? "No Limit" : maxIncome;
        allGlobalSlabs[editIndex].taxRate = taxRate;
        alert("Tax slab updated globally!");
        editIndex = -1;
        submitBtn.textContent = "Add Slab";
        cancelEditBtn.style.display = "none";
    }

    await syncToGlobal();
    slabForm.reset();
    renderAdminSlabs();
});

cancelEditBtn.addEventListener("click", function () {
    editIndex = -1;
    submitBtn.textContent = "Add Slab";
    cancelEditBtn.style.display = "none";
    slabForm.reset();
});

function renderAdminSlabs() {
    slabBody.innerHTML = "";
    if (allGlobalSlabs.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }
    emptyMsg.style.display = "none";

    allGlobalSlabs.forEach(function (slab, index) {
        let catDisplay = slab.category || "Normal";
        let regDisplay = slab.regime || "Old";
        let row = document.createElement("tr");
        row.innerHTML =
            "<td>" + (index + 1) + "</td>" +
            "<td>" + slab.year + "</td>" +
            "<td>" + regDisplay + "</td>" +
            "<td>" + catDisplay + "</td>" +
            "<td>₹" + slab.minIncome + "</td>" +
            "<td>" + (slab.maxIncome === "No Limit" ? "No Limit" : "₹" + slab.maxIncome) + "</td>" +
            "<td>" + slab.taxRate + "%</td>" +
            "<td>" +
            "<button class='edit-btn' onclick='editSlab(" + index + ")'>Edit</button>" +
            "<button class='delete-btn' onclick='deleteSlab(" + index + ")'>Delete</button>" +
            "</td>";
        slabBody.appendChild(row);
    });
}

function editSlab(index) {
    let slab = allGlobalSlabs[index];

    document.getElementById("year").value = slab.year;
    document.getElementById("regime").value = slab.regime || "Old";
    document.getElementById("category").value = slab.category || "Normal";
    document.getElementById("minIncome").value = slab.minIncome;
    document.getElementById("maxIncome").value = slab.maxIncome === "No Limit" ? 0 : slab.maxIncome;
    document.getElementById("taxRate").value = slab.taxRate;

    editIndex = index;
    submitBtn.textContent = "Update Slab";
    cancelEditBtn.style.display = "inline-block";
}

async function deleteSlab(index) {
    allGlobalSlabs.splice(index, 1);
    await syncToGlobal();
    renderAdminSlabs();
}

clearBtn.addEventListener("click", async function () {
    if (confirm("Are you sure you want to delete ALL global tax slabs?")) {
        allGlobalSlabs = [];
        await syncToGlobal();
        renderAdminSlabs();
    }
});

function loadUsers() {
    userBody.innerHTML = "";
    let users = [];
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key === "taxSlabs" || key === "loggedInUser" || key.endsWith("_taxHistory")) continue;

        try {
            let data = JSON.parse(localStorage.getItem(key));
            if (data && data.username && data.password) {
                users.push(data);
            }
        } catch (e) {
            // Not a user JSON
        }
    }

    if (users.length === 0) {
        emptyUserMsg.style.display = "block";
        return;
    }
    emptyUserMsg.style.display = "none";

    users.forEach(function (user, index) {
        let row = document.createElement("tr");
        row.innerHTML =
            "<td>" + (index + 1) + "</td>" +
            "<td>" + user.name + "</td>" +
            "<td>" + user.username + "</td>" +
            "<td>" + user.email + "</td>" +
            "<td>" + user.phone + "</td>" +
            "<td><button class='delete-btn' onclick='deleteUser(\"" + user.username + "\")'>Delete</button></td>";
        userBody.appendChild(row);
    });
}

function deleteUser(username) {
    if (confirm("Are you sure you want to delete user '" + username + "'?")) {
        localStorage.removeItem(username);
        localStorage.removeItem(username + "_taxHistory");
        loadUsers();
    }
}

function logout() {
    window.location.href = "login.html";
}
