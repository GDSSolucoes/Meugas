#!/bin/bash

# Entity Generator Script for Unix/Linux/Mac
# Auto-discovers entities from backend and generates missing ones

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Entity Generator Script (Unix/Linux/Mac)"
  echo ""
  echo "Usage:"
  echo "  ./generate-entities.sh              # Show entity generation status"
  echo "  ./generate-entities.sh --status     # Show detailed status"
  echo "  ./generate-entities.sh --generate   # Auto-generate all missing entities"
  echo "  ./generate-entities.sh <Entity>     # Generate specific entity"
  echo "  ./generate-entities.sh --help       # Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./generate-entities.sh                  (check what's missing)"
  echo "  ./generate-entities.sh --generate       (generate all missing)"
  echo "  ./generate-entities.sh Product          (generate just Product)"
  echo ""
  exit 0
fi

# If specific actions requested
if [ "$1" == "--status" ]; then
  node "$(dirname "$0")/discover-and-generate.js" --status
  exit $?
elif [ "$1" == "--generate" ]; then
  node "$(dirname "$0")/discover-and-generate.js" --generate
  exit $?
elif [ -n "$1" ]; then
  # Generate specific entity
  node "$(dirname "$0")/generate-entity.js" "$1"
  exit $?
fi

# Default: Show status
node "$(dirname "$0")/discover-and-generate.js" --status
exit $?