
const RATE_TABLE = {
    home: {
        excellent: { min: 8.35, max: 9.0,  label: "Best home loan rates (SBI/HDFC tier)" },
        good:      { min: 9.0,  max: 9.75, label: "Standard home loan rates" },
        fair:      { min: 9.75, max: 11.0, label: "Higher rate due to moderate credit score" },
        poor:      { min: 11.0, max: 13.5, label: "Significantly higher rate; consider improving CIBIL first" }
    },
    car: {
        excellent: { min: 7.75, max: 8.5,  label: "Best auto loan rates (major banks)" },
        good:      { min: 8.5,  max: 9.5,  label: "Standard auto loan rates" },
        fair:      { min: 9.5,  max: 11.5, label: "Moderate rate due to fair credit score" },
        poor:      { min: 12.0, max: 15.0, label: "NBFCs may offer approval at higher rates" }
    },
    personal: {
        excellent: { min: 10.5, max: 12.0, label: "Best personal loan rates (salaried, top banks)" },
        good:      { min: 12.0, max: 14.0, label: "Standard personal loan rates" },
        fair:      { min: 14.0, max: 18.0, label: "Higher risk premium applied" },
        poor:      { min: 18.0, max: 24.0, label: "Very high rate; avoid if possible, build credit first" }
    },
    education: {
        excellent: { min: 8.0,  max: 9.5,  label: "Government / premier institution subsidy rates" },
        good:      { min: 9.5,  max: 11.0, label: "Standard education loan rates" },
        fair:      { min: 11.0, max: 13.0, label: "Rates applicable without collateral" },
        poor:      { min: 13.0, max: 15.0, label: "Collateral or guarantor may be required" }
    },
    gold: {
        excellent: { min: 7.5,  max: 9.0,  label: "Best gold loan rates (secured)" },
        good:      { min: 9.0,  max: 11.0, label: "Standard gold loan rates" },
        fair:      { min: 11.0, max: 13.0, label: "Higher rate despite collateral" },
        poor:      { min: 13.0, max: 18.0, label: "NBFC rates — credit score still matters" }
    },
    business: {
        excellent: { min: 10.0, max: 12.0, label: "Competitive business loan rates" },
        good:      { min: 12.0, max: 15.0, label: "Standard business loan rates" },
        fair:      { min: 15.0, max: 19.0, label: "Higher rate; business vintage may help" },
        poor:      { min: 19.0, max: 25.0, label: "Very high rate — use only if no alternative" }
    }
};


const EMPLOYMENT_ADJUST = {
    salaried_govt: -0.25,   
    salaried_pvt:  0,
    self_employed: 0.5,
    freelancer:    0.75
};

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


const MAX_FOIR = 0.50;  

let suggestedRate = 0;


function getNumVal(id, defaultVal = 0) {
    let el = document.getElementById(id);
    if (!el || !el.value) return defaultVal;
    let val = el.value.replace(/,/g, '');
    return parseFloat(val) || defaultVal;
}

document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const loanType       = document.getElementById('loanType').value;
    const employmentType = document.getElementById('employmentType').value;
    const monthlySalary  = getNumVal('monthlySalary');
    const existingEmi    = getNumVal('existingEmi');
    const creditScore    = document.getElementById('creditScore').value;
    const loanAmount     = getNumVal('loanAmount');
    let tenure           = parseInt(document.getElementById('tenure').value.replace(/,/g, '')) || 0;
    const tenureUnit     = document.getElementById('tenureUnit').value;

    if (tenureUnit === 'years') tenure *= 12;

    const resultBox   = document.getElementById('eligibilityResult');
    const titleEl     = document.getElementById('eligibilityTitle');
    const detailsEl   = document.getElementById('eligibilityDetails');
    const proceedBtn  = document.getElementById('proceedBtn');

    
    const availableForEmi = (MAX_FOIR * monthlySalary) - existingEmi;
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    
    const rateRange   = RATE_TABLE[loanType][creditScore];
    const empAdjust   = EMPLOYMENT_ADJUST[employmentType];
    const adjustedMin = Math.max(6, rateRange.min + empAdjust).toFixed(2);
    const adjustedMax = Math.max(6.5, rateRange.max + empAdjust).toFixed(2);
    suggestedRate     = parseFloat(adjustedMin);

    
    const mRate     = (suggestedRate / 12) / 100;
    const param     = Math.pow(1 + mRate, tenure);
    const estEmi    = (loanAmount * mRate * param) / (param - 1);

    
    const eligible       = availableForEmi >= estEmi && creditScore !== 'poor';
    const marginallyOk   = availableForEmi >= estEmi * 0.8 && creditScore !== 'poor';

    let statusColor, statusIcon, statusText;
    if (eligible) {
        statusColor = "#1a9e5c"; statusIcon = "✅"; statusText = "Likely Eligible";
    } else if (marginallyOk) {
        statusColor = "#d4a017"; statusIcon = "⚠️"; statusText = "Marginally Eligible";
    } else {
        statusColor = "#d9534f"; statusIcon = "❌"; statusText = "May Face Rejection";
    }

    
    const empLabels = {
        salaried_govt: "Salaried – Government",
        salaried_pvt:  "Salaried – Private",
        self_employed: "Self-Employed / Business",
        freelancer:    "Freelancer / Consultant"
    };

    const creditLabels = {
        excellent: "750–900 (Excellent)", good: "700–749 (Good)",
        fair: "650–699 (Fair)", poor: "Below 650 (Poor)"
    };

    const loanLabels = {
        home: "Home Loan", car: "Car Loan", personal: "Personal Loan",
        education: "Education Loan", gold: "Gold Loan", business: "Business Loan"
    };

    
    titleEl.innerHTML = `${statusIcon} <span style="color:${statusColor};">${statusText}</span>`;

    detailsEl.innerHTML = `
        <div class="elig-table">
            <div class="elig-row"><span>Loan Type</span><b>${loanLabels[loanType]}</b></div>
            <div class="elig-row"><span>Employment</span><b>${empLabels[employmentType]}</b></div>
            <div class="elig-row"><span>Credit Score</span><b>${creditLabels[creditScore]}</b></div>
            <div class="elig-row"><span>Monthly Salary</span><b>${formatter.format(monthlySalary)}</b></div>
            <div class="elig-row"><span>Existing EMIs</span><b>${formatter.format(existingEmi)}</b></div>
            <div class="elig-row highlight"><span>Available for New EMI</span><b>${formatter.format(Math.max(0, availableForEmi))}</b></div>
            <div class="elig-row highlight"><span>Estimated EMI at Suggested Rate</span><b>${isNaN(estEmi) ? '–' : formatter.format(estEmi)}</b></div>
        </div>

        <div class="rate-card">
            <div class="rate-title">💡 Suggested Interest Rate Range</div>
            <div class="rate-value">${adjustedMin}% – ${adjustedMax}%</div>
            <div class="rate-note">${rateRange.label}</div>
            ${empAdjust !== 0 ? `<div class="rate-note" style="color:#888">Employment adjustment: ${empAdjust > 0 ? '+' : ''}${empAdjust}% applied</div>` : ''}
        </div>

        ${!eligible ? `
        <div class="suggestion-box">
            <b>💬 Tips to improve eligibility:</b>
            <ul>
                ${creditScore === 'poor' ? '<li>Improve your CIBIL score to at least 700 before applying — pay off existing dues.</li>' : ''}
                ${availableForEmi < estEmi ? `<li>Reduce the loan amount or extend the tenure to lower EMI below ${formatter.format(availableForEmi)}.</li>` : ''}
                ${existingEmi > 0 ? '<li>Close or pre-pay existing loans to free up more income for this EMI.</li>' : ''}
                <li>Add a co-applicant with a good credit score to boost eligibility.</li>
            </ul>
        </div>` : ''}
    `;

    resultBox.style.display = 'block';
    proceedBtn.style.display = (eligible || marginallyOk) ? 'block' : 'none';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


window.proceedToEMI = () => {
    const loanAmount = getNumVal('loanAmount');
    let tenure       = parseInt(document.getElementById('tenure').value.replace(/,/g, '')) || 0;
    const tenureUnit = document.getElementById('tenureUnit').value;

    document.getElementById('principal').value = (loanAmount || 0).toLocaleString('en-IN');
    document.getElementById('rate').value      = suggestedRate;
    document.getElementById('months').value    = tenure;
    document.getElementById('monthsUnit').value = tenureUnit;
    document.getElementById('rateHint').textContent = `Suggested rate based on your profile: ${suggestedRate}% (adjust if you have a specific bank offer)`;

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('emiResult').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


window.goBack = () => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


document.addEventListener("DOMContentLoaded", function () {
    const emiForm = document.getElementById("emiForm");
    if (!emiForm) return;

    emiForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const principal = getNumVal("principal");
        const rate      = parseFloat(document.getElementById("rate").value.replace(/,/g, ''));
        let months      = parseInt(document.getElementById("months").value.replace(/,/g, ''));
        const unit      = document.getElementById("monthsUnit").value;

        if (unit === 'years') months *= 12;

        if (isNaN(principal) || isNaN(rate) || isNaN(months) || principal <= 0 || rate <= 0 || months <= 0) {
            alert("Please enter valid positive numbers for all fields.");
            return;
        }

        const monthlyRate   = (rate / 12) / 100;
        const param         = Math.pow(1 + monthlyRate, months);
        const emi           = (principal * monthlyRate * param) / (param - 1);
        const totalPayment  = emi * months;
        const totalInterest = totalPayment - principal;
        const interestPct   = ((totalInterest / principal) * 100).toFixed(1);
        const principalPct  = 100 - parseFloat(interestPct);

        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
        });

        document.getElementById("emiValue").textContent      = formatter.format(emi);
        document.getElementById("principalDisp").textContent = formatter.format(principal);
        document.getElementById("totalInterest").textContent = formatter.format(totalInterest);
        document.getElementById("totalPayment").textContent  = formatter.format(totalPayment);
        document.getElementById("interestPct").textContent   = interestPct + "%";

        
        document.getElementById("pieChart").style.background =
            `conic-gradient(#1a4bbd 0% ${principalPct}%, #e07b39 ${principalPct}% 100%)`;

        document.getElementById("emiResult").style.display = "block";
        document.getElementById("emiResult").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});

const numberInputs = ['monthlySalary', 'existingEmi', 'loanAmount', 'principal'];
numberInputs.forEach(id => {
    let el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', function(e) {
            let val = this.value.replace(/[^0-9]/g, '');
            if (val) {
                this.value = parseInt(val, 10).toLocaleString('en-IN');
            } else {
                this.value = '';
            }
        });
    }
});
