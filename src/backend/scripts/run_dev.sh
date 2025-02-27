#!/bin/bash
#
# run_dev.sh - Development Server Runner for Interaction Management System
# Version: 1.0.0
#
# This script starts the Flask backend application in development mode.
# It performs the following tasks:
#   1. Checks if the development environment is properly set up
#   2. Activates the Python virtual environment
#   3. Starts the Flask development server with debugging enabled
#
# Usage: ./run_dev.sh
#
# If the environment is not set up, the script will suggest running setup_dev.sh first.

# Exit immediately if a command exits with a non-zero status
set -e

# Global variables
SCRIPT_DIR=$(dirname "$(realpath "$0")")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
VENV_DIR="$ROOT_DIR/venv"
ENV_FILE="$ROOT_DIR/.env"
FLASK_ENV="development"

# Color codes for output formatting
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Check if the development environment is properly set up
check_environment() {
  # Check if virtual environment exists
  if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}ERROR: Virtual environment not found at $VENV_DIR.${NC}"
    echo -e "${YELLOW}Please run setup_dev.sh to set up the development environment.${NC}"
    return 1
  fi

  # Check if .env file exists
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: Environment file not found at $ENV_FILE.${NC}"
    echo -e "${YELLOW}Please run setup_dev.sh to set up the development environment.${NC}"
    return 1
  fi

  echo -e "${GREEN}✓ Development environment is set up.${NC}"
  return 0
}

# Activate the Python virtual environment
activate_virtualenv() {
  echo -e "${GREEN}Activating virtual environment...${NC}"
  source "$VENV_DIR/bin/activate"
  
  if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${RED}ERROR: Failed to activate virtual environment.${NC}"
    return 1
  fi
  
  # Verify we're using the correct Python
  PYTHON_PATH=$(which python)
  if [[ "$PYTHON_PATH" != *"$VENV_DIR"* ]]; then
    echo -e "${RED}ERROR: Virtual environment activation failed. Incorrect Python path: $PYTHON_PATH${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Virtual environment activated.${NC}"
  return 0
}

# Check if required dependencies are installed
check_dependencies() {
  echo -e "${GREEN}Checking dependencies...${NC}"
  
  # Check for Flask (version 2.3.2)
  if ! python -c "import flask" &> /dev/null; then
    echo -e "${RED}ERROR: Flask not found in the virtual environment.${NC}"
    echo -e "${YELLOW}Please run 'pip install -r requirements.txt' to install dependencies.${NC}"
    return 1
  fi
  
  # Check for python-dotenv (version 1.0.0)
  if ! python -c "import dotenv" &> /dev/null; then
    echo -e "${YELLOW}WARNING: python-dotenv not found. Environment variables may not be loaded correctly.${NC}"
    echo -e "${YELLOW}Consider running 'pip install python-dotenv' for better environment variable handling.${NC}"
  fi
  
  echo -e "${GREEN}✓ All required dependencies are installed.${NC}"
  return 0
}

# Start the Flask development server
run_flask() {
  echo -e "${GREEN}Starting Flask development server...${NC}"
  
  # Set Flask environment variables
  export FLASK_APP="src.backend.app:create_app()"
  export FLASK_ENV="development"
  export FLASK_DEBUG=1
  
  # Load environment variables from .env file
  if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Loading environment variables from $ENV_FILE${NC}"
    set -a
    source "$ENV_FILE"
    set +a
  fi
  
  echo -e "${GREEN}Starting server on http://0.0.0.0:5000...${NC}"
  echo -e "${GREEN}Press Ctrl+C to stop the server.${NC}"
  
  # Run the Flask development server
  flask run --host=0.0.0.0 --port=5000 --reload
  
  return $?
}

# Main function that orchestrates the development server startup
main() {
  echo -e "${GREEN}=======================================================${NC}"
  echo -e "${GREEN}  Interaction Management System - Development Server   ${NC}"
  echo -e "${GREEN}=======================================================${NC}"
  
  # Check if development environment is set up
  check_environment
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Would you like to run setup_dev.sh now? (y/n)${NC}"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      echo -e "${GREEN}Running setup_dev.sh...${NC}"
      bash "$SCRIPT_DIR/setup_dev.sh"
      if [ $? -ne 0 ]; then
        echo -e "${RED}Setup failed. Please fix the issues and try again.${NC}"
        exit 1
      fi
    else
      echo -e "${YELLOW}Exiting. Please run setup_dev.sh manually before running this script.${NC}"
      exit 1
    fi
  fi
  
  # Activate virtual environment
  activate_virtualenv
  if [ $? -ne 0 ]; then
    exit 1
  fi
  
  # Check dependencies
  check_dependencies
  if [ $? -ne 0 ]; then
    exit 1
  fi
  
  # Run Flask development server
  run_flask
  exit_code=$?
  
  # Handle exit
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}Flask server exited with code $exit_code${NC}"
    exit $exit_code
  fi
  
  return 0
}

# Handle script interruption gracefully
trap 'echo -e "${YELLOW}Server interrupted. Shutting down...${NC}"; exit 0' INT

# Execute main function
main