#!/bin/bash
# lint.sh - Run linting tools on the backend Python codebase
# 
# This script runs various Python code quality tools:
# - flake8: Style guide enforcement
# - pylint: Code analysis for bugs and quality
# - black: Code formatter
# - isort: Import statement organizer
#
# It can be run in check mode (default) or fix mode (--fix),
# and supports excluding or including test files.

# Exit the script immediately if a command exits with a non-zero status
set -e

# Define script directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Default configuration
INCLUDE_TESTS=false
AUTO_FIX=false
VERBOSE=false

# ANSI color codes for output formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Python modules to lint (default to all backend modules)
PYTHON_MODULES=("src")

# Track overall exit code
EXIT_CODE=0

# Function to display help information
show_help() {
    echo "Usage: $0 [options]"
    echo
    echo "Run linting tools on the backend Python codebase."
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message and exit"
    echo "  -t, --tests         Include test files in linting"
    echo "  -f, --fix           Automatically fix issues where possible"
    echo "  -v, --verbose       Increase output verbosity"
    echo "  -m, --module NAME   Lint specific module (can be used multiple times)"
    echo
    echo "Example:"
    echo "  $0 --fix --verbose  Run linting in verbose mode with auto-fixing"
}

# Function to print a formatted header
print_header() {
    echo "===================================================="
    echo "                ${1^^}"
    echo "===================================================="
}

# Function to run a linter with appropriate settings
run_linter() {
    local linter_name="$1"
    local linter_command="$2"
    local fix_command="$3"
    local result=0

    print_header "$linter_name"
    
    if [ "$AUTO_FIX" = true ] && [ -n "$fix_command" ]; then
        echo "Running $linter_name in fix mode..."
        eval "$fix_command" || result=$?
    else
        if [ "$VERBOSE" = true ]; then
            echo "Running $linter_name in check mode (verbose)..."
            eval "$linter_command" || result=$?
        else
            echo "Running $linter_name in check mode..."
            output=$(eval "$linter_command" 2>&1) || result=$?
        fi
    fi
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓ $linter_name passed${NC}"
    else
        echo -e "${RED}✗ $linter_name failed${NC}"
        if [ "$VERBOSE" = false ] && [ "$AUTO_FIX" = false ] && [ -n "$output" ]; then
            echo "$output"
        fi
        EXIT_CODE=1
    fi
    
    echo
    return $result
}

# Check if required tools are installed
check_dependencies() {
    missing_tools=()
    
    if ! command -v flake8 &> /dev/null; then
        missing_tools+=("flake8")
    fi
    
    if ! command -v pylint &> /dev/null; then
        missing_tools+=("pylint")
    fi
    
    if ! command -v black &> /dev/null; then
        missing_tools+=("black")
    fi
    
    if ! command -v isort &> /dev/null; then
        missing_tools+=("isort")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}Error: Required tools are missing: ${missing_tools[*]}${NC}"
        echo "Please install them using:"
        echo "pip install flake8 pylint black isort"
        exit 1
    fi
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tests)
            INCLUDE_TESTS=true
            shift
            ;;
        -f|--fix)
            AUTO_FIX=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -m|--module)
            if [[ -n "$2" && "$2" != -* ]]; then
                PYTHON_MODULES+=("$2")
                shift 2
            else
                echo "Error: Module name is required after $1 option"
                exit 1
            fi
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verify dependencies before proceeding
check_dependencies

# Build the paths for linting
PATHS=""
for module in "${PYTHON_MODULES[@]}"; do
    if [ -d "$ROOT_DIR/$module" ]; then
        PATHS="$PATHS $ROOT_DIR/$module"
    fi
done

# If no valid paths found, exit
if [ -z "$PATHS" ]; then
    echo "Error: No valid Python modules found to lint"
    exit 1
fi

# Exclude tests if not explicitly included
EXCLUDE_PATTERN=""
if [ "$INCLUDE_TESTS" = false ]; then
    EXCLUDE_PATTERN="--exclude=test_*.py,conftest.py,tests/"
fi

# Print execution summary
echo "Linting Python modules: ${PYTHON_MODULES[*]}"
if [ "$AUTO_FIX" = true ]; then
    echo "Auto-fix mode: enabled"
else
    echo "Auto-fix mode: disabled (check only)"
fi

if [ "$INCLUDE_TESTS" = true ]; then
    echo "Including test files in linting"
else
    echo "Excluding test files from linting"
fi
echo

# Run flake8 (style checker - no auto-fix capability)
FLAKE8_CMD="flake8 $EXCLUDE_PATTERN $PATHS"
run_linter "flake8" "$FLAKE8_CMD" ""

# Run pylint (code analyzer)
PYLINT_CMD="pylint $EXCLUDE_PATTERN $PATHS"
run_linter "pylint" "$PYLINT_CMD" ""

# Run black (code formatter)
BLACK_CHECK_CMD="black --check $EXCLUDE_PATTERN $PATHS"
BLACK_FIX_CMD="black $EXCLUDE_PATTERN $PATHS"
run_linter "black" "$BLACK_CHECK_CMD" "$BLACK_FIX_CMD"

# Run isort (import sorter)
ISORT_CHECK_CMD="isort --check-only $EXCLUDE_PATTERN $PATHS"
ISORT_FIX_CMD="isort $EXCLUDE_PATTERN $PATHS"
run_linter "isort" "$ISORT_CHECK_CMD" "$ISORT_FIX_CMD"

# Summary
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All linting checks passed!${NC}"
else
    echo -e "${RED}Some linting checks failed!${NC}"
    echo "Run with --fix option to automatically fix some issues."
fi

exit $EXIT_CODE