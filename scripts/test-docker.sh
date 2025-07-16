#!/bin/bash

# Docker Test Script for API Adapter Service
# Usage: ./scripts/test-docker.sh [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
CLEANUP=true
TIMEOUT=30

# Functions
print_usage() {
    echo -e "${BLUE}Docker Test Script for API Adapter Service${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --test TYPE        Test type: build, run, compose, all (default: all)"
    echo "  --no-cleanup           Don't cleanup after tests"
    echo "  --timeout SECONDS      Timeout for health checks (default: 30)"
    echo "  -h, --help             Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                     # Run all tests"
    echo "  $0 -t build            # Test only Docker build"
    echo "  $0 -t compose          # Test only Docker Compose"
    echo "  $0 --no-cleanup        # Keep containers after tests"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

test_docker_build() {
    log_info "Testing Docker build..."
    
    # Build image
    docker build -t api-adapter-service:test .
    
    if [ $? -eq 0 ]; then
        log_success "Docker build successful"
    else
        log_error "Docker build failed"
        exit 1
    fi
}

test_docker_run() {
    log_info "Testing Docker run..."
    
    local container_name="test-api-adapter-service"
    
    # Start container
    docker run -d \
        --name "$container_name" \
        -p 4000:4000 \
        --env-file .env \
        api-adapter-service:test
    
    # Wait for container to start
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q "$container_name"; then
        log_success "Container started successfully"
    else
        log_error "Container failed to start"
        docker logs "$container_name"
        exit 1
    fi
    
    # Health check
    log_info "Performing health check..."
    local attempts=0
    local max_attempts=$TIMEOUT
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f http://localhost:4000/api/v1/health/live &> /dev/null; then
            log_success "Health check passed"
            break
        fi
        
        attempts=$((attempts + 1))
        sleep 1
    done
    
    if [ $attempts -eq $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        docker logs "$container_name"
        exit 1
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Test root endpoint
    if curl -s http://localhost:4000/ | grep -q "Welcome"; then
        log_success "Root endpoint working"
    else
        log_warning "Root endpoint test failed"
    fi
    
    # Test health endpoint
    if curl -s http://localhost:4000/api/v1/health | grep -q "status"; then
        log_success "Health endpoint working"
    else
        log_warning "Health endpoint test failed"
    fi
    
    # Test adapters endpoint
    if curl -s http://localhost:4000/api/v1/adapters | grep -q "adapters"; then
        log_success "Adapters endpoint working"
    else
        log_warning "Adapters endpoint test failed"
    fi
    
    # Cleanup
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up container..."
        docker stop "$container_name"
        docker rm "$container_name"
    fi
}

test_docker_compose() {
    log_info "Testing Docker Compose..."
    
    # Start services
    docker-compose up -d
    
    # Wait for services to start
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker Compose services started"
    else
        log_error "Docker Compose services failed to start"
        docker-compose logs
        exit 1
    fi
    
    # Health check
    log_info "Performing health check..."
    local attempts=0
    local max_attempts=$TIMEOUT
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f http://localhost:4000/api/v1/health/live &> /dev/null; then
            log_success "Health check passed"
            break
        fi
        
        attempts=$((attempts + 1))
        sleep 1
    done
    
    if [ $attempts -eq $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        docker-compose logs
        exit 1
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Test root endpoint
    if curl -s http://localhost:4000/ | grep -q "Welcome"; then
        log_success "Root endpoint working"
    else
        log_warning "Root endpoint test failed"
    fi
    
    # Test health endpoint
    if curl -s http://localhost:4000/api/v1/health | grep -q "status"; then
        log_success "Health endpoint working"
    else
        log_warning "Health endpoint test failed"
    fi
    
    # Test adapters endpoint
    if curl -s http://localhost:4000/api/v1/adapters | grep -q "adapters"; then
        log_success "Adapters endpoint working"
    else
        log_warning "Adapters endpoint test failed"
    fi
    
    # Cleanup
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up Docker Compose services..."
        docker-compose down
    fi
}

cleanup() {
    if [ "$CLEANUP" = true ]; then
        log_info "Performing cleanup..."
        
        # Remove test containers
        docker rm -f test-api-adapter-service 2>/dev/null || true
        
        # Remove test images
        docker rmi api-adapter-service:test 2>/dev/null || true
        
        # Stop Docker Compose services
        docker-compose down 2>/dev/null || true
        
        log_success "Cleanup completed"
    fi
}

# Argument parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--test)
            TEST_TYPE="$2"
            shift 2
            ;;
        --no-cleanup)
            CLEANUP=false
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting Docker tests..."
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests based on type
    case $TEST_TYPE in
        build)
            test_docker_build
            ;;
        run)
            test_docker_build
            test_docker_run
            ;;
        compose)
            test_docker_compose
            ;;
        all)
            test_docker_build
            test_docker_run
            test_docker_compose
            ;;
        *)
            log_error "Unknown test type: $TEST_TYPE"
            print_usage
            exit 1
            ;;
    esac
    
    # Cleanup
    cleanup
    
    log_success "All Docker tests completed successfully!"
}

# Execute script
main "$@" 