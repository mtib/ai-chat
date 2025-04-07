import os
import json
from flask import Flask, request, jsonify
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from database import Database
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT"], allow_headers=["Content-Type", "Authorization"])
db = Database()

# Get the API token from environment
API_TOKEN = os.getenv("API_TOKEN", "default-token")

def authorize(request):
    """Check if the request is authorized"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return False
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False
    
    token = parts[1]
    return token == API_TOKEN

@app.before_request
def check_auth():
    """Middleware to check authorization for all routes"""
    # Skip auth for health check endpoint and OPTIONS requests (CORS preflight)
    if request.endpoint in ["health_check"] or request.method == "OPTIONS":
        return
    
    if not authorize(request):
        return jsonify({"error": "Unauthorized"}), 401

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/config', methods=['GET'])
def get_config():
    """Serve system configuration"""
    config = db.get_config()
    return jsonify(config), 200

@app.route('/data', methods=['PUT'])
def store_data():
    """Store embedding and payload data"""
    data = request.json
    if not data or "embedding" not in data or "payload" not in data:
        return jsonify({"error": "Invalid request body"}), 400
    
    embedding = data["embedding"]
    payload = data["payload"]
    
    # Validate embedding format
    if not isinstance(embedding, list) or not all(isinstance(x, (int, float)) for x in embedding):
        return jsonify({"error": "Invalid embedding format"}), 400
    
    db.store_embedding_data(embedding, payload)
    return jsonify({"status": "success"}), 201

@app.route('/search', methods=['POST'])
def search_data():
    """Find similar payloads based on embedding"""
    data = request.json
    if not data or "embedding" not in data:
        return jsonify({"error": "Invalid request body"}), 400
    
    embedding = data["embedding"]
    
    # Validate embedding format
    if not isinstance(embedding, list) or not all(isinstance(x, (int, float)) for x in embedding):
        return jsonify({"error": "Invalid embedding format"}), 400
    
    # Get similar payloads
    similar_payloads = db.find_similar_payloads(embedding)
    return jsonify({"payload": similar_payloads}), 200

if __name__ == "__main__":
    # Initialize the database
    db.initialize()
    
    # Run the app
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
