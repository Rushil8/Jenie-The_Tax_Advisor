import { auth } from "../backend/firebase-config.js";
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

const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:5000"
    : "https://jenie-thetaxadvisor.netlify.app";

function getNumVal(id, defaultVal = 0) {
    let el = document.getElementById(id);
    if (!el || !el.value) return defaultVal;
    let val = el.value.replace(/,/g, '');
    return parseFloat(val) || defaultVal;
}

function getFormData() {
    const salary = getNumVal('salaryInput');
    const age = parseInt(document.getElementById('ageInput').value) || 30;
    const employmentType = document.getElementById('employmentType').value;
    const taxRegime = document.getElementById('taxRegime').value;
    const sec80c = getNumVal('sec80c');
    const healthInsurance = getNumVal('healthInsurance');
    const homeLoan = document.getElementById('homeLoan').value;
    const npsContrib = getNumVal('npsContrib');

    const goals = [];
    document.querySelectorAll('#financialGoals input[type="checkbox"]:checked').forEach(cb => {
        goals.push(cb.value.replace(/_/g, ' '));
    });

    return { salary, age, employmentType, taxRegime, sec80c, healthInsurance, homeLoan, npsContrib, goals };
}


function buildPrompt(data) {
    const { salary, age, employmentType, taxRegime, sec80c, healthInsurance, homeLoan, npsContrib, goals } = data;

    const remaining80c = Math.max(0, 150000 - sec80c);
    const remaining80d = Math.max(0, (age >= 60 ? 50000 : 25000) - healthInsurance);
    const remainingNPS = Math.max(0, 50000 - npsContrib);

    const goalsStr = goals.length > 0 ? goals.join(', ') : 'general financial growth';
    const homeLoanStr = homeLoan === 'none' ? 'no home loan' :
        homeLoan === 'self-occupied' ? 'a home loan on a self-occupied property' :
            'a home loan on a let-out/rented-out property';

    const regimeStr = taxRegime === 'unsure' ? 'undecided between old and new regime (advise which is better)' :
        `preferring the ${taxRegime} tax regime`;

    return `You are an expert Indian tax advisor. Provide 5 UNIQUE and HIGH-IMPACT tax-saving tips for FY 2025-26 for this person:
- Annual Income: ₹${salary.toLocaleString('en-IN')}, Age: ${age}, Employment: ${employmentType}
- Tax Regime: ${regimeStr}
- 80C used: ₹${sec80c.toLocaleString('en-IN')} (₹${remaining80c.toLocaleString('en-IN')} remaining)
- 80D paid: ₹${healthInsurance.toLocaleString('en-IN')} (₹${remaining80d.toLocaleString('en-IN')} remaining)
- NPS: ₹${npsContrib.toLocaleString('en-IN')} (₹${remainingNPS.toLocaleString('en-IN')} more under 80CCD(1B))
- Home loan: ${homeLoanStr}, Goals: ${goalsStr}

Rules: 
- Provide 5 UNIQUE and HIGH-IMPACT tips.
- Do NOT repeat common knowledge like standard deduction if income is low.
- Focus on specific strategies for different tax brackets.
- Vary the structure of the tips each time to ensure uniqueness.
- Output ONLY a <ul> with <li> items. 
- Each <li> must start with <b>Section name:</b> then a 2-3 sentence strategic tip.
- End with one <p> disclaimer. No markdown, no extra text.`;
}


