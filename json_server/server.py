from flask import Flask, request, jsonify
import redis
import json
import requests
import base64
import os
from functools import wraps
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=int(os.environ.get('REDIS_PORT', 6379)),
    password=os.environ.get('REDIS_PASSWORD', None),
    db=int(os.environ.get('REDIS_DB', 0))
)

# Get the auth token from environment variable or use a default for development
AUTH_TOKEN = os.environ.get('JSON_SERVER_AUTH_TOKEN', 'development-token-change-me')

# Get the Redis key prefix from environment variable
REDIS_KEY_PREFIX = os.environ.get('REDIS_KEY_PREFIX', 'json_server')

def get_auth_token():
    """Extract auth token from headers or URL parameters"""
    # Check for URL parameter auth
    url_token = request.args.get('auth')
    if url_token:
        try:
            # Decode base64 token from URL
            decoded_token = base64.urlsafe_b64decode(url_token.encode('utf-8')).decode('utf-8')
            return decoded_token
        except Exception:
            return None
    
    # Check for Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    
    return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_auth_token()
        
        # Check if token exists
        if not token:
            return jsonify({"status": "error", "message": "Authorization required"}), 401
        
        # Validate the token
        if token != AUTH_TOKEN:
            return jsonify({"status": "error", "message": "Invalid token"}), 403
            
        return f(*args, **kwargs)
    return decorated_function

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint that also verifies authentication"""
    token = get_auth_token()
    
    # If no token, return basic health info
    if not token:
        return jsonify({
            "status": "ok",
            "auth_required": True,
            "message": "Server is running, but authentication is required for data access"
        })
    
    # If token is provided, validate it
    if token != AUTH_TOKEN:
        return jsonify({
            "status": "error", 
            "message": "Invalid token"
        }), 403
    
    # If token is valid, return full health info
    return jsonify({
        "status": "ok",
        "auth": "valid",
        "redis_connected": redis_client.ping(),
        "version": "1.0",
        "redis_key_prefix": REDIS_KEY_PREFIX
    })

@app.route('/data/<path:key>', methods=['PUT'])
@require_auth
def store_data(key):
    """Store any data in Redis with the given key"""
    try:
        data = request.get_data()
        redis_client.set(f"{REDIS_KEY_PREFIX}:data:{key}", data)
        return jsonify({"status": "success", "key": key}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/data/<path:key>', methods=['GET'])
@require_auth
def retrieve_data(key):
    """Retrieve previously stored data by key"""
    try:
        data = redis_client.get(f"{REDIS_KEY_PREFIX}:data:{key}")
        if data is None:
            return jsonify({"status": "error", "message": "Key not found"}), 404
        
        # Return the data with proper content type
        return data
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/proxy/<path:encoded_json>', methods=['GET'])
@require_auth
def proxy_request(encoded_json):
    """Proxy HTTP requests, cache responses in Redis"""
    try:
        # Decode the base64 JSON
        json_bytes = base64.urlsafe_b64decode(encoded_json.encode('utf-8'))
        request_data = json.loads(json_bytes.decode('utf-8'))
        
        # Check required fields
        if 'url' not in request_data:
            return jsonify({"status": "error", "message": "URL is required"}), 400
        
        # Create cache key based on the request data
        cache_key = f"{REDIS_KEY_PREFIX}:proxy:{encoded_json}"
        
        # Check if we have a cached response
        cached_response = redis_client.get(cache_key)
        if cached_response:
            # Return the cached response
            return cached_response
        
        # Extract request parameters
        url = request_data.get('url')
        headers = request_data.get('headers', {})
        body = request_data.get('body')
        method = request_data.get('method', 'GET')
        
        # Make the actual request
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=body if method in ['POST', 'PUT'] else None,
            data=body if method not in ['POST', 'PUT'] and body else None
        )
        
        # Get response content
        response_content = response.content
        
        # Cache the response
        redis_client.set(cache_key, response_content)
        
        # Return the response
        return response_content, response.status_code, {'Content-Type': response.headers.get('Content-Type')}
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7781))
    app.run(host='0.0.0.0', port=port)
