import { auth, db } from "./firebase-config.js";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let taxForm = document.getElementById("taxForm");
let yearSelect = document.getElementById("year");
let resultBox = document.getElementById("resultBox");
let noSlabMsg = document.getElementById("noSlabMsg");

let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (!user) {
        // window.location.href = "login.html"; // Optional: Force login?
    }
});

let globalSlabs = [];

// --- Live Slab Loading ---
async function loadSlabs() {
    const q = query(collection(db, "taxSlabs"), orderBy("year", "asc"));
    
    // Switch to real-time snapshot
    onSnapshot(q, (snapshot) => {
        globalSlabs = [];
        snapshot.forEach((doc) => {
            globalSlabs.push({ id: doc.id, ...doc.data() });
        });
        populateYears();
    });
}

function populateYears() {
    let years = [];
    globalSlabs.forEach(slab => {
        if (!years.includes(slab.year)) years.push(slab.year);
    });
    years.sort();
    yearSelect.innerHTML = "";

    if (years.length === 0) {
        let opt = document.createElement("option");
        opt.textContent = "No years available (Ask admin to add slabs)";
        yearSelect.appendChild(opt);
        return;
    }

    years.forEach(yr => {
        let opt = document.createElement("option");
        opt.value = yr;
        opt.textContent = yr;
        yearSelect.appendChild(opt);
    });
}

loadSlabs();

function calculateRegimeTax(totalIncome, regime, category, deductions, year, RentIncome) {
    let standardDed = regime === 'New' ? 75000 : 50000;
    let rebateLimit = regime === 'New' ? 700000 : 500000;

    let netTaxable = Math.max(0, totalIncome - standardDed - (regime === 'Old' ? (deductions + RentIncome) : (0 + RentIncome)));

    let slabs = globalSlabs.filter(s => {
        let cat = s.category || "Normal";
        let reg = s.regime || "Old";
        return s.year == year && cat == category && reg == regime;
    });

    slabs.sort((a, b) => parseFloat(a.minIncome) - parseFloat(b.minIncome));

    if (slabs.length === 0) return null;

    let baseTax = 0;
    let slabDetails = [];

    slabs.forEach(slab => {
        let min = parseFloat(slab.minIncome);
        let max = slab.maxIncome === "No Limit" ? Infinity : parseFloat(slab.maxIncome);
        let rate = parseFloat(slab.taxRate) / 100;

        if (netTaxable > min) {
            let taxableInSlab = Math.min(netTaxable, max) - min;
            let taxForSlab = taxableInSlab * rate;
            baseTax += taxForSlab;

            slabDetails.push({
                range: `₹${min.toLocaleString('en-IN')} - ${max === Infinity ? 'No Limit' : '₹' + max.toLocaleString('en-IN')}`,
                rate: `${slab.taxRate}%`,
                tax: taxForSlab
            });
        }
    });

    let appliedRebate = 0;
    if (netTaxable <= rebateLimit) {
        appliedRebate = baseTax;
        baseTax = 0;
    }

    let cess = baseTax * 0.04;
    return {
        totalTax: baseTax + cess,
        baseTax,
        cess,
        netTaxable,
        slabDetails,
        appliedRebate
    };
}

