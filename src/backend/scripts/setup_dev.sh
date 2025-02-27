#!/bin/bash
#
# setup_dev.sh - Development Environment Setup Script for Interaction Management System
# Version: 1.0.0
#
# This script automates the setup of the backend development environment for the
# Interaction Management System. It performs the following tasks:
#   1. Checks for required prerequisites (Python, pip, virtualenv)
#   2. Creates a Python virtual environment
#   3. Installs backend dependencies
#   4. Sets up environment configuration files
#   5. Initializes and seeds the development database
#
# Usage: ./setup_dev.sh [--with-dev-deps]
#   --with-dev-deps: Also install development dependencies

set -e  # Exit immediately if a command exits with a non-zero status

# Global variables
SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$(dirname "$SCRIPT_DIR")")
VENV_DIR="$ROOT_DIR/venv"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"
DEV_DEPS=0

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --with-dev-deps)
      DEV_DEPS=1
      shift
      ;;
    *)
      # Unknown option
      echo "Unknown option: $arg"
      echo "Usage: ./setup_dev.sh [--with-dev-deps]"
      exit 1
      ;;
  esac
done

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a colored message
# Arguments:
#   $1: Color code
#   $2: Message
print_message() {
  echo -e "${1}${2}${NC}"
}

# Print section header
# Arguments:
#   $1: Section title
print_section() {
  echo
  print_message "${BLUE}" "=== $1 ==="
  echo
}

# Check if required tools are installed
check_prerequisites() {
  print_section "Checking Prerequisites"
  
  # Check Python version
  if ! command -v python3 &> /dev/null; then
    print_message "${RED}" "ERROR: Python 3 is not installed or not in PATH."
    print_message "${YELLOW}" "Please install Python 3.11 or later before running this script."
    exit 1
  fi
  
  PYTHON_VERSION=$(python3 --version | awk '{print $2}')
  PYTHON_VERSION_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
  PYTHON_VERSION_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
  
  if [ $PYTHON_VERSION_MAJOR -lt 3 ] || [ $PYTHON_VERSION_MAJOR -eq 3 -a $PYTHON_VERSION_MINOR -lt 11 ]; then
    print_message "${RED}" "ERROR: Python 3.11 or later is required."
    print_message "${YELLOW}" "Current version: $PYTHON_VERSION"
    exit 1
  fi
  
  print_message "${GREEN}" "✓ Python $PYTHON_VERSION is installed."
  
  # Check for pip
  if ! command -v pip3 &> /dev/null; then
    print_message "${RED}" "ERROR: pip3 is not installed or not in PATH."
    print_message "${YELLOW}" "Please install pip3 before running this script."
    exit 1
  fi
  print_message "${GREEN}" "✓ pip is installed."
  
  # Check for virtualenv
  if ! command -v virtualenv &> /dev/null; then
    print_message "${YELLOW}" "virtualenv is not installed. Attempting to install it..."
    pip3 install virtualenv
    
    if ! command -v virtualenv &> /dev/null; then
      print_message "${RED}" "ERROR: Failed to install virtualenv."
      exit 1
    fi
  fi
  print_message "${GREEN}" "✓ virtualenv is installed."
  
  return 0
}

# Creates and activates a Python virtual environment if it doesn't exist
setup_virtualenv() {
  print_section "Setting up Virtual Environment"
  
  if [ -d "$VENV_DIR" ]; then
    print_message "${YELLOW}" "Virtual environment already exists at $VENV_DIR."
    print_message "${YELLOW}" "Skipping virtual environment creation."
  else
    print_message "${GREEN}" "Creating virtual environment at $VENV_DIR..."
    virtualenv -p python3 "$VENV_DIR"
    
    if [ $? -ne 0 ]; then
      print_message "${RED}" "ERROR: Failed to create virtual environment."
      exit 1
    fi
    
    print_message "${GREEN}" "✓ Virtual environment created successfully."
  fi
  
  # Activate the virtual environment for this script
  print_message "${GREEN}" "Activating virtual environment..."
  source "$VENV_DIR/bin/activate"
  
  if [ -z "$VIRTUAL_ENV" ]; then
    print_message "${RED}" "ERROR: Failed to activate virtual environment."
    exit 1
  fi
  
  print_message "${GREEN}" "✓ Virtual environment activated successfully."
  return 0
}

