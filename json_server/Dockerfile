FROM python:3.11-slim

# Set environment variables
ENV PORT=7781
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV REDIS_DB=0
# Set a default auth token - should be overridden in production
ENV JSON_SERVER_AUTH_TOKEN=development-token-change-me
# Set a default Redis key prefix
ENV REDIS_KEY_PREFIX=json_server

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

EXPOSE 7781

CMD ["python", "server.py"]
