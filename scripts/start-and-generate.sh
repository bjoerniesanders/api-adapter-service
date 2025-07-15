#!/bin/bash

# Start Server and Generate TypeScript Client
# Starts the server if not running and generates the TypeScript client

set -e

echo "🚀 Start Server and Generate TypeScript Client"
echo "=============================================="

# Check if server is running
SERVER_PORT=${PORT:-3000}
PORTS_TO_TRY=($SERVER_PORT 3000 4000 8080 5000)
ENDPOINTS_TO_TRY=("/docs/json" "/api/v1/docs/openapi.json" "/openapi.json")

SERVER_FOUND=false
for port in "${PORTS_TO_TRY[@]}"; do
    for endpoint in "${ENDPOINTS_TO_TRY[@]}"; do
        if curl -s http://localhost:$port$endpoint > /dev/null 2>&1; then
            SERVER_PORT=$port
            OPENAPI_ENDPOINT=$endpoint
            SERVER_FOUND=true
            echo "✅ Server already running on port $SERVER_PORT"
            break 2
        fi
    done
done

# Start server if not running
if [ "$SERVER_FOUND" = false ]; then
    echo "🔄 Server not running. Starting server..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed or not in PATH"
        exit 1
    fi
    
    # Start server in background
    echo "🚀 Starting server with 'npm run dev'..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        for port in "${PORTS_TO_TRY[@]}"; do
            for endpoint in "${ENDPOINTS_TO_TRY[@]}"; do
                if curl -s http://localhost:$port$endpoint > /dev/null 2>&1; then
                    SERVER_PORT=$port
                    OPENAPI_ENDPOINT=$endpoint
                    SERVER_FOUND=true
                    echo "✅ Server started successfully on port $SERVER_PORT"
                    break 3
                fi
            done
        done
        sleep 1
    done
    
    if [ "$SERVER_FOUND" = false ]; then
        echo "❌ Failed to start server or server not responding"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
fi

# Wait a bit for server to be fully ready
sleep 2

# Generate TypeScript client
echo "🔧 Generating TypeScript client..."
bash scripts/generate-typescript-client.sh

# Cleanup: kill background server if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo "🛑 Stopping background server..."
    kill $SERVER_PID 2>/dev/null || true
fi

echo "✅ Done! TypeScript client generated successfully." 