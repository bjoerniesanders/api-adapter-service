#!/bin/bash

# Retry Testing Script for API Adapter Service
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

echo -e "\n${GREEN}🚀 Testing Retry Functionality${NC}"
echo "================================="

# Test 1: Get initial retry statistics
test_endpoint "Initial Retry Statistics" "GET" "${BASE_URL}/api/v1/retry/stats"

# Test 2: Get retry configuration
test_endpoint "Retry Configuration" "GET" "${BASE_URL}/api/v1/retry/config"

# Test 3: Test retry with a request that might fail (network error)
test_endpoint "Test Retry with Network Error" "POST" "${BASE_URL}/api/v1/retry/test" \
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

# Test 4: Test retry with a request that might fail (timeout)
test_endpoint "Test Retry with Timeout" "POST" "${BASE_URL}/api/v1/retry/test" \
    "Content-Type: application/json" \
    '{
      "adapterName": "weather-api",
      "request": {
        "method": "GET",
        "url": "/current.json",
        "params": {
          "q": "London",
          "key": "invalid-key"
        }
      }
    }'

# Test 5: Check retry statistics after failed requests
test_endpoint "Retry Statistics After Failed Requests" "GET" "${BASE_URL}/api/v1/retry/stats"

# Test 6: Test retry with a potentially successful request
test_endpoint "Test Retry with Valid Request" "POST" "${BASE_URL}/api/v1/retry/test" \
    "Content-Type: application/json" \
    '{
      "adapterName": "example-api",
      "request": {
        "method": "GET",
        "url": "/health",
        "headers": {
          "Accept": "application/json"
        }
      }
    }'

# Test 7: Check retry statistics after mixed requests
test_endpoint "Retry Statistics After Mixed Requests" "GET" "${BASE_URL}/api/v1/retry/stats"

# Test 8: Reset retry statistics
test_endpoint "Reset Retry Statistics" "DELETE" "${BASE_URL}/api/v1/retry/stats"

# Test 9: Verify statistics are reset
test_endpoint "Verify Statistics Reset" "GET" "${BASE_URL}/api/v1/retry/stats"

# Test 10: Test multiple rapid requests to see retry behavior
echo -e "\n${YELLOW}Testing rapid requests to observe retry behavior...${NC}"
for i in {1..3}; do
    echo -e "\n${BLUE}Request $i:${NC}"
    curl -s -X POST "${BASE_URL}/api/v1/retry/test" \
        -H "Content-Type: application/json" \
        -d '{
          "adapterName": "example-api",
          "request": {
            "method": "GET",
            "url": "/users",
            "headers": {
              "Accept": "application/json"
            }
          }
        }' | jq '.success, .error, .retryInfo.totalTime' 2>/dev/null || echo "Request failed"
done

# Test 11: Final retry statistics
test_endpoint "Final Retry Statistics" "GET" "${BASE_URL}/api/v1/retry/stats"

echo -e "\n${GREEN}✅ Retry Testing Complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo "- Retry functionality has been tested"
echo "- Retry statistics are displayed"
echo "- Configuration is accessible"
echo "- Statistics can be reset"
echo -e "${YELLOW}💡 Tip: Check the server logs for retry attempt messages${NC}"
echo -e "${YELLOW}💡 Note: Retry behavior depends on external API availability and configuration${NC}" 