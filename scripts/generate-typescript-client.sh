#!/bin/bash

# TypeScript Node Client Generator
# Generates only the TypeScript Node Client from the OpenAPI specification

set -e

echo "🚀 TypeScript Node Client Generator"
echo "=================================="

# Check if server is running (try different ports and endpoints)
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
            echo "✅ Server found on port $SERVER_PORT with endpoint $endpoint"
            break 2
        fi
    done
done

if [ "$SERVER_FOUND" = false ]; then
    echo "❌ Server is not running on any of the tried ports: ${PORTS_TO_TRY[*]}"
    echo "   Start the server first with 'npm run dev'"
    exit 1
fi

# Create generated folder
mkdir -p generated

# Download OpenAPI specification from server
echo "📥 Downloading OpenAPI specification from server..."
curl -s http://localhost:$SERVER_PORT$OPENAPI_ENDPOINT > swagger.json

# Check if the specification was downloaded successfully
if [ ! -s swagger.json ] || [ "$(cat swagger.json)" = "{}" ]; then
    echo "❌ Failed to download OpenAPI specification from server"
    echo "   The server might not be running or the endpoint is not available"
    echo "   Try accessing: http://localhost:$SERVER_PORT/api/v1/docs/openapi.json"
    exit 1
fi

echo "✅ OpenAPI specification downloaded successfully"

# Debug: Show specification info (optional)
if [ "${DEBUG:-false}" = "true" ]; then
    echo "🔍 Debug: OpenAPI specification preview:"
    head -20 swagger.json
    echo "..."
fi

# TypeScript Node Client
echo "🔧 Generating TypeScript Node Client..."
if npx @openapitools/openapi-generator-cli generate \
    -i swagger.json \
    -g typescript-node \
    -o generated/typescript-node \
    -c openapi-generator-config.json \
    --skip-validate-spec; then
    echo "✅ TypeScript Node Client generated successfully!"
else
    echo "❌ Failed to generate TypeScript Node Client"
    echo "   Check if the OpenAPI specification is valid"
    echo "   You can validate it at: https://editor.swagger.io/"
    exit 1
fi
echo ""
echo "📁 Generated Client:"
echo "  - TypeScript Node: generated/typescript-node/"
echo ""
echo "💡 Usage:"
echo "  import { ApiClient, DefaultApi } from './generated/typescript-node';" 