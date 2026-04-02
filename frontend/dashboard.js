let username = localStorage.getItem("loggedInUser");
if (username) {
    let userData = JSON.parse(localStorage.getItem(username));
    if (userData) {
        document.getElementById("welcomeMsg").textContent = "Welcome, " + userData.name + "!";
    }
} else {
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

// Fetch and display live RSS news safely using rss2json
function loadNews() {
    const rssUrl = "https://economictimes.indiatimes.com/rssfeeds/837555174.cms";
    const apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if(data.status !== "ok") {
                throw new Error("Failed to parse RSS");
            }

            let allItems = data.items;
            
            // Strictly filter the news to ensure it's ONLY related to finance/taxes
            const financeKeywords = ["tax", "finance", "money", "loan", "bank", "credit", "market", "fund", "stock", "rupee", "income", "investment", "wealth", "economy", "interest"];
            let items = allItems.filter(item => {
                let contentText = ((item.title || "") + " " + (item.description || "")).toLowerCase();
                return financeKeywords.some(kw => contentText.includes(kw));
            });

            // If filter captures too few, fallback to original just to ensure content exists
            if (items.length < 3) {
                items = allItems;
            }

            let newsContainer = document.getElementById("newsContainer");
            newsContainer.innerHTML = "";
            
            // Loop through the first 5 news items
            let count = 0;
            items.forEach(item => {
                if(count >= 5) return;
                
                let title = item.title || "No Title";
                // remove HTML tags from description if any
                let desc = item.description.replace(/(<([^>]+)>)/gi, "").trim();
                if(!desc || desc.trim() === "") desc = "Click below to read the full article.";
                
                let link = item.link;
                let pubDate = item.pubDate;
                
                let newsCard = document.createElement("div");
                newsCard.style.padding = "15px";
                newsCard.style.backgroundColor = "#fff";
                newsCard.style.borderRadius = "8px";
                newsCard.style.border = "1px solid #ddd";
                newsCard.style.marginBottom = "15px";
                
                newsCard.innerHTML = `
                    <h3 style="font-size: 16px; margin-bottom: 5px; color: #333;">${title}</h3>
                    <p style="font-size: 12px; color: #888; margin-bottom: 8px;">${pubDate}</p>
                    <p style="font-size: 14px; color: #555; margin-bottom: 10px;">${desc.substring(0, 150)}...</p>
                    <a href="${link}" target="_blank" style="font-size: 14px; font-weight: bold; color: #1a4bbd; text-decoration: none;">Read Full Article →</a>
                `;
                
                newsContainer.appendChild(newsCard);
                count++;
            });
        })
        .catch(err => {
            console.error("Failed to load news: ", err);
            // Fallback to local
            document.getElementById("newsContainer").innerHTML = "<p style='color: red;'>Live News feed currently unavailable. (AdBlockers or secure networks may be blocking the feed)</p>";
        });
}

document.addEventListener("DOMContentLoaded", loadNews);
