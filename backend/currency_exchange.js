let amountInput = document.getElementById("amount");
let fromSelect = document.getElementById("fromCurrency");
let toSelect = document.getElementById("toCurrency");
let swapBtn = document.getElementById("swapBtn");
let rateText = document.getElementById("conversionRate");
let resultText = document.getElementById("conversionResult");

let username = localStorage.getItem("loggedInUser");
if (!username) {
    window.location.href = "login.html";
}

async function calculateExchange() {
    let amount = parseFloat(amountInput.value) || 0;
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

amountInput.addEventListener("input", calculateExchange);
fromSelect.addEventListener("change", calculateExchange);
toSelect.addEventListener("change", calculateExchange);

calculateExchange();

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}