if (taxForm) {
    taxForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let selectedYear = yearSelect.value;

        function getNumVal(id) {
            let el = document.getElementById(id);
            if (!el) return 0;
            let val = el.value.replace(/,/g, '');
            return parseFloat(val) || 0;
        }

        let baseIncome = getNumVal("income");
        let InterestIncome = getNumVal("InterestIncome");
        let RentIncome = getNumVal("RentIncome");
        let grossIncome = baseIncome + InterestIncome + RentIncome;

        let category = document.getElementById("category").value;

        // Deductions
        let inv80cVal = getNumVal("inv80c");
        let inv80c_deduction = inv80cVal < 150000 ? inv80cVal : 150000;

        let intIncomeVal = getNumVal("InterestIncome");
        let interest_deduction = intIncomeVal < 10000 ? intIncomeVal : 10000;

        let rentIncomeVal = getNumVal("RentIncome");
        let rent_deduction = 0.3 * rentIncomeVal;

        let healthInsVal = getNumVal("healthIns");
        let healthInsLimit = category === "Normal" ? 25000 : 50000;
        let health_deduction = healthInsVal < healthInsLimit ? healthInsVal : healthInsLimit;

        let NPSVal = getNumVal("NPS");
        let NPS_deduction = NPSVal < 50000 ? NPSVal : 50000;

        let other_deduction = getNumVal("otherDeductions");
        let deductions = inv80c_deduction + interest_deduction + health_deduction + NPS_deduction + other_deduction;

        // Result table renderer
        function renderTable(result, regime) {
            let rows = '';
            if (result.slabDetails.length) {
                rows += result.slabDetails.map(s => `
                    <tr>
                        <td>${s.range}</td>
                        <td>${s.rate}</td>
                        <td>₹${s.tax.toLocaleString('en-IN')}</td>
                    </tr>
                `).join('');
            } else {
                rows += '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-size:12px; padding:15px;">No taxable income after deductions.</td></tr>';
            }
            if (result.appliedRebate > 0) {
                rows += `<tr style="color:#16a34a; font-weight:bold; background-color:#f0fdf4;"><td colspan="2">Sec 87A Rebate</td><td>- ₹${result.appliedRebate.toLocaleString('en-IN')}</td></tr>`;
            }
            rows += `<tr style="border-top:2px solid #e2e8f0; font-weight:bold; background-color:#f8fafc;"><td colspan="2">Total + Cess (4%)</td><td>₹${result.totalTax.toLocaleString('en-IN')}</td></tr>`;
            return `<table class="breakdown-table"><thead><tr><th>Slab</th><th>Rate</th><th>Tax</th></tr></thead><tbody>${rows}</tbody></table>`;
        }

        let oldResult = calculateRegimeTax(grossIncome, 'Old', category, deductions, selectedYear, rent_deduction);
        let newResult = calculateRegimeTax(grossIncome, 'New', category, 0, selectedYear, rent_deduction);

        if (!oldResult || !newResult) {
            resultBox.style.display = "none";
            noSlabMsg.textContent = `No slabs found for ${selectedYear}. Ensure Admin adds slabs.`;
            noSlabMsg.style.display = "block";
            return;
        }

        // --- Render UI ---
        noSlabMsg.style.display = "none";
        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <div class="card-title">Detailed Tax Calculation (${selectedYear})</div>
            <div class="comparison-container" style="gap: 40px;">
                <div class="comparison-card ${oldResult.totalTax <= newResult.totalTax ? 'better' : 'worse'}">
                    <h4 style="margin-bottom: 10px;">Old Regime</h4>
                    <div style="font-size: 13px; color: #555;">
                        <div>Gross Salary: ₹${grossIncome.toLocaleString('en-IN')}</div>
                        <div style="font-weight:bold;">Net Taxable: ₹${oldResult.netTaxable.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="tax-amount" style="margin-top: 15px;">₹${oldResult.totalTax.toLocaleString('en-IN')}</div>
                    ${renderTable(oldResult, 'Old')}
                </div>
                <div class="comparison-card ${newResult.totalTax < oldResult.totalTax ? 'better' : 'worse'}">
                    <h4 style="margin-bottom: 10px;">New Regime</h4>
                    <div style="font-size: 13px; color: #555;">
                        <div>Gross Salary: ₹${grossIncome.toLocaleString('en-IN')}</div>
                        <div style="font-weight:bold;">Net Taxable: ₹${newResult.netTaxable.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="tax-amount" style="margin-top: 15px;">₹${newResult.totalTax.toLocaleString('en-IN')}</div>
                    ${renderTable(newResult, 'New')}
                </div>
            </div>
            <div class="recommendation">
                Recommendation: Choose <strong>${oldResult.totalTax <= newResult.totalTax ? 'Old Regime' : 'New Regime'}</strong> 
                to save <strong>₹${Math.abs(oldResult.totalTax - newResult.totalTax).toLocaleString('en-IN')}</strong> per year.
            </div>`;

        // Save history
        const record = {
            timestamp: new Date().toISOString(),
            year: selectedYear,
            grossIncome,
            netTaxable: oldResult.totalTax < newResult.totalTax ? oldResult.netTaxable : newResult.netTaxable,
            totalTax: Math.min(oldResult.totalTax, newResult.totalTax),
            bestRegime: oldResult.totalTax < newResult.totalTax ? 'Old' : 'New'
        };

        // 1. Save to Cloud Firestore if logged in
        if (currentUser) {
            try {
                const historyRef = collection(db, "users", currentUser.uid, "taxHistory");
                addDoc(historyRef, {
                    ...record,
                    timestamp: serverTimestamp() // Better for sorting in cloud
                });
            } catch (err) {
                console.error("Cloud Save Error:", err);
            }
        }

        // 2. Local save removed (Firebase only)
    });
}

// Global UI helpers
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

const numberInputs = ["income", "InterestIncome", "RentIncome", "inv80c", "healthIns", "NPS", "otherDeductions"];
numberInputs.forEach(id => {
    let el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', function(e) {
            let val = this.value.replace(/[^0-9]/g, '');
            if (val) this.value = parseInt(val, 10).toLocaleString('en-IN');
            else this.value = '';
        });
    }
});
