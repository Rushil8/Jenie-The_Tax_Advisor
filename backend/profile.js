let profileName = document.getElementById("profileName");
let profileUsername = document.getElementById("profileUsername");
let profileEmail = document.getElementById("profileEmail");
let profilePhone = document.getElementById("profilePhone");

loadProfile();

function loadProfile() {
    let username = localStorage.getItem("loggedInUser");

    if (!username) {
        window.location.href = "login.html";
        return;
    }

    let savedData = localStorage.getItem(username);

    if (savedData) {
        let userData = JSON.parse(savedData);

        profileName.textContent = userData.name;
        profileUsername.textContent = userData.username;
        profileEmail.textContent = userData.email;
        profilePhone.textContent = userData.phone;
    } else {
        profileName.textContent = "Data not found";
    }

    let historyKey = username + "_taxHistory";
    let history = JSON.parse(localStorage.getItem(historyKey)) || [];
    let historyTable = document.getElementById("historyTable");
    let historyBody = document.getElementById("historyBody");
    let noHistoryMsg = document.getElementById("noHistoryMsg");

    if (history.length > 0) {
        noHistoryMsg.style.display = "none";
        historyTable.style.display = "table";
        historyBody.innerHTML = "";

        history.slice().reverse().forEach(function (calc) {
            let row = document.createElement("tr");
            row.style.borderBottom = "1px solid #ddd";
            row.innerHTML =
                "<td style='padding: 10px;'>" + calc.date + "</td>" +
                "<td style='padding: 10px;'>" + calc.year + "</td>" +
                "<td style='padding: 10px;'>₹" + Number(calc.grossIncome).toLocaleString("en-IN") + "</td>" +
                "<td style='padding: 10px;'>₹" + Number(calc.netTaxable).toLocaleString("en-IN") + "</td>" +
                "<td style='padding: 10px; font-weight: bold;'>₹" + Number(calc.totalTax).toLocaleString("en-IN") + "</td>";
            historyBody.appendChild(row);
        });
    } else {
        noHistoryMsg.style.display = "block";
        historyTable.style.display = "none";
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

function toggleEdit() {
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
}

function saveProfile() {
    let username = localStorage.getItem("loggedInUser");
    if (!username) return;
    
    let emailVal = document.getElementById("editEmail").value;
    let phoneVal = document.getElementById("editPhone").value;
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
        alert("Please enter a valid email address.");
        return;
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phoneVal)) {
        alert("Please enter a valid 10-digit phone number (e.g., 9988776655).");
        return;
    }
    
    let savedData = localStorage.getItem(username);
    if (savedData) {
        let userData = JSON.parse(savedData);
        
        userData.name = document.getElementById("editName").value;
        userData.email = emailVal;
        userData.phone = phoneVal;
        
        localStorage.setItem(username, JSON.stringify(userData));
        
        profileName.textContent = userData.name;
        profileEmail.textContent = userData.email;
        profilePhone.textContent = userData.phone;
    }
    
    document.getElementById("editName").style.display = "none";
    document.getElementById("editEmail").style.display = "none";
    document.getElementById("editPhone").style.display = "none";
    
    profileName.style.display = "block";
    profileEmail.style.display = "block";
    profilePhone.style.display = "block";
    
    document.getElementById("saveBtn").style.display = "none";
    document.getElementById("editBtn").style.display = "inline-block";
    
    alert("Profile updated successfully!");
}
