let form = document.getElementById("registerForm");
let message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    let name = document.getElementById("name").value;
    let username = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone_number").value;
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

    // Auto-detect if we are online or local to switch backend URL natively
    const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
        ? "http://127.0.0.1:5000"
        : "https://your-online-app.onrender.com"; // <-- You will change this when you host the Python file!

    try {
        const response = await fetch(API_BASE + "/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username, email, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("Registration successful via web server! You can now login.");
            window.location.href = "login.html";
        } else {
            alert(data.error || "Something went wrong. Please try again.");
        }
    } catch (err) {
        console.error("Web Server is unreachable:", err);
        alert("Could not connect to the Web Server to save your data. Please make sure the Flask backend is running.");
    }
});
