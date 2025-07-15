# Caching Documentation

## Overview

The API Adapter Service includes a comprehensive caching system that significantly improves performance by storing frequently requested data in memory. This reduces the need to make repeated calls to external APIs and provides faster response times.

## Features

- **In-Memory Caching**: Fast access to cached responses
- **Configurable TTL**: Time-to-live settings for cache entries
- **Cache Statistics**: Monitor cache performance and hit rates
- **Selective Caching**: Only cache GET requests with successful responses
- **Cache Invalidation**: Multiple methods to clear or invalidate cache
- **Memory Management**: Automatic eviction when cache is full

## Configuration

### Environment Variables

```bash
# Enable/disable caching (default: true)
CACHE_ENABLED=true

# Cache TTL in milliseconds (default: 300000 = 5 minutes)
CACHE_TTL=300000

# Maximum number of cached items (default: 1000)
CACHE_MAX_SIZE=1000
```

### Default Settings

```typescript
{
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,      // Maximum 1000 cached items
  strategy: 'memory'
}
```

## How It Works

### Cache Key Generation

Cache keys are generated deterministically from request parameters:

```typescript
const cacheKey = `${adapterName}|${method.toUpperCase()}|${url}|${JSON.stringify(params)}|${JSON.stringify(body)}`;
```

This ensures that:
- Identical requests always hit the same cache entry
- Different parameters create different cache entries
- Cache keys are consistent across server restarts

### Caching Strategy

1. **GET Requests Only**: Only successful GET requests are cached
2. **Success Status Codes**: Only responses with status codes 200-206 are cached
3. **Automatic TTL**: Cached entries expire after the configured TTL
4. **Memory Management**: Oldest entries are evicted when cache is full

### Cache Flow

```
Request → Check Cache → Cache Hit? → Return Cached Response
                ↓
            Cache Miss
                ↓
        Make External API Call
                ↓
        Success? → Cache Response → Return Response
                ↓
            Error → Return Error Response
```

## API Endpoints

### Get Cache Statistics

```http
GET /api/v1/cache/stats
```

**Response:**
```json
{
  "hits": 42,
  "misses": 15,
  "hitRate": 73.68,
  "size": 8,
  "maxSize": 1000,
  "enabled": true
}
```

### Clear All Cache

```http
DELETE /api/v1/cache/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Invalidate Adapter Cache

```http
DELETE /api/v1/cache/invalidate/{adapterName}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache invalidated for adapter 'example-api'",
  "adapterName": "example-api",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Invalidate Specific Cache Entry

```http
DELETE /api/v1/cache/invalidate/{adapterName}/entry
Content-Type: application/json

{
  "method": "GET",
  "url": "/users",
  "params": {
    "limit": "10"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache entry invalidated successfully",
  "cacheKey": "example-api|GET|/users|{\"limit\":\"10\"}...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### Basic Caching

```bash
# First request (cache miss)
curl -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "adapterName": "example-api",
    "request": {
      "method": "GET",
      "url": "/users"
    }
  }'

# Second request (cache hit - much faster)
curl -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "adapterName": "example-api",
    "request": {
      "method": "GET",
      "url": "/users"
    }
  }'
```

### Check Cache Performance

```bash
# Get cache statistics
curl http://localhost:3000/api/v1/cache/stats | jq

# Expected output:
{
  "hits": 1,
  "misses": 1,
  "hitRate": 50,
  "size": 1,
  "maxSize": 1000,
  "enabled": true
}
```

### Cache Management

```bash
# Clear all cache
curl -X DELETE http://localhost:3000/api/v1/cache/clear

# Invalidate cache for specific adapter
curl -X DELETE http://localhost:3000/api/v1/cache/invalidate/example-api

# Invalidate specific cache entry
curl -X DELETE http://localhost:3000/api/v1/cache/invalidate/example-api/entry \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "url": "/users"
  }'
```

## Testing

Use the provided test script to verify cache functionality:

```bash
./test-cache.sh
```

This script will:
1. Test initial cache statistics
2. Make requests to verify caching behavior
3. Test cache invalidation methods
4. Show performance improvements

## Performance Benefits

### Before Caching
- Every request hits the external API
- Response times depend on external API performance
- Higher bandwidth usage
- More load on external services

### After Caching
- Repeated requests served from cache (sub-millisecond response times)
- Reduced external API calls
- Lower bandwidth usage
- Better user experience

### Typical Performance Improvements

| Metric | Before Caching | After Caching | Improvement |
|--------|----------------|---------------|-------------|
| Response Time | 200-500ms | 1-5ms | 40-100x faster |
| External API Calls | 100% | 20-30% | 70-80% reduction |
| Bandwidth Usage | 100% | 20-30% | 70-80% reduction |

## Best Practices

### 1. Monitor Cache Performance

Regularly check cache statistics to ensure optimal performance:

```bash
curl http://localhost:3000/api/v1/cache/stats
```

**Good indicators:**
- Hit rate > 70%
- Cache size < 80% of max size
- Low miss rate for repeated requests

### 2. Configure Appropriate TTL

Set TTL based on data volatility:

- **Static data**: Longer TTL (30-60 minutes)
- **Semi-dynamic data**: Medium TTL (5-15 minutes)
- **Dynamic data**: Shorter TTL (1-5 minutes)

### 3. Use Cache Invalidation Strategically

- Clear specific entries when data changes
- Use adapter-level invalidation for major updates
- Clear all cache during deployments

### 4. Monitor Memory Usage

The cache uses in-memory storage, so monitor memory consumption:

```bash
# Check memory usage
curl http://localhost:3000/api/v1/health/detailed | jq '.system.memory'
```

## Troubleshooting

### Cache Not Working

1. **Check if caching is enabled:**
   ```bash
   curl http://localhost:3000/api/v1/cache/stats | jq '.enabled'
   ```

2. **Verify TTL settings:**
   ```bash
   echo $CACHE_TTL
   ```

3. **Check server logs for cache messages:**
   ```bash
   # Look for "Cache HIT" or "Cache MISS" messages
   npm run dev
   ```

### High Memory Usage

1. **Reduce cache size:**
   ```bash
   export CACHE_MAX_SIZE=500
   ```

2. **Reduce TTL:**
   ```bash
   export CACHE_TTL=60000  # 1 minute
   ```

3. **Clear cache periodically:**
   ```bash
   # Add to cron job
   0 */5 * * * curl -X DELETE http://localhost:3000/api/v1/cache/clear
   ```

### Low Hit Rate

1. **Check request patterns:**
   - Are requests identical?
   - Are parameters consistent?

2. **Verify cache key generation:**
   - Check server logs for cache key generation
   - Ensure deterministic key creation

3. **Adjust TTL:**
   - Increase TTL for frequently accessed data
   - Decrease TTL for rarely accessed data

## Future Enhancements

### Planned Features

1. **Redis Support**: Distributed caching for multi-instance deployments
2. **Cache Warming**: Pre-populate cache with frequently accessed data
3. **Advanced Eviction Policies**: LRU, LFU, or custom eviction strategies
4. **Cache Compression**: Reduce memory usage for large responses
5. **Cache Analytics**: Detailed performance metrics and insights

### Redis Integration

For production deployments, consider Redis for:
- Multi-instance caching
- Persistence across restarts
- Better memory management
- Cluster support

```typescript
// Future Redis configuration
{
  enabled: true,
  ttl: 300000,
  maxSize: 1000,
  strategy: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'optional-password'
  }
}
```

## Conclusion

The caching system provides significant performance improvements with minimal configuration. By following best practices and monitoring cache performance, you can achieve optimal results for your API Adapter Service.

For more information, see the [main README](../README.md) and [API documentation](../docs/API.md). 