# Installs Python dependencies from requirements.txt
install_dependencies() {
  print_section "Installing Dependencies"
  
  # Ensure we're in the virtual environment
  if [ -z "$VIRTUAL_ENV" ]; then
    print_message "${RED}" "ERROR: Virtual environment is not activated."
    exit 1
  fi
  
  REQUIREMENTS_FILE="$ROOT_DIR/requirements.txt"
  if [ ! -f "$REQUIREMENTS_FILE" ]; then
    print_message "${RED}" "ERROR: Requirements file not found at $REQUIREMENTS_FILE."
    exit 1
  fi
  
  print_message "${GREEN}" "Installing dependencies from $REQUIREMENTS_FILE..."
  pip install -r "$REQUIREMENTS_FILE"
  
  if [ $? -ne 0 ]; then
    print_message "${RED}" "ERROR: Failed to install dependencies."
    exit 1
  fi
  
  # Install development dependencies if requested
  if [ $DEV_DEPS -eq 1 ]; then
    DEV_REQUIREMENTS_FILE="$ROOT_DIR/requirements-dev.txt"
    if [ -f "$DEV_REQUIREMENTS_FILE" ]; then
      print_message "${GREEN}" "Installing development dependencies from $DEV_REQUIREMENTS_FILE..."
      pip install -r "$DEV_REQUIREMENTS_FILE"
      
      if [ $? -ne 0 ]; then
        print_message "${RED}" "ERROR: Failed to install development dependencies."
        exit 1
      fi
    else
      print_message "${YELLOW}" "Development requirements file not found at $DEV_REQUIREMENTS_FILE. Skipping."
    fi
  fi
  
  print_message "${GREEN}" "✓ Dependencies installed successfully."
  return 0
}

# Creates a .env file from .env.example if it doesn't exist
setup_env_file() {
  print_section "Setting up Environment Configuration"
  
  if [ -f "$ENV_FILE" ]; then
    print_message "${YELLOW}" ".env file already exists at $ENV_FILE."
    print_message "${YELLOW}" "Skipping .env file creation."
  else
    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
      print_message "${RED}" "ERROR: Example environment file not found at $ENV_EXAMPLE_FILE."
      exit 1
    fi
    
    print_message "${GREEN}" "Creating .env file from example..."
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    
    if [ $? -ne 0 ]; then
      print_message "${RED}" "ERROR: Failed to create .env file."
      exit 1
    fi
    
    print_message "${GREEN}" "✓ Environment file created successfully."
    print_message "${YELLOW}" "IMPORTANT: Please review and update the values in $ENV_FILE with your specific configuration."
  fi
  
  return 0
}

# Creates and sets up the database
setup_database() {
  print_section "Setting up Database"
  
  # Ensure we're in the virtual environment
  if [ -z "$VIRTUAL_ENV" ]; then
    print_message "${RED}" "ERROR: Virtual environment is not activated."
    exit 1
  fi
  
  # Initialize the database
  DB_INIT_SCRIPT="$ROOT_DIR/src/backend/scripts/create_db.py"
  if [ -f "$DB_INIT_SCRIPT" ]; then
    print_message "${GREEN}" "Initializing database..."
    python "$DB_INIT_SCRIPT"
    
    if [ $? -ne 0 ]; then
      print_message "${RED}" "ERROR: Failed to initialize database."
      exit 1
    fi
    
    print_message "${GREEN}" "✓ Database initialized successfully."
  else
    print_message "${RED}" "ERROR: Database initialization script not found at $DB_INIT_SCRIPT."
    exit 1
  fi
  
  # Apply migrations
  MIGRATIONS_SCRIPT="$ROOT_DIR/src/backend/scripts/apply_migrations.py"
  if [ -f "$MIGRATIONS_SCRIPT" ]; then
    print_message "${GREEN}" "Applying database migrations..."
    python "$MIGRATIONS_SCRIPT"
    
    if [ $? -ne 0 ]; then
      print_message "${RED}" "ERROR: Failed to apply database migrations."
      exit 1
    fi
    
    print_message "${GREEN}" "✓ Database migrations applied successfully."
  else
    print_message "${RED}" "ERROR: Migrations script not found at $MIGRATIONS_SCRIPT."
    exit 1
  fi
  
  # Seed the database with initial data
  SEED_SCRIPT="$ROOT_DIR/src/backend/scripts/seed_data.py"
  if [ -f "$SEED_SCRIPT" ]; then
    print_message "${GREEN}" "Seeding database with initial data..."
    python "$SEED_SCRIPT"
    
    if [ $? -ne 0 ]; then
      print_message "${RED}" "ERROR: Failed to seed database."
      exit 1
    fi
    
    print_message "${GREEN}" "✓ Database seeded successfully."
  else
    print_message "${RED}" "ERROR: Database seed script not found at $SEED_SCRIPT."
    exit 1
  fi
  
  return 0
}

# Main function that orchestrates the setup process
main() {
  print_message "${BLUE}" "======================================================="
  print_message "${BLUE}" "  Interaction Management System - Dev Environment Setup"
  print_message "${BLUE}" "======================================================="
  print_message "${GREEN}" "This script will set up your development environment for the backend."
  
  # Check for prerequisites
  check_prerequisites
  
  # Set up virtual environment
  setup_virtualenv
  
  # Install dependencies
  install_dependencies
  
  # Set up environment file
  setup_env_file
  
  # Set up database
  setup_database
  
  print_section "Setup Complete!"
  print_message "${GREEN}" "Your development environment has been successfully set up."
  print_message "${GREEN}" "To start the development server:"
  print_message "${YELLOW}" "  1. Activate the virtual environment:"
  print_message "${YELLOW}" "     source $VENV_DIR/bin/activate"
  print_message "${YELLOW}" "  2. Start the development server:"
  print_message "${YELLOW}" "     python $ROOT_DIR/src/backend/app.py"
  
  return 0
}

# Execute main function
main