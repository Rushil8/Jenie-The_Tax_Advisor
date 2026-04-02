let amountInput = document.getElementById("amount");
let fromSelect = document.getElementById("fromCurrency");
let toSelect = document.getElementById("toCurrency");
let swapBtn = document.getElementById("swapBtn");
let rateText = document.getElementById("conversionRate");
let resultText = document.getElementById("conversionResult");

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

async function calculateExchange() {
    let valStr = amountInput.value.replace(/,/g, '');
    let amount = parseFloat(valStr) || 0;
    let from = fromSelect.value;
    let to = toSelect.value;

    if (amount <= 0) {
        resultText.textContent = "Enter a valid amount";
        rateText.textContent = "-";
        return;
    }

    try {
        resultText.textContent = "Calculating...";
        rateText.textContent = "Fetching latest rates...";

        let response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
        let data = await response.json();

        if (data.result === "success") {
            let rate = data.rates[to];
            let converted = amount * rate;

            rateText.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

            let formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: to
            });
            resultText.textContent = formatter.format(converted);
        } else {
            resultText.textContent = "Error fetching rates";
            rateText.textContent = "Please try again later";
        }
    } catch (error) {
        resultText.textContent = "Network Error";
        rateText.textContent = "Could not connect to exchange API";
    }
}

swapBtn.addEventListener("click", function () {
    let temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    calculateExchange();
});

amountInput.addEventListener("input", function(e) {
    let val = this.value.replace(/[^0-9.]/g, '');
    if (val !== "") {
        let parts = val.split('.');
        if (parts[0]) parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
        if (parts.length > 2) parts = [parts[0], parts.slice(1).join('')]; // Handle multiple dots
        this.value = parts.join('.');
    } else {
        this.value = '';
    }
    calculateExchange();
});
fromSelect.addEventListener("change", calculateExchange);
toSelect.addEventListener("change", calculateExchange);

calculateExchange();

