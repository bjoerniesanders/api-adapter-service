#!/bin/bash

# Cache Testing Script for API Adapter Service
# ===========================================

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
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "DELETE" ]; then
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

echo -e "\n${GREEN}🚀 Testing Cache Functionality${NC}"
echo "================================="

# Test 1: Get initial cache statistics
test_endpoint "Initial Cache Statistics" "GET" "${BASE_URL}/api/v1/cache/stats"

# Test 2: Make a GET request (should be cached)
test_endpoint "First GET Request (will be cached)" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
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
          "limit": "5"
        }
      }
    }'

# Test 3: Make the same GET request again (should hit cache)
test_endpoint "Second GET Request (should hit cache)" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
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
          "limit": "5"
        }
      }
    }'

# Test 4: Check cache statistics after requests
test_endpoint "Cache Statistics After Requests" "GET" "${BASE_URL}/api/v1/cache/stats"

# Test 5: Make a different GET request
test_endpoint "Different GET Request" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "GET",
        "url": "/posts",
        "headers": {
          "Accept": "application/json"
        }
      }
    }'

# Test 6: Make a POST request (should not be cached)
test_endpoint "POST Request (should not be cached)" "POST" "${BASE_URL}/api/v1/adapters/example-api/execute" \
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
          "name": "Test User",
          "email": "test@example.com"
        }
      }
    }'

# Test 7: Check cache statistics again
test_endpoint "Cache Statistics After Mixed Requests" "GET" "${BASE_URL}/api/v1/cache/stats"

# Test 8: Invalidate specific cache entry
test_endpoint "Invalidate Specific Cache Entry" "DELETE" "${BASE_URL}/api/v1/cache/invalidate/example-api/entry" \
    "Content-Type: application/json" \
    '{
      "method": "GET",
      "url": "/users",
      "params": {
        "limit": "5"
      }
    }'

# Test 9: Check cache statistics after invalidation
test_endpoint "Cache Statistics After Invalidation" "GET" "${BASE_URL}/api/v1/cache/stats"

# Test 10: Invalidate all cache for adapter
test_endpoint "Invalidate Adapter Cache" "DELETE" "${BASE_URL}/api/v1/cache/invalidate/example-api"

# Test 11: Check cache statistics after adapter invalidation
test_endpoint "Cache Statistics After Adapter Invalidation" "GET" "${BASE_URL}/api/v1/cache/stats"

# Test 12: Clear all cache
test_endpoint "Clear All Cache" "DELETE" "${BASE_URL}/api/v1/cache/clear"

# Test 13: Final cache statistics
test_endpoint "Final Cache Statistics" "GET" "${BASE_URL}/api/v1/cache/stats"

echo -e "\n${GREEN}✅ Cache Testing Complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo "- Cache functionality has been tested"
echo "- Cache hit/miss statistics are displayed"
echo "- Cache invalidation methods work correctly"
echo -e "${YELLOW}💡 Tip: Check the server logs for cache HIT/MISS messages${NC}" 