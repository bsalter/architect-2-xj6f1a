#!/bin/bash
#
# Script for running backend tests with various configuration options.
# Supports unit tests, integration tests, or all tests with coverage and parallelization.
#
# Dependencies:
# - pytest 7.3.1: Python testing framework used to run the backend tests
# - pytest-cov 4.1.0: Plugin for pytest to generate code coverage reports
# - pytest-xdist 3.3.1: Plugin for pytest to run tests in parallel

# Get script directory and backend directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
BACKEND_DIR=$(dirname "$SCRIPT_DIR")

# Default values
TEST_TYPE="all"
COVERAGE="false"
VERBOSE="false"
PARALLEL="false"
PYTEST_ARGS=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to show usage information
show_usage() {
    echo -e "${GREEN}test.sh${NC} - Run backend tests with various options"
    echo ""
    echo "Usage: test.sh [options] [-- pytest_args]"
    echo ""
    echo "Options:"
    echo "  -u            Run unit tests only"
    echo "  -i            Run integration tests only"
    echo "  -a            Run all tests (default)"
    echo "  -c            Generate coverage report"
    echo "  -v            Verbose output"
    echo "  -p            Run tests in parallel"
    echo "  -h            Show this help message"
    echo ""
    echo "Any arguments after -- will be passed directly to pytest."
    echo ""
    echo "Examples:"
    echo "  test.sh -u                # Run unit tests"
    echo "  test.sh -i -c             # Run integration tests with coverage"
    echo "  test.sh -a -c -v -p       # Run all tests with coverage, verbose output, and parallelization"
    echo "  test.sh -u -- -k test_auth # Run unit tests matching 'test_auth'"
}

# Function to check if required tools are installed
check_requirements() {
    local missing_tools=0

    echo -e "${GREEN}Checking required tools...${NC}"
    
    if ! command -v python >/dev/null 2>&1; then
        echo -e "${RED}Python is not installed or not in PATH${NC}"
        missing_tools=1
    fi
    
    if ! python -c "import pytest" >/dev/null 2>&1; then
        echo -e "${RED}pytest is not installed. Install with: pip install pytest==7.3.1${NC}"
        missing_tools=1
    fi
    
    if [ "$COVERAGE" == "true" ] && ! python -c "import pytest_cov" >/dev/null 2>&1; then
        echo -e "${RED}pytest-cov is not installed. Install with: pip install pytest-cov==4.1.0${NC}"
        missing_tools=1
    fi
    
    if [ "$PARALLEL" == "true" ] && ! python -c "import xdist" >/dev/null 2>&1; then
        echo -e "${RED}pytest-xdist is not installed. Install with: pip install pytest-xdist==3.3.1${NC}"
        missing_tools=1
    fi
    
    if [ $missing_tools -eq 1 ]; then
        echo -e "${RED}Missing required tools. Please install them and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All required tools are installed.${NC}"
}

# Function to parse arguments
parse_args() {
    while getopts "uiacvph" opt; do
        case ${opt} in
            u )
                TEST_TYPE="unit"
                ;;
            i )
                TEST_TYPE="integration"
                ;;
            a )
                TEST_TYPE="all"
                ;;
            c )
                COVERAGE="true"
                ;;
            v )
                VERBOSE="true"
                ;;
            p )
                PARALLEL="true"
                ;;
            h )
                show_usage
                exit 0
                ;;
            \? )
                echo -e "${RED}Invalid option: $OPTARG${NC}" 1>&2
                show_usage
                exit 1
                ;;
        esac
    done
    shift $((OPTIND -1))
    
    # Check if there are any remaining arguments after options
    if [ $# -gt 0 ]; then
        # If the first argument is --, shift it away
        if [ "$1" == "--" ]; then
            shift
        fi
        # All remaining arguments are passed to pytest
        PYTEST_ARGS="$*"
    fi
}

# Function to set up the environment
setup_env() {
    echo -e "${GREEN}Setting up test environment...${NC}"
    
    # Add the project root to PYTHONPATH to ensure imports work correctly
    export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"
    
    # Set up test database URL if not already set
    if [ -z "$TEST_DATABASE_URL" ]; then
        echo -e "${YELLOW}TEST_DATABASE_URL not set, using default: postgresql://postgres:postgres@localhost:5432/interactions_test${NC}"
        export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interactions_test"
    else
        echo -e "Using TEST_DATABASE_URL: $TEST_DATABASE_URL"
    fi
    
    # Set Flask environment to testing
    export FLASK_ENV="testing"
    export FLASK_DEBUG="0"
    
    echo -e "${GREEN}Environment setup complete.${NC}"
}

# Function to run tests
run_tests() {
    local test_path="$1"
    local cmd="python -m pytest"
    
    # Add verbose flag if requested
    if [ "$VERBOSE" == "true" ]; then
        cmd="$cmd -v"
    fi
    
    # Add coverage if requested
    if [ "$COVERAGE" == "true" ]; then
        cmd="$cmd --cov=$BACKEND_DIR --cov-report=term --cov-report=html:$BACKEND_DIR/htmlcov"
    fi
    
    # Add parallel execution if requested
    if [ "$PARALLEL" == "true" ]; then
        cmd="$cmd -n auto"
    fi
    
    # Add any additional pytest arguments (quoted to preserve spaces)
    if [ -n "$PYTEST_ARGS" ]; then
        cmd="$cmd $PYTEST_ARGS"
    fi
    
    # Add the test path
    cmd="$cmd $test_path"
    
    echo -e "${GREEN}Running tests with command:${NC}"
    echo -e "$cmd"
    echo -e "${GREEN}========================================${NC}"
    
    eval $cmd
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}All tests passed!${NC}"
    else
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}Tests failed with exit code $exit_code${NC}"
    fi
    
    if [ "$COVERAGE" == "true" ]; then
        echo -e "${GREEN}Coverage report generated at: $BACKEND_DIR/htmlcov/index.html${NC}"
    fi
    
    return $exit_code
}

# Main function
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Backend Test Runner${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    parse_args "$@"
    check_requirements
    setup_env
    
    # Determine test path based on TEST_TYPE
    case $TEST_TYPE in
        unit)
            echo -e "${GREEN}Running unit tests...${NC}"
            test_path="$BACKEND_DIR/tests/unit"
            ;;
        integration)
            echo -e "${GREEN}Running integration tests...${NC}"
            test_path="$BACKEND_DIR/tests/integration"
            ;;
        all)
            echo -e "${GREEN}Running all tests...${NC}"
            test_path="$BACKEND_DIR/tests"
            ;;
    esac
    
    run_tests "$test_path"
    return $?
}

# Execute main function with all arguments
main "$@"
exit $?