let form = document.getElementById("loginForm");
let message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    // Retain static Admin logic if they still utilize it
    if (username === "admin" && password === "Admin@123") {
        alert("Login successful! Welcome Admin!");
        window.location.href = "admin.html";
        return;
    }

    // Auto-detect if we are online or local to switch backend URL natively
    const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
        ? "http://127.0.0.1:5000"
        : "https://your-online-app.onrender.com"; // <-- You will change this when you host the Python file!

    try {
        const response = await fetch(API_BASE + "/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success: Web Server authorized the login!
            // Cache the user to local storage for UI state
            localStorage.setItem("loggedInUser", data.user.username);
            localStorage.setItem(data.user.username, JSON.stringify(data.user));
            
            alert("Login successful! Welcome, " + data.user.name + "!");
            window.location.href = "dashboard.html";
        } else {
            // Failed auth from MySQL server
            alert(data.error || "Incorrect username or password. Please try again.");
        }
    } catch (err) {
        // Fallback or network error
        console.error("Web Server is unreachable:", err);
        alert("Could not connect to the Backend Web Server. Ensure python app.py is running!");
    }
});
