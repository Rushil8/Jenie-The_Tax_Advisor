let taxForm = document.getElementById("taxForm");
let yearSelect = document.getElementById("year");
let resultBox = document.getElementById("resultBox");
let breakdownBody = document.getElementById("breakdownBody");
let totalTaxEl = document.getElementById("totalTax");
let effectiveEl = document.getElementById("effectiveRate");
let noSlabMsg = document.getElementById("noSlabMsg");

let globalSlabs = [];
const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:5000"
    : "https://your-online-app.onrender.com";

async function populateYears() {
    try {
        let res = await fetch(API_BASE + "/api/slabs");
        let data = await res.json();
        
        // Translate format mapped by Database directly into Calculator logic natively!
        globalSlabs = data.slabs.map(s => ({
            year: s.year,
            regime: s.regime,
            category: s.category,
            minIncome: s.min_income,
            maxIncome: s.max_income == null ? "No Limit" : s.max_income,
            taxRate: s.tax_rate
        }));
    } catch(err) {
        console.warn("Using Offline Database...", err);
        globalSlabs = JSON.parse(localStorage.getItem("taxSlabs")) || [];
    }

    let years = [];
    globalSlabs.forEach(function (slab) {
        if (!years.includes(slab.year)) {
            years.push(slab.year);
        }
    });

    years.sort();
    yearSelect.innerHTML = "";

    if (years.length === 0) {
        let opt = document.createElement("option");
        opt.textContent = "No years available (Waiting for Admin)";
        yearSelect.appendChild(opt);
        return;
    }

    years.forEach(function (yr) {
        let opt = document.createElement("option");
        opt.value = yr;
        opt.textContent = yr;
        yearSelect.appendChild(opt);
    });
}
populateYears();

taxForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let selectedYear = yearSelect.value;
    let selectedRegime = document.getElementById("regime").value;
    let selectedCategory = document.getElementById("category").value;
    let baseIncome = parseFloat(document.getElementById("income").value) || 0;
    let otherIncome = parseFloat(document.getElementById("otherIncome").value) || 0;

    let inv80c = parseFloat(document.getElementById("inv80c").value) || 0;
    let healthIns = parseFloat(document.getElementById("healthIns").value) || 0;
    let homeLoan = parseFloat(document.getElementById("homeLoan").value) || 0;
    let otherDeductions = parseFloat(document.getElementById("otherDeductions").value) || 0;

    // Deductions aren't generally allowed in New Regime, so zero them out if New is selected
    if (selectedRegime === "New") {
        inv80c = 0; healthIns = 0; homeLoan = 0; otherDeductions = 0;
    }

    let deductions = inv80c + healthIns + homeLoan + otherDeductions;

    let grossIncome = baseIncome + otherIncome;
    let netTaxableIncome = Math.max(0, grossIncome - deductions);

    // Use the fetched Global Slabs from the Database for definitive calculation!
    let allSlabs = globalSlabs;

    let slabs = allSlabs.filter(function (s) {
        let cat = s.category || "Normal";
        let reg = s.regime || "Old";
        return s.year == selectedYear && cat == selectedCategory && reg == selectedRegime;
    });

    slabs.sort(function (a, b) {
        return parseFloat(a.minIncome) - parseFloat(b.minIncome);
    });

    if (slabs.length === 0) {
        resultBox.style.display = "none";
        noSlabMsg.style.display = "block";
        return;
    }

    noSlabMsg.style.display = "none";
    resultBox.style.display = "block";
    breakdownBody.innerHTML = "";

    let totalTax = 0;
    let baseTax = 0;
    let cess = 0;

    let applicableSlab = slabs.find(function (slab) {
        let min = parseFloat(slab.minIncome);
        let max = slab.maxIncome === "No Limit" ? Infinity : parseFloat(slab.maxIncome);
        return netTaxableIncome >= min && netTaxableIncome <= max;
    });

    if (applicableSlab) {
        let min = parseFloat(applicableSlab.minIncome);
        let maxDisplay = applicableSlab.maxIncome === "No Limit" ? "No Limit" : "₹" + Number(applicableSlab.maxIncome).toLocaleString("en-IN");
        let rate = parseFloat(applicableSlab.taxRate) / 100;

        baseTax = netTaxableIncome * rate;
        cess = baseTax * 0.04;
        totalTax = baseTax + cess;

        let row = document.createElement("tr");
        row.innerHTML =
            "<td>₹" + Number(min).toLocaleString("en-IN") + " – " + maxDisplay + "</td>" +
            "<td>" + applicableSlab.taxRate + "%</td>" +
            "<td>₹" + netTaxableIncome.toLocaleString("en-IN") + "</td>" +
            "<td>₹" + baseTax.toLocaleString("en-IN") + "</td>";
        breakdownBody.appendChild(row);
    }

    let cessRow = document.createElement("tr");
    cessRow.innerHTML =
        "<td colspan='3'>Health & Education Cess (4%)</td>" +
        "<td>₹" + cess.toLocaleString("en-IN") + "</td>";
    breakdownBody.appendChild(cessRow);

    let totalRow = document.createElement("tr");
    totalRow.innerHTML =
        "<td colspan='3'><strong>Total Final Tax</strong></td>" +
        "<td><strong>₹" + totalTax.toLocaleString("en-IN") + "</strong></td>";
    breakdownBody.appendChild(totalRow);

    let effective = grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) : 0;

    totalTaxEl.innerHTML =
        "Gross Income: ₹" + grossIncome.toLocaleString("en-IN") + "<br>" +
        "Net Taxable Income: ₹" + netTaxableIncome.toLocaleString("en-IN") + "<br><br>" +
        "Total Final Tax Payable: ₹" + totalTax.toLocaleString("en-IN");

    effectiveEl.textContent = "Effective Tax Rate (on Gross Income): " + effective + "%";

    // Save to history
    let username = localStorage.getItem("loggedInUser");
    if (username) {
        let historyKey = username + "_taxHistory";
        let history = JSON.parse(localStorage.getItem(historyKey)) || [];
        history.push({
            date: new Date().toLocaleString(),
            year: selectedYear,
            grossIncome: grossIncome,
            netTaxable: netTaxableIncome,
            totalTax: totalTax
        });
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
});

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}
