import os
import sqlite3
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class Database:
    def __init__(self):
        self.db_path = os.getenv("DB_PATH", "assistant_data.db")
        self.similarity_threshold = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
        self.max_results = int(os.getenv("MAX_RESULTS", "5"))
    
    def get_connection(self):
        """Create and return a database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable row access by column name
        return conn
    
    def initialize(self):
        """Initialize the database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create config table if not exists
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        ''')
        
        # Create embeddings table if not exists
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vector TEXT,
            payload TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Initialize default config values if not present
        default_config = {
            "prompt": os.getenv("INITIAL_PROMPT", "You are a helpful assistant."),
            "description": "This assistant provides helpful information based on stored knowledge.",
            "short_description": "Helpful knowledge assistant",
            "embedding": "text-embedding-3-small"
        }
        
        for key, value in default_config.items():
            cursor.execute(
                "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)",
                (key, value)
            )
            
        conn.commit()
        conn.close()
    
    def get_config(self):
        """Retrieve system configuration"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        config = {}
        for row in cursor.execute("SELECT key, value FROM config"):
            config[row["key"]] = row["value"]
        
        # Add the current size of the database
        cursor.execute("SELECT COUNT(*) as count FROM embeddings")
        row = cursor.fetchone()
        config["size"] = int(row["count"]) if row else 0
        
        conn.close()
        return config
    
    def store_embedding_data(self, embedding, payload):
        """Store embedding and its associated payload"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Store as JSON string
        embedding_json = json.dumps(embedding)
        
        cursor.execute(
            "INSERT INTO embeddings (vector, payload) VALUES (?, ?)",
            (embedding_json, payload)
        )
        
        conn.commit()
        conn.close()
    
    def find_similar_payloads(self, query_embedding):
        """Find payloads with similar embeddings"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get all embeddings
        cursor.execute("SELECT vector, payload FROM embeddings")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
        
        # Convert query embedding to numpy array
        query_np = np.array(query_embedding).reshape(1, -1)
        
        similarities = []
        for row in rows:
            if query_np.shape[1] != len(json.loads(row["vector"])):
                print(f"Skipping row with incompatible vector size: {len(row['vector'])}")
                continue
            db_embedding = np.array(json.loads(row["vector"])).reshape(1, -1)
            similarity = cosine_similarity(query_np, db_embedding)[0][0]
            print(similarity)
            similarities.append((similarity, row["payload"]))
        
        # Sort by similarity (descending) and filter by threshold
        similarities.sort(reverse=True)
        results = [payload for sim, payload in similarities 
                   if sim >= self.similarity_threshold]
        
        # Limit number of results
        return results[:self.max_results]
