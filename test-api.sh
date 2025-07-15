#!/bin/bash

# API Adapter Service Test Script with Postman Collection Integration
# =================================================================

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

# Function to test endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local headers="$4"
    local data="$5"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "URL: $url"
    
    local curl_cmd="curl -s -w '\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n'"
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "PATCH" ]; then
        curl_cmd="$curl_cmd -X $method"
        if [ -n "$headers" ]; then
            curl_cmd="$curl_cmd -H '$headers'"
        fi
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd)
    local status_code=$(echo "$response" | grep "HTTP Status:" | cut -d' ' -f3)
    local response_time=$(echo "$response" | grep "Response Time:" | cut -d' ' -f3)
    local body=$(echo "$response" | sed '/HTTP Status:/d' | sed '/Response Time:/d')
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        print_status "success" "Test passed (Status: $status_code, Time: ${response_time}s)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_status "error" "Test failed (Status: $status_code, Time: ${response_time}s)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

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

echo -e "\n${GREEN}🚀 Testing API Adapter Service${NC}"
echo "================================="

# Test 1: Root Endpoint (from Postman Collection)
test_endpoint "Root Endpoint" "GET" "${BASE_URL}/"

# Test 2: Health Check (from Postman Collection)
test_endpoint "Health Check" "GET" "${BASE_URL}/api/v1/health"

# Test 3: Detailed Health Check
test_endpoint "Detailed Health Check" "GET" "${BASE_URL}/api/v1/health/detailed"

# Test 4: Readiness Check
test_endpoint "Readiness Check" "GET" "${BASE_URL}/api/v1/health/ready"

# Test 5: Liveness Check
test_endpoint "Liveness Check" "GET" "${BASE_URL}/api/v1/health/live"

# Test 6: Get Available Adapters (from Postman Collection)
test_endpoint "Get Available Adapters" "GET" "${BASE_URL}/api/v1/adapters"

# Test 7: Get Adapter Status (from Postman Collection)
test_endpoint "Get Adapter Status" "GET" "${BASE_URL}/api/v1/adapters/example-api/status"

# Test 8: Test Adapter Connection (from Postman Collection)
test_endpoint "Test Adapter Connection" "POST" "${BASE_URL}/api/v1/adapters/example-api/test" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "GET",
        "url": "/users",
        "headers": {
          "Accept": "application/json"
        }
      }
    }'

# Test 9: GET Request via Adapter (from Postman Collection)
test_endpoint "GET Request via Adapter" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "GET",
        "url": "/users",
        "headers": {
          "Accept": "application/json"
        },
        "params": {
          "limit": "10",
          "page": "1"
        }
      }
    }'

# Test 10: POST Request via Adapter (from Postman Collection)
test_endpoint "POST Request via Adapter" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "POST",
        "url": "/users",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        "body": {
          "name": "John Doe",
          "email": "john@example.com",
          "role": "user"
        }
      }
    }'

# Test 11: PUT Request via Adapter (from Postman Collection)
test_endpoint "PUT Request via Adapter" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "PUT",
        "url": "/users/123",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        "body": {
          "name": "John Doe Updated",
          "email": "john.updated@example.com",
          "role": "admin"
        }
      }
    }'

# Test 12: PATCH Request via Adapter (from Postman Collection)
test_endpoint "PATCH Request via Adapter" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "PATCH",
        "url": "/users/123",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        "body": {
          "role": "moderator"
        }
      }
    }'

# Test 13: DELETE Request via Adapter (from Postman Collection)
test_endpoint "DELETE Request via Adapter" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "DELETE",
        "url": "/users/123",
        "headers": {
          "Accept": "application/json"
        }
      }
    }'

# Test 14: Weather API (Complex Example)
test_endpoint "Weather API" "POST" "${BASE_URL}/api/v1/adapters/weather-api/execute" \
    "Content-Type: application/json" \
    '{
      "request": {
        "method": "GET",
        "url": "/current.json",
        "query": {
          "q": "Berlin",
          "key": "your-api-key-here"
        },
        "headers": {
          "Accept": "application/json"
        }
      }
    }'

# Test 15: Documentation - Swagger UI (from Postman Collection)
test_endpoint "Swagger UI" "GET" "${BASE_URL}/docs"

# Test 16: Documentation - OpenAPI JSON (from Postman Collection)
test_endpoint "OpenAPI JSON" "GET" "${BASE_URL}/docs/openapi.json"

# Test 17: Management - Get Configuration
test_endpoint "Get Configuration" "GET" "${BASE_URL}/api/v1/management/config"

# Test 18: Management - Update Configuration
test_endpoint "Update Configuration" "PUT" "${BASE_URL}/api/v1/management/config" \
    "Content-Type: application/json" \
    '{
      "example-api": {
        "name": "example-api",
        "baseUrl": "https://api.example.com",
        "timeout": 30000,
        "headers": {
          "Authorization": "Bearer YOUR_TOKEN_HERE"
        }
      }
    }'

echo -e "\n${GREEN}✅ API Testing Complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo "- All endpoints from Postman Collection have been tested"
echo "- Response times and status codes are displayed"
echo "- JSON responses are formatted for readability"
echo -e "${YELLOW}💡 Tip: Use 'jq' for better JSON formatting if available${NC}" 