# API Adapter Service Testing Guide

This document explains how to test the API Adapter Service using the provided test scripts and Postman collection.

## Overview

The API Adapter Service comes with multiple testing options:

1. **Manual Testing Script** (`test-api.sh`) - Comprehensive manual tests
2. **Postman Collection Runner** (`test-postman.sh`) - Automated tests from Postman collection
3. **Postman Collection** (`examples/postman-collection.json`) - Import into Postman for manual testing

## Prerequisites

### Required Tools

- **curl** - HTTP client (usually pre-installed)
- **jq** - JSON processor (recommended for better output formatting)

### Installing jq

**macOS:**
```bash
brew install jq
```

**Ubuntu/Debian:**
```bash
sudo apt-get install jq
```

**CentOS/RHEL:**
```bash
sudo yum install jq
```

## Test Scripts

### 1. Manual Testing Script (`test-api.sh`)

This script provides comprehensive testing of all API endpoints with detailed output.

#### Features:
- ✅ Colored output for better readability
- ✅ Response time measurement
- ✅ HTTP status code validation
- ✅ JSON response formatting
- ✅ Automatic server detection
- ✅ All CRUD operations (GET, POST, PUT, PATCH, DELETE)
- ✅ Health checks and monitoring endpoints
- ✅ Management endpoints

#### Usage:
```bash
# Make sure the server is running first
npm run dev

# Run the test script
./test-api.sh

# Or with custom port
PORT=4000 ./test-api.sh
```

#### Test Coverage:
- Root endpoint
- Health checks (basic, detailed, readiness, liveness)
- Adapter management (list, status, test)
- CRUD operations via adapters
- Documentation endpoints
- Management endpoints

### 2. Postman Collection Runner (`test-postman.sh`)

This script automatically parses and executes the Postman collection.

#### Features:
- ✅ Automatic Postman collection parsing
- ✅ Variable substitution (`{{baseUrl}}`)
- ✅ Header and body extraction
- ✅ Response validation
- ✅ Performance metrics

#### Usage:
```bash
# Make sure the server is running first
npm run dev

# Run the Postman collection tests
./test-postman.sh

# Or with custom port
PORT=4000 ./test-postman.sh
```

#### How it works:
1. Loads the Postman collection from `examples/postman-collection.json`
2. Parses each request using `jq`
3. Substitutes variables (e.g., `{{baseUrl}}` → `http://localhost:3000`)
4. Executes each request with curl
5. Validates responses and displays results

## Postman Collection

### Import into Postman

1. Open Postman
2. Click "Import"
3. Select the file: `examples/postman-collection.json`
4. The collection will be imported with all endpoints

### Collection Structure

```
API Adapter Service
├── Health Check
│   └── Get Health Status
├── Documentation
│   ├── Swagger UI
│   └── OpenAPI JSON
├── Adapters
│   ├── List Available Adapters
│   ├── Get Adapter Status
│   └── Test Adapter Connection
├── Adapter Execute
│   ├── GET Request
│   ├── POST Request
│   ├── PUT Request
│   ├── PATCH Request
│   └── DELETE Request
└── Management
    ├── Get Adapter Configuration
    ├── Update Adapter Configuration
    └── Patch Adapter Configuration
```

### Environment Variables

The collection uses the following variables:
- `{{baseUrl}}` - Base URL of the API (default: `http://localhost:3000`)

## Manual Testing with curl

You can also test individual endpoints manually:

### Health Check
```bash
curl -s http://localhost:3000/api/v1/health | jq '.'
```

### List Adapters
```bash
curl -s http://localhost:3000/api/v1/adapters | jq '.'
```

### Execute GET Request via Adapter
```bash
curl -s -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "url": "/users",
      "headers": {
        "Accept": "application/json"
      }
    }
  }' | jq '.'
```

### Execute POST Request via Adapter
```bash
curl -s -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
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
        "email": "john@example.com"
      }
    }
  }' | jq '.'
```

## Expected Test Results

### Successful Tests
- ✅ Green checkmarks for passed tests
- HTTP status codes 200-299
- Response times under 1 second
- Valid JSON responses

### Common Test Failures

#### 1. Server Not Running
```
❌ Server is not running on any of the tried ports: 3000 4000 8080 5000
ℹ️  Start the server first with 'npm run dev'
```

**Solution:** Start the server with `npm run dev`

#### 2. Adapter Connection Errors
```
❌ Test failed (Status: 500, Time: 0.123s)
{
  "success": false,
  "error": "getaddrinfo ENOTFOUND api.example.com",
  "statusCode": 500,
  "adapterName": "example-api"
}
```

**Solution:** This is expected for test adapters with non-existent URLs

#### 3. Authentication Errors
```
❌ Test failed (Status: 401, Time: 0.456s)
{
  "success": false,
  "error": "Request failed with status code 401",
  "statusCode": 401,
  "adapterName": "weather-api"
}
```

**Solution:** Update adapter configuration with valid API keys

## Continuous Integration

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run dev &
      - run: sleep 5
      - run: ./test-api.sh
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x test-api.sh test-postman.sh
   ```

2. **jq Not Found**
   ```bash
   # Install jq (see prerequisites above)
   brew install jq  # macOS
   sudo apt-get install jq  # Ubuntu
   ```

3. **Server Not Found**
   - Ensure the server is running: `npm run dev`
   - Check the correct port in the script
   - Verify no firewall blocking the port

4. **JSON Parsing Errors**
   - Install jq for better JSON formatting
   - Check if the API is returning valid JSON

### Debug Mode

For debugging, you can run individual curl commands:

```bash
# Test server availability
curl -v http://localhost:3000/api/v1/health

# Test with verbose output
curl -v -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{"request": {"method": "GET", "url": "/test"}}'
```

## Performance Testing

The test scripts include response time measurements. For more detailed performance testing:

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/health
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## Contributing

When adding new endpoints:

1. Update the Postman collection
2. Add tests to `test-api.sh`
3. Update this documentation
4. Test with both scripts

## Support

For issues with testing:
1. Check the troubleshooting section
2. Verify server is running
3. Check network connectivity
4. Review server logs 