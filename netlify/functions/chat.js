exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST" && event.httpMethod !== "OPTIONS") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: ""
        };
    }
    
    try {
        const bodyStr = event.body || "{}";
        const data = JSON.parse(bodyStr);
        const messages = data.messages || [];
        const model = data.model || 'llama-3.3-70b-versatile';
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: { message: "GROQ_API_KEY environment variable is missing. Please add it to your Netlify Site Configurations." } })
            };
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: model,
                temperature: 0.5,
                max_tokens: 512
            })
        });

        const respData = await response.json();
        
        return {
            statusCode: response.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(respData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: { message: error.message } })
        };
    }
};
