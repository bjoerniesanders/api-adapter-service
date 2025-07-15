#!/bin/bash

# API Adapter Service - cURL Examples
# ===================================

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/v1"

echo "🚀 API Adapter Service - cURL Examples"
echo "====================================="
echo ""

# GET Requests
echo "📋 GET Requests"
echo "---------------"

echo "1. Root endpoint:"
echo "curl -X GET $BASE_URL/"
echo ""

echo "2. List all adapters:"
echo "curl -X GET $API_BASE/adapters"
echo ""

echo "3. Get adapter status:"
echo "curl -X GET $API_BASE/adapters/example-api/status"
echo ""

echo "4. Test adapter:"
echo "curl -X GET $API_BASE/adapters/example-api/test"
echo ""

echo "5. Health check:"
echo "curl -X GET $API_BASE/health"
echo ""

echo "6. Detailed health check:"
echo "curl -X GET $API_BASE/health/detailed"
echo ""

echo "7. Readiness check:"
echo "curl -X GET $API_BASE/health/ready"
echo ""

echo "8. Liveness check:"
echo "curl -X GET $API_BASE/health/live"
echo ""

echo "9. OpenAPI schema:"
echo "curl -X GET $API_BASE/docs/openapi.json"
echo ""

echo "10. API information:"
echo "curl -X GET $API_BASE/docs/info"
echo ""

echo "11. API examples:"
echo "curl -X GET $API_BASE/docs/examples"
echo ""

# POST Requests
echo ""
echo "📤 POST Requests"
echo "----------------"

echo "12. Execute GET request through adapter:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/users",
      "headers": {
        "Accept": "application/json"
      },
      "query": {
        "limit": "10",
        "offset": "0"
      }
    }
  }'
EOF
echo ""

echo "13. Execute POST request through adapter:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "POST",
      "url": "/users",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "active": true
      }
    }
  }'
EOF
echo ""

echo "14. Execute PUT request through adapter:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "PUT",
      "url": "/users/123",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "name": "John Doe (updated)",
        "email": "john.updated@example.com",
        "age": 31,
        "active": true
      }
    }
  }'
EOF
echo ""

echo "15. Execute PATCH request through adapter:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "PATCH",
      "url": "/users/123",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "email": "john.newemail@example.com",
        "active": false
      }
    }
  }'
EOF
echo ""

echo "16. Execute DELETE request through adapter:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "DELETE",
      "url": "/users/123",
      "headers": {
        "Accept": "application/json"
      }
    }
  }'
EOF
echo ""

echo "17. Complex weather API request:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/weather-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/current.json",
      "headers": {
        "Accept": "application/json"
      },
      "query": {
        "q": "London",
        "lang": "en",
        "aqi": "yes"
      }
    }
  }'
EOF
echo ""

# Advanced Examples
echo ""
echo "🔧 Advanced Examples"
echo "-------------------"

echo "18. With authentication:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/protected/users",
      "headers": {
        "Accept": "application/json"
      }
    }
  }'
EOF
echo ""

echo "19. With custom headers:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/users",
      "headers": {
        "Accept": "application/json",
        "User-Agent": "MyApp/1.0.0",
        "X-Custom-Header": "custom-value"
      }
    }
  }'
EOF
echo ""

echo "20. With query parameters and path parameters:"
cat << 'EOF'
curl -X POST $API_BASE/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/users/123/posts",
      "headers": {
        "Accept": "application/json"
      },
      "query": {
        "category": "tech",
        "limit": "5",
        "sort": "date"
      }
    }
  }'
EOF
echo ""

# Practical Functions
echo ""
echo "💡 Practical Functions"
echo "--------------------"

echo "21. Check server status:"
echo "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/"
echo ""

echo "22. Adapter list as JSON:"
echo "curl -s $API_BASE/adapters | jq '.'"
echo ""

echo "23. Health check with jq:"
echo "curl -s $API_BASE/health | jq '.status'"
echo ""

echo "24. Save OpenAPI schema:"
echo "curl -s $API_BASE/docs/openapi.json > swagger.json"
echo ""

echo "25. Test all endpoints:"
cat << 'EOF'
for endpoint in "/" "/api/v1/adapters" "/api/v1/health" "/api/v1/health/ready" "/api/v1/health/live"; do
  echo "Testing $endpoint..."
  curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL$endpoint
done
EOF
echo ""

echo "✅ All cURL examples ready!"
echo ""
echo "💡 Tip: Use 'jq' for better JSON formatting:"
echo "   curl -s $API_BASE/adapters | jq '.'"
echo ""
echo "💡 Tip: Save responses to files:"
echo "   curl -s $API_BASE/health > health-response.json" 