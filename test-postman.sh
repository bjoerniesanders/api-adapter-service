#!/bin/bash

# Postman Collection Test Runner for API Adapter Service
# ====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Function to extract JSON value
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | jq -r "$key" 2>/dev/null || echo ""
}

# Function to test endpoint from Postman collection
test_postman_request() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local headers="$4"
    local body="$5"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "Method: $method"
    echo "URL: $url"
    
    local curl_cmd="curl -s -w '\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n'"
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "PATCH" ]; then
        curl_cmd="$curl_cmd -X $method"
        if [ -n "$headers" ]; then
            curl_cmd="$curl_cmd -H '$headers'"
        fi
        if [ -n "$body" ]; then
            curl_cmd="$curl_cmd -d '$body'"
        fi
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd)
    local status_code=$(echo "$response" | grep "HTTP Status:" | cut -d' ' -f3)
    local response_time=$(echo "$response" | grep "Response Time:" | cut -d' ' -f3)
    local body_response=$(echo "$response" | sed '/HTTP Status:/d' | sed '/Response Time:/d')
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        print_status "success" "Test passed (Status: $status_code, Time: ${response_time}s)"
        echo "$body_response" | jq '.' 2>/dev/null || echo "$body_response"
    else
        print_status "error" "Test failed (Status: $status_code, Time: ${response_time}s)"
        echo "$body_response" | jq '.' 2>/dev/null || echo "$body_response"
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_status "warning" "jq is not installed. Install it for better JSON parsing."
    print_status "info" "On macOS: brew install jq"
    print_status "info" "On Ubuntu: sudo apt-get install jq"
fi

# Try to find the server on different ports
SERVER_PORT=${PORT:-3000}
PORTS_TO_TRY=($SERVER_PORT 3000 4000 8080 5000)

SERVER_FOUND=false
for port in "${PORTS_TO_TRY[@]}"; do
    if curl -s http://localhost:$port/api/v1/health > /dev/null 2>&1; then
        BASE_URL="http://localhost:$port"
        SERVER_FOUND=true
        print_status "success" "Server found on port $port"
        break
    fi
done

if [ "$SERVER_FOUND" = false ]; then
    print_status "error" "Server is not running on any of the tried ports: ${PORTS_TO_TRY[*]}"
    print_status "info" "Start the server first with 'npm run dev'"
    exit 1
fi

# Check if Postman collection exists
COLLECTION_FILE="examples/postman-collection.json"
if [ ! -f "$COLLECTION_FILE" ]; then
    print_status "error" "Postman collection not found: $COLLECTION_FILE"
    exit 1
fi

print_status "info" "Loading Postman collection from: $COLLECTION_FILE"

# Read the Postman collection
COLLECTION_JSON=$(cat "$COLLECTION_FILE")

echo -e "\n${GREEN}🚀 Testing API Adapter Service with Postman Collection${NC}"
echo "=========================================================="

# Extract and test each request from the collection
echo "$COLLECTION_JSON" | jq -r '.item[] | select(.item != null) | .item[] | select(.request != null) | "\(.name)|\(.request.method)|\(.request.url.raw)|\(.request.header // [] | map("\(.key): \(.value)") | join("; "))|\(.request.body.raw // "")"' | while IFS='|' read -r name method url headers body; do
    if [ -n "$name" ] && [ -n "$method" ] && [ -n "$url" ]; then
        # Replace variables in URL
        url=$(echo "$url" | sed "s|{{baseUrl}}|$BASE_URL|g")
        
        # Clean up headers
        headers=$(echo "$headers" | sed 's/^;//' | sed 's/;$//')
        
        # Clean up body (remove newlines and extra spaces)
        if [ -n "$body" ]; then
            body=$(echo "$body" | tr '\n' ' ' | sed 's/  */ /g')
        fi
        
        test_postman_request "$name" "$method" "$url" "$headers" "$body"
    fi
done

# Alternative: Test specific endpoints manually with proper data
echo -e "\n${BLUE}Testing specific endpoints with proper data:${NC}"

# Test GET /api/v1/adapters/{adapterName}/status
test_postman_request "Get Adapter Status (example-api)" "GET" "$BASE_URL/api/v1/adapters/example-api/status" "" ""

# Test POST /api/v1/adapters/{adapterName}/test
test_postman_request "Test Adapter Connection (example-api)" "POST" "$BASE_URL/api/v1/adapters/example-api/test" "Content-Type: application/json" '{"adapterName": "example-api", "request": {"method": "GET", "url": "/users", "headers": {"Accept": "application/json"}}}'

# Test POST /api/v1/adapters/{adapterName}/execute with GET
test_postman_request "GET Request via Adapter" "POST" "$BASE_URL/api/v1/adapters/example-api/execute" "Content-Type: application/json" '{"adapterName": "example-api", "request": {"method": "GET", "url": "/users", "headers": {"Accept": "application/json"}, "params": {"limit": "10", "page": "1"}}}'

# Test POST /api/v1/adapters/{adapterName}/execute with POST
test_postman_request "POST Request via Adapter" "POST" "$BASE_URL/api/v1/adapters/example-api/execute" "Content-Type: application/json" '{"adapterName": "example-api", "request": {"method": "POST", "url": "/users", "headers": {"Accept": "application/json", "Content-Type": "application/json"}, "body": {"name": "John Doe", "email": "john@example.com", "role": "user"}}}'

# Test PUT /api/v1/management/config
test_postman_request "Update Configuration" "PUT" "$BASE_URL/api/v1/management/config" "Content-Type: application/json" '{"example-api": {"name": "example-api", "baseUrl": "https://api.example.com", "timeout": 30000, "headers": {"Authorization": "Bearer YOUR_TOKEN_HERE"}}}'

# Test PATCH /api/v1/management/config
test_postman_request "Patch Configuration" "PATCH" "$BASE_URL/api/v1/management/config" "Content-Type: application/json" '{"example-api": {"timeout": 60000}}'

echo -e "\n${GREEN}✅ Postman Collection Testing Complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo "- All requests from Postman Collection have been executed"
echo "- Response times and status codes are displayed"
echo "- JSON responses are formatted for readability"
echo -e "${YELLOW}💡 Tip: Use 'jq' for better JSON formatting if available${NC}" 