function getStaticTips(data) {
    const { salary, age, sec80c, healthInsurance, npsContrib, taxRegime } = data;
    const remaining80c = Math.max(0, 150000 - sec80c);
    const remaining80d = Math.max(0, (age >= 60 ? 50000 : 25000) - healthInsurance);
    const tips = [];

    if (remaining80c > 0) {
        tips.push(`<li><b>Section 80C Gap — ₹${remaining80c.toLocaleString('en-IN')} Unclaimed:</b> You still have ₹${remaining80c.toLocaleString('en-IN')} of Section 80C limit unused. Invest in ELSS Mutual Funds, PPF, or top up your EPF VPF to claim this deduction before March 31.</li>`);
    } else {
        tips.push(`<li><b>Section 80C (Maxed Out — ₹1,50,000):</b> Great — your 80C limit is fully utilized! Explore 80CCD(1B) NPS for an additional ₹50,000 deduction on top of 80C.</li>`);
    }

    if (remaining80d > 0) {
        tips.push(`<li><b>Section 80D — ₹${remaining80d.toLocaleString('en-IN')} Available:</b> Buy or top-up a health insurance policy for yourself/family to claim up to ₹${remaining80d.toLocaleString('en-IN')} more in tax deduction under Section 80D.</li>`);
    }

    if (npsContrib < 50000) {
        const remainNPS = 50000 - npsContrib;
        tips.push(`<li><b>Section 80CCD(1B) — NPS Contribution:</b> Contribute ₹${remainNPS.toLocaleString('en-IN')} more to NPS Tier-1 to claim the additional ₹50,000 deduction under 80CCD(1B), which is over and above your 80C limit.</li>`);
    }

    if (taxRegime === 'unsure' && salary <= 1000000) {
        tips.push(`<li><b>Regime Analysis — Old vs New:</b> At your income level of ₹${salary.toLocaleString('en-IN')}, the Old Regime is likely beneficial if your total deductions (80C + 80D + HRA + Standard) exceed ₹3.75 Lakh. Calculate both using a tax calculator before filing.</li>`);
    }

    if (age >= 60) {
        tips.push(`<li><b>Senior Citizen Benefits:</b> Your basic exemption limit is ₹3 Lakh (Old Regime). You qualify for a ₹50,000 deduction under 80D for health insurance and are exempt from paying advance tax if you have no business income.</li>`);
    } else {
        tips.push(`<li><b>Standard Deduction (₹75,000):</b> As a salaried employee, you automatically get a ₹75,000 standard deduction in FY 2025-26. Ensure this is reflected in your Form 16 and ITR filing.</li>`);
    }

    tips.push(`<li><b>Capital Gains Harvesting:</b> If you hold equity mutual funds or stocks, use the ₹1.25 Lakh LTCG exemption each financial year strategically. Book profits under this limit annually and reinvest to reset the cost basis tax-free.</li>`);

    return `<ul>${tips.join('\n')}</ul>
    <p> Note: AI-powered tips are temporarily unavailable. These curated tips are based on your financial profile as per Indian tax law (FY 2025–26). Consult a CA before making major financial decisions.</p>`;
}


let lastFormData = null;

window.regenerateTips = async function() {
    if (!lastFormData) return;
    await fetchAITips(lastFormData);
}


async function fetchAITips(data) {
    const tipsContent = document.getElementById('tipsContent');
    const submitBtn = document.getElementById('submitBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');

    tipsContent.innerHTML = `
        <div class="loading-shimmer">
            <div class="shimmer-line"></div>
            <div class="shimmer-line short"></div>
            <div class="shimmer-line"></div>
            <div class="shimmer-line short"></div>
        </div>`;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating strategy...';
    if (regenerateBtn) regenerateBtn.style.display = 'none';

    try {
        const prompt = buildPrompt(data);
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are an expert Indian tax consultant." },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.3-70b-versatile"
            }) 
        });

        const resData = await res.json();

        if (!res.ok) throw new Error(resData.error?.message || resData.error || 'Groq API error');

        let tipsHtml = resData.choices[0].message.content.trim();
        
        tipsHtml = tipsHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

        if (tipsHtml.length > 30) {
            tipsContent.innerHTML = tipsHtml;
        } else {
            tipsContent.innerHTML = getStaticTips(data);
        }
    } catch (err) {
        console.error('Groq fetch failed:', err);
        tipsContent.innerHTML =
            `<p style="color:#c0392b; font-size:12px; margin-bottom:10px;">⚠️ Connection to AI backend failed. Showing fallback tips.</p>` +
            getStaticTips(data);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get AI Tax Tips';
        if (regenerateBtn) regenerateBtn.style.display = 'block';
    }
}


document.getElementById('taxTipsForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const errorMessage = document.getElementById('errorMessage');
    const resultsBox = document.getElementById('resultsBox');
    const resultsSubtitle = document.getElementById('resultsSubtitle');

    errorMessage.style.display = 'none';

    const data = getFormData();
    lastFormData = data;

    if (!data.salary || data.salary <= 0) {
        errorMessage.textContent = '⚠️ Please enter a valid annual income.';
        errorMessage.style.display = 'block';
        return;
    }

    const salaryStr = `₹${data.salary.toLocaleString('en-IN')}`;
    const ageStr = `${data.age} yrs`;
    const empStr = data.employmentType.charAt(0).toUpperCase() + data.employmentType.slice(1);
    resultsSubtitle.textContent = `${empStr} · Annual Income: ${salaryStr} · Age: ${ageStr}`;

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await fetchAITips(data);
});

const numberInputs = ['salaryInput', 'sec80c', 'healthInsurance', 'npsContrib'];
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
