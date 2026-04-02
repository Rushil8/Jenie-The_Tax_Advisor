import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Wake up the Render server immediately (Cold Start Fix)
        const API_BASE = "https://jenie-the-tax-advisor.onrender.com";
        fetch(API_BASE).catch(() => {}); // Fire and forget

        // Fetch name from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            document.getElementById("welcomeMsg").textContent = "Welcome, " + docSnap.data().name + "!";
        } else {
            document.getElementById("welcomeMsg").textContent = "Welcome back!";
        }
    } else {
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


window.loadNews = () => {
    const rssUrl = "https://economictimes.indiatimes.com/rssfeeds/837555174.cms";
    const apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status !== "ok") {
                throw new Error("Failed to parse RSS or API limit reached.");
            }

            let allItems = data.items || [];

            // Refined keywords for Indian Finance/Tax context
            const financeKeywords = ["tax", "finance", "money", "loan", "bank", "credit", "market", "fund", "stock", "rupee", "income", "investment", "wealth", "economy", "interest", "budget", "gst", "salary", "deduction", "saving"];

            let items = allItems.filter(item => {
                let contentText = ((item.title || "") + " " + (item.description || "")).toLowerCase();
                return financeKeywords.some(kw => contentText.includes(kw));
            });

            // If filter is too strict, show latest from all
            if (items.length < 3) {
                items = allItems;
            }

            let newsContainer = document.getElementById("newsContainer");
            if (!newsContainer) return;
            newsContainer.innerHTML = "";

            if (items.length === 0) {
                newsContainer.innerHTML = "<p style='color: var(--text-secondary);'>No news items found at the moment.</p>";
                return;
            }

            let count = 0;
            items.forEach(item => {
                if (count >= 5) return;

                let title = item.title || "No Title";
                let desc = (item.description || "").replace(/(<([^>]+)>)/gi, "").trim();
                if (!desc || desc.trim() === "") desc = "Click below to read the full article on Economic Times.";

                let link = item.link;
                let pubDate = item.pubDate;

                let newsCard = document.createElement("div");
                newsCard.className = "news-card";
                newsCard.style.padding = "15px";
                newsCard.style.backgroundColor = "var(--bg-card)";
                newsCard.style.borderRadius = "8px";
                newsCard.style.border = "1px solid var(--border-color)";
                newsCard.style.marginBottom = "15px";
                newsCard.style.boxShadow = "var(--shadow)";

                newsCard.innerHTML = `
                    <h3 style="font-size: 16px; margin-bottom: 5px; color: var(--text-primary); cursor: pointer;" onclick="window.open('${link}', '_blank')">${title}</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${pubDate}</p>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 10px;">${desc.substring(0, 160)}...</p>
                    <a href="${link}" target="_blank" style="font-size: 14px; font-weight: bold; color: var(--btn-primary); text-decoration: none;">Read Full Article →</a>
                `;

                newsContainer.appendChild(newsCard);
                count++;
            });
        })
        .catch(err => {
            console.error("Failed to load news: ", err);
            const container = document.getElementById("newsContainer");
            if (container) {
                container.innerHTML = "<p style='color: #e63946; font-size: 14px; padding: 10px; background: #fff1f2; border: 1px solid #fda4af; border-radius: 6px;'><b>Unable to load live feed.</b> This may be due to ad-blockers or temporary service unavailability. <br><br> <button onclick='window.loadNews()' style='background: #1a4bbd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;'>Try Again</button></p>";
            }
        });
}

document.addEventListener("DOMContentLoaded", window.loadNews);
