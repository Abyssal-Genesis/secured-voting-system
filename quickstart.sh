#!/bin/bash

# QUICK START GUIDE - Secured Voting System

echo "========================================"
echo "Secured Voting System - Quick Start"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found${NC}"
        echo "  Install from: https://docs.docker.com/get-docker/"
        return 1
    fi
    echo -e "${GREEN}✓ Docker installed${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}✗ Docker Compose not found${NC}"
        echo "  Install from: https://docs.docker.com/compose/install/"
        return 1
    fi
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        echo "  Install from: https://nodejs.org/"
        return 1
    fi
    echo -e "${GREEN}✓ Node.js installed ($(node --version))${NC}"
    
    return 0
}

# Setup environment
setup_environment() {
    echo ""
    echo -e "${YELLOW}Setting up environment...${NC}"
    
    if [ ! -f "src/backend/.env" ]; then
        cp "src/backend/.env.example" "src/backend/.env"
        echo -e "${GREEN}✓ Created .env from template${NC}"
    else
        echo -e "${GREEN}✓ .env already exists${NC}"
    fi
}

# Start services (Development)
start_dev() {
    echo ""
    echo -e "${YELLOW}Starting development services...${NC}"
    
    docker-compose up -d
    
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    echo "Services are running:"
    echo "  • Backend API: http://localhost:5000/api"
    echo "  • Frontend: http://localhost:3000"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo ""
    echo "View logs with: docker-compose logs -f"
}

# Start services (Production)
start_prod() {
    echo ""
    echo -e "${YELLOW}Starting production services...${NC}"
    
    docker-compose -f docker-compose-prod.yml up -d
    
    echo -e "${GREEN}✓ Production services started${NC}"
    echo ""
    echo "Services are running:"
    echo "  • Frontend: http://localhost"
    echo "  • API: http://localhost/api"
    echo "  • Health: http://localhost/health"
}

# Stop services
stop_services() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

# Run tests
run_tests() {
    echo ""
    echo -e "${YELLOW}Running tests...${NC}"
    
    cd src/backend
    npm test
    cd ../..
    
    echo -e "${GREEN}✓ Tests completed${NC}"
}

# Check integrations
check_integrations() {
    echo ""
    echo -e "${YELLOW}Checking system integrations...${NC}"
    
    node check-integrations.js
}

# Initialize database
init_database() {
    echo ""
    echo -e "${YELLOW}Initializing database...${NC}"
    
    docker-compose exec backend npm run migrate:up
    
    echo -e "${GREEN}✓ Database initialized${NC}"
}

# View logs
view_logs() {
    echo ""
    echo -e "${YELLOW}Showing live logs...${NC}"
    echo "(Press Ctrl+C to stop)"
    echo ""
    
    docker-compose logs -f
}

# Show status
show_status() {
    echo ""
    echo -e "${YELLOW}System Status:${NC}"
    echo ""
    
    docker-compose ps
    
    echo ""
    echo -e "${YELLOW}Service Health:${NC}"
    
    echo -n "  • Backend: "
    curl -s http://localhost:5000/health > /dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    
    echo -n "  • Database: "
    docker-compose exec -T postgres pg_isready > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    
    echo -n "  • Redis: "
    docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    
    echo -n "  • Frontend: "
    curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
}

# Install dependencies
install_deps() {
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    
    cd src/backend
    npm install
    cd ../..
    
    cd src/frontend
    npm install
    cd ../..
    
    cd src/smart_contracts
    npm install
    cd ../..
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Build images
build_images() {
    echo ""
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    docker-compose build
    
    echo -e "${GREEN}✓ Images built${NC}"
}

# Show menu
show_menu() {
    echo ""
    echo "========================================"
    echo "Quick Start Menu"
    echo "========================================"
    echo ""
    echo "1. Check prerequisites"
    echo "2. Setup environment"
    echo "3. Install dependencies"
    echo "4. Build Docker images"
    echo "5. Initialize database"
    echo "6. Start development services"
    echo "7. Start production services"
    echo "8. Check system status"
    echo "9. View logs"
    echo "10. Run tests"
    echo "11. Check integrations"
    echo "12. Stop services"
    echo "13. Exit"
    echo ""
    echo "========================================"
    echo ""
}

# Main menu loop
main_menu() {
    while true; do
        show_menu
        read -p "Select option (1-13): " choice
        
        case $choice in
            1) check_prerequisites ;;
            2) setup_environment ;;
            3) install_deps ;;
            4) build_images ;;
            5) init_database ;;
            6) start_dev ;;
            7) start_prod ;;
            8) show_status ;;
            9) view_logs ;;
            10) run_tests ;;
            11) check_integrations ;;
            12) stop_services ;;
            13) 
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
        
        read -p "Press Enter to continue..."
    done
}

# Quick deployment function
quick_deploy() {
    echo ""
    echo -e "${YELLOW}Quick Deployment Mode${NC}"
    echo ""
    
    check_prerequisites || exit 1
    setup_environment
    build_images
    start_prod
    
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
    echo ""
    echo "Access the application at:"
    echo "  • http://localhost"
    echo ""
    echo "Check health with:"
    echo "  • curl http://localhost/health"
    echo ""
    echo "View logs with:"
    echo "  • docker-compose -f docker-compose-prod.yml logs -f"
}

# Quick development function
quick_develop() {
    echo ""
    echo -e "${YELLOW}Quick Development Setup${NC}"
    echo ""
    
    check_prerequisites || exit 1
    setup_environment
    install_deps
    start_dev
    
    echo ""
    echo -e "${GREEN}✓ Development environment ready!${NC}"
    echo ""
    echo "Access the application at:"
    echo "  • Frontend: http://localhost:3000"
    echo "  • Backend API: http://localhost:5000/api"
    echo ""
    echo "Run tests with:"
    echo "  • cd src/backend && npm test"
    echo ""
    echo "View logs with:"
    echo "  • docker-compose logs -f"
}

# Command line arguments
case "${1:-}" in
    "deploy")
        quick_deploy
        ;;
    "develop")
        quick_develop
        ;;
    "status")
        show_status
        ;;
    "logs")
        view_logs
        ;;
    "test")
        run_tests
        ;;
    "check")
        check_integrations
        ;;
    "start")
        start_dev
        ;;
    "stop")
        stop_services
        ;;
    "help")
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy       - Quick production deployment"
        echo "  develop      - Quick development setup"
        echo "  start        - Start development services"
        echo "  stop         - Stop services"
        echo "  status       - Show system status"
        echo "  logs         - View live logs"
        echo "  test         - Run tests"
        echo "  check        - Check integrations"
        echo "  help         - Show this help message"
        echo ""
        ;;
    *)
        main_menu
        ;;
esac
