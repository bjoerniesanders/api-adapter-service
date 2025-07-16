#!/bin/bash

# Docker Build Script for API Adapter Service
# Usage: ./scripts/docker-build.sh [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="api-adapter-service"
TAG="latest"
BUILD_TARGET="production"
NO_CACHE=false
PUSH=false
REGISTRY=""

# Functions
print_usage() {
    echo -e "${BLUE}Docker Build Script for API Adapter Service${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME        Image Name (default: api-adapter-service)"
    echo "  -t, --tag TAG          Image Tag (default: latest)"
    echo "  -b, --build-target     Build Target: base, build, production (default: production)"
    echo "  --no-cache             Docker Build without cache"
    echo "  -p, --push             Push image after build"
    echo "  -r, --registry REG     Registry URL for push"
    echo "  -h, --help             Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Standard Production Build"
    echo "  $0 -t v1.0.0                          # With specific tag"
    echo "  $0 -b build --no-cache                # Build Stage without cache"
    echo "  $0 -p -r registry.example.com         # Build and push"
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

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or no permission"
        exit 1
    fi
}

check_dockerfile() {
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found in current directory"
        exit 1
    fi
}

build_image() {
    local build_args=""
    
    if [ "$NO_CACHE" = true ]; then
        build_args="--no-cache"
    fi
    
    log_info "Building Docker Image: ${IMAGE_NAME}:${TAG}"
    log_info "Build Target: ${BUILD_TARGET}"
    
    if [ "$NO_CACHE" = true ]; then
        log_info "Cache will be ignored"
    fi
    
    docker build \
        --target "$BUILD_TARGET" \
        -t "${IMAGE_NAME}:${TAG}" \
        $build_args \
        .
    
    if [ $? -eq 0 ]; then
        log_success "Docker Image built successfully: ${IMAGE_NAME}:${TAG}"
    else
        log_error "Docker Build failed"
        exit 1
    fi
}

push_image() {
    if [ -z "$REGISTRY" ]; then
        log_error "Registry URL must be specified for push (-r/--registry)"
        exit 1
    fi
    
    local full_image_name="${REGISTRY}/${IMAGE_NAME}:${TAG}"
    
    log_info "Tagging image for registry: ${full_image_name}"
    docker tag "${IMAGE_NAME}:${TAG}" "${full_image_name}"
    
    log_info "Pushing image to registry: ${full_image_name}"
    docker push "${full_image_name}"
    
    if [ $? -eq 0 ]; then
        log_success "Image pushed successfully: ${full_image_name}"
    else
        log_error "Push failed"
        exit 1
    fi
}

run_tests() {
    log_info "Running container tests..."
    
    # Start container in background
    local container_name="test-${IMAGE_NAME}-${TAG}"
    
    docker run -d \
        --name "$container_name" \
        -p 4000:4000 \
        "${IMAGE_NAME}:${TAG}"
    
    # Wait for container start
    sleep 5
    
    # Health Check
    if curl -f http://localhost:4000/api/v1/health/live &> /dev/null; then
        log_success "Health Check successful"
    else
        log_error "Health Check failed"
        docker logs "$container_name"
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
        exit 1
    fi
    
    # Stop and remove container
    docker stop "$container_name"
    docker rm "$container_name"
    
    log_success "Container tests successful"
}

show_image_info() {
    log_info "Image Information:"
    echo "  Name: ${IMAGE_NAME}:${TAG}"
    echo "  Size: $(docker images ${IMAGE_NAME}:${TAG} --format "table {{.Size}}" | tail -n 1)"
    echo "  Created: $(docker images ${IMAGE_NAME}:${TAG} --format "table {{.CreatedAt}}" | tail -n 1)"
    
    if [ "$BUILD_TARGET" = "production" ]; then
        echo "  Type: Production"
    elif [ "$BUILD_TARGET" = "build" ]; then
        echo "  Type: Build Stage"
    else
        echo "  Type: Development"
    fi
}

# Argument Parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -b|--build-target)
            BUILD_TARGET="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -r|--registry)
            REGISTRY="$2"
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
    log_info "Starting Docker Build Process..."
    
    # Check prerequisites
    check_docker
    check_dockerfile
    
    # Execute build
    build_image
    
    # Show image information
    show_image_info
    
    # Run tests (only for production)
    if [ "$BUILD_TARGET" = "production" ]; then
        run_tests
    fi
    
    # Execute push
    if [ "$PUSH" = true ]; then
        push_image
    fi
    
    log_success "Docker Build Process completed!"
}

# Execute script
main "$@" 