#!/bin/bash

# Docker Compose Script for API Adapter Service
# Usage: ./scripts/docker-compose.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COMPOSE_FILE="docker-compose.yml"
PROFILE=""
SERVICE=""

# Functions
print_usage() {
    echo -e "${BLUE}Docker Compose Script for API Adapter Service${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  up                    Start services"
    echo "  down                  Stop and remove services"
    echo "  restart               Restart services"
    echo "  logs                  Show logs"
    echo "  ps                    Show service status"
    echo "  build                 Rebuild images"
    echo "  pull                  Pull images"
    echo "  clean                 Remove all containers and images"
    echo "  health                Perform health check"
    echo "  shell                 Open shell in container"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE       Compose File (default: docker-compose.yml)"
    echo "  -p, --profile PROFILE Use profile (dev, prod)"
    echo "  -s, --service SERVICE Use specific service"
    echo "  -d, --detach          Run in background"
    echo "  --no-cache            Build without cache"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 up                 # Start production services"
    echo "  $0 up -p dev          # Start development services"
    echo "  $0 logs -s api-adapter-service"
    echo "  $0 shell -s api-adapter-service"
    echo "  $0 health             # Health check"
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

check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose File not found: $COMPOSE_FILE"
        exit 1
    fi
}

build_compose_args() {
    local args=""
    
    if [ -n "$COMPOSE_FILE" ]; then
        args="$args -f $COMPOSE_FILE"
    fi
    
    if [ -n "$PROFILE" ]; then
        args="$args --profile $PROFILE"
    fi
    
    echo "$args"
}

run_compose() {
    local command="$1"
    local args="$2"
    local compose_args=$(build_compose_args)
    
    log_info "Executing: docker-compose $compose_args $command $args"
    
    docker-compose $compose_args $command $args
    
    if [ $? -eq 0 ]; then
        log_success "Docker Compose $command executed successfully"
    else
        log_error "Docker Compose $command failed"
        exit 1
    fi
}

cmd_up() {
    local args="$1"
    run_compose "up" "$args"
}

cmd_down() {
    local args="$1"
    run_compose "down" "$args"
}

cmd_restart() {
    local args="$1"
    run_compose "restart" "$args"
}

cmd_logs() {
    local args="$1"
    run_compose "logs" "$args"
}

cmd_ps() {
    local args="$1"
    run_compose "ps" "$args"
}

cmd_build() {
    local args="$1"
    run_compose "build" "$args"
}

cmd_pull() {
    local args="$1"
    run_compose "pull" "$args"
}

cmd_clean() {
    log_warning "Removing all containers and images..."
    
    # Stop and remove containers
    docker-compose $(build_compose_args) down -v --remove-orphans 2>/dev/null || true
    
    # Remove images
    docker rmi $(docker images -q api-adapter-service) 2>/dev/null || true
    
    # Remove unused resources
    docker system prune -f
    
    log_success "Cleanup completed"
}

cmd_health() {
    log_info "Performing health check..."
    
    # Check services status
    local status=$(docker-compose $(build_compose_args) ps --format json 2>/dev/null | jq -r '.[].State' 2>/dev/null || echo "unknown")
    
    if [ "$status" = "running" ]; then
        log_success "Services are running"
        
        # Test health check endpoint
        if curl -f http://localhost:4000/api/v1/health/live &> /dev/null; then
            log_success "Health Check endpoint reachable"
        else
            log_warning "Health Check endpoint not reachable"
        fi
    else
        log_error "Services are not running (Status: $status)"
        exit 1
    fi
}

cmd_shell() {
    if [ -z "$SERVICE" ]; then
        log_error "Service must be specified for shell (-s/--service)"
        exit 1
    fi
    
    log_info "Opening shell in service: $SERVICE"
    docker-compose $(build_compose_args) exec "$SERVICE" sh
}

# Argument Parsing
COMMAND=""
DETACH=false
NO_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        up|down|restart|logs|ps|build|pull|clean|health|shell)
            COMMAND="$1"
            shift
            ;;
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -d|--detach)
            DETACH=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
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
    # Check prerequisites
    check_docker_compose
    check_compose_file
    
    # Execute command
    case $COMMAND in
        up)
            local args=""
            [ "$DETACH" = true ] && args="$args -d"
            cmd_up "$args"
            ;;
        down)
            cmd_down ""
            ;;
        restart)
            cmd_restart ""
            ;;
        logs)
            local args=""
            [ -n "$SERVICE" ] && args="$args $SERVICE"
            cmd_logs "$args"
            ;;
        ps)
            cmd_ps ""
            ;;
        build)
            local args=""
            [ "$NO_CACHE" = true ] && args="$args --no-cache"
            [ -n "$SERVICE" ] && args="$args $SERVICE"
            cmd_build "$args"
            ;;
        pull)
            local args=""
            [ -n "$SERVICE" ] && args="$args $SERVICE"
            cmd_pull "$args"
            ;;
        clean)
            cmd_clean
            ;;
        health)
            cmd_health
            ;;
        shell)
            cmd_shell
            ;;
        "")
            log_error "Command must be specified"
            print_usage
            exit 1
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            print_usage
            exit 1
            ;;
    esac
}

# Execute script
main "$@" 