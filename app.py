from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = Flask(__name__)
# Allow requests from your future Netlify URL (or all origins '*' for testing)
CORS(app) 

@app.route('/')
def home():
    return "Jenie AI Backend is Live and Secure!"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    model = data.get('model', 'llama-3.3-70b-versatile')
    
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return jsonify({"error": "GROQ_API_KEY not configured on server"}), 500
        
    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'messages': messages,
                'model': model,
                'temperature': 0.5,
                'max_tokens': 512
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return jsonify({"error": response.json().get('error', {}).get('message', 'Groq API error')}), response.status_code
            
        return jsonify(response.json()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
