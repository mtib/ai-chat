# JSON Server with Redis

A simple Flask-based server that connects to Redis for data storage and provides proxy capabilities for caching external API calls.

## Features

- Store and retrieve arbitrary data with key-based access
- Proxy HTTP requests and cache their responses
- Docker ready for easy deployment
- Secure access with bearer token authentication

## API Endpoints

### Data Storage

- `PUT /data/<key>`: Store any data with the given key
- `GET /data/<key>`: Retrieve previously stored data by key

### Request Proxy

- `GET /proxy/<base64_encoded_json>`: Proxy an HTTP request based on the provided JSON configuration

  The encoded JSON should have the following structure:
  ```json
  {
    "url": "https://api.example.com/endpoint", // Required
    "headers": {}, // Optional
    "body": {}, // Optional
    "method": "GET" // Optional (defaults to GET)
  }
  ```

### Health Check

- `GET /health`: Check if the server is running and verify authentication

## Authentication

All endpoints (except basic health checks) require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer your-auth-token
```

The default token is `development-token-change-me` which can be overridden by setting the `JSON_SERVER_AUTH_TOKEN` environment variable.

## Running Locally

### Prerequisites

- Python 3.8+
- Redis server

### Installation

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the server:
   ```
   python server.py
   ```

The server will start on port 7781 by default.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REDIS_HOST | Redis server hostname | localhost |
| REDIS_PORT | Redis server port | 6379 |
| REDIS_PASSWORD | Redis server password | None |
| REDIS_DB | Redis database index | 0 |
| PORT | Server port | 7781 |
| JSON_SERVER_AUTH_TOKEN | Authentication token | development-token-change-me |
| REDIS_KEY_PREFIX | Prefix for all Redis keys | json_server |

## Docker Deployment

Build the Docker image:
```
docker build -t json-server .
```

Run the container:
```
docker run -p 7781:7781 -e REDIS_HOST=your-redis-host -e JSON_SERVER_AUTH_TOKEN=your-secure-token -e REDIS_KEY_PREFIX=your-app-prefix json-server
```

## Example Usage

### Storing Data
```bash
curl -X PUT -d "Some data to store" -H "Authorization: Bearer your-auth-token" http://localhost:7781/data/mykey
```

### Retrieving Data
```bash
curl -H "Authorization: Bearer your-auth-token" http://localhost:7781/data/mykey
```

### Proxying a Request
```bash
# First encode your request as JSON and then base64
REQUEST='{
  "url": "https://api.example.com/data",
  "headers": {"Authorization": "Bearer token"}
}'
ENCODED=$(echo -n "$REQUEST" | base64 -w 0)
curl -H "Authorization: Bearer your-auth-token" "http://localhost:7781/proxy/$ENCODED"
```
