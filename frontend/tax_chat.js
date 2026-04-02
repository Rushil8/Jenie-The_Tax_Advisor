
const TAX_FORM_CONTEXT = `You are Jenie, a friendly and concise Indian tax assistant. 
The calculator has these fields:
1. Assessment Year — Oct–Sep period for tax filing.
2. Tax Regime — Choose between:
   - Old Regime: Allows deductions (80C, 80D, etc.) but has higher rates.
   - New Regime: Lower slab rates, but no deductions (except standard ₹75k).
3. Age Category — Determines exemption limit.
4. Annual Salary — Total gross salary.
5. Other Income — Interest, dividends, rent.
6. 80C — EPF, PPF, ELSS, Insurance (Max ₹1.5L).
7. 80D — Health Insurance.
8. 24b — Home Loan Interest (Max ₹2L).
9. Other — 80TTA, 80E, etc.

Rules:
- Be brief and friendly (2–4 sentences).
- Use ₹ amounts and section numbers.
- If Old Regime doesn't apply for a deduction, mention it.`;

const FALLBACK_ANSWERS = {
    'assessment year': 'The <b>Assessment Year</b> is the year in which you file your return, one year after the income-earning period. E.g., for FY 2024-25, the AY is <b>2025-26</b>.',
    'tax regime': 'The <b>Old Regime</b> allows deductions (80C, 80D, etc.) but has higher tax rates. The <b>New Regime</b> has lower rates but no deductions (except ₹75,000 standard deduction for salaried).',
    '80c': '<b>Section 80C</b> (Max ₹1,50,000) includes: EPF, PPF, Life Insurance, ELSS Mutual Funds, and Home Loan Principal.',
    '80d': '<b>Section 80D</b> allows deduction for health insurance premiums. Max ₹25,000 for self/family, and up to ₹50,000 for senior citizen parents.'
};

const API_BASE = window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:5000"
    : "https://jenie-thetaxadvisor.netlify.app";

let chatHistory = [];

function getFallbackAnswer(question) {
    const q = question.toLowerCase();
    for (const [kw, ans] of Object.entries(FALLBACK_ANSWERS)) { if (q.includes(kw)) return ans; }
    return "I'm not sure about that specific query. Try asking about a specific field like <b>80C</b>, <b>80D</b>, or <b>Tax Regime</b>.";
}

function scrollToBottom() {
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

window.toggleChatbot = () => {
    document.getElementById('chatbotWindow').classList.toggle('open');
    document.body.classList.toggle('chatbot-open');
    scrollToBottom();
};

function appendMessage(text, role) {
    const msgs = document.getElementById('chatMessages');
    if (role === 'user') {
        const chips = document.getElementById('chatChips');
        if (chips) chips.style.display = 'none';
    }
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = text;
    msgs.appendChild(div);
    scrollToBottom();
    return div;
}

window.sendChip = (question) => {
    document.getElementById('chatInput').value = question;
    sendChat();
};

window.sendChat = async () => {
    const input = document.getElementById('chatInput');
    const question = input.value.trim();
    if (!question) return;

    input.value = '';
    appendMessage(question, 'user');
    const typingDiv = appendMessage('Typing...', 'typing');

    
    chatHistory.push({ role: 'user', content: question });

    try {
        const messages = [
            { role: 'system', content: TAX_FORM_CONTEXT },
            ...chatHistory.slice(-6) 
        ];

        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                messages,
                model: "llama-3.3-70b-versatile"
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.error || 'Groq server error');

        const answer = data.choices[0].message.content.trim();
        chatHistory.push({ role: 'assistant', content: answer });

        typingDiv.className = 'chat-msg bot';
        typingDiv.innerHTML = answer;
    } catch (err) {
        console.error('Groq Chat Error:', err);
        typingDiv.className = 'chat-msg bot';
        
        let errorMsg = "I'm currently waking up my database! Please give me about 30 seconds and try your question again! ☕";
        if (err.message.includes('fetch')) {
            // Keep the wake-up message for network/timeout errors
        } else {
             errorMsg = getFallbackAnswer(question);
        }
        typingDiv.innerHTML = errorMsg;
    }
    scrollToBottom();
};
