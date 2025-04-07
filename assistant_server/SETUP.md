# Setting up the Assistant Server

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or install them individually:

```bash
pip install flask numpy scikit-learn python-dotenv
```

## Configuration

1. Copy `.env.example` to `.env`
1. Update the `.env` file with your settings:
   - Set a secure `API_TOKEN` value
   - Adjust the `SIMILARITY_THRESHOLD` and `MAX_RESULTS` as needed
   - Change the `PORT` if the default (5000) is already in use

## Running the Server

Start the server with:

```bash
python app.py
```

The server will be accessible at http://localhost:5000 (or whichever port you configured).

## Using the API

All API endpoints require authentication with the Bearer token specified in your `.env` file:

```
Authorization: Bearer your-secure-token-here
```

### Endpoints

- `GET /config`: Get the assistant configuration
- `PUT /data`: Store embedding data
- `POST /search`: Search for similar content

See the main README.md for detailed API documentation.

## Database

The server uses SQLite to store embeddings and configuration. The database file will be created automatically at the path specified in the `.env` file (default: `assistant_data.db`).
