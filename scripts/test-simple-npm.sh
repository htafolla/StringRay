#!/bin/bash

# Simple test script for StrRay Framework NPM Installation

set -e

echo "Testing StrRay Framework NPM Installation..."

# Create test directory
TEST_DIR="/tmp/strray-simple-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "Step 1: Initialize npm project"
npm init -y --silent

echo "Step 2: Install strray-ai"
npm install strray-ai --silent

echo "Step 3: Run installation"
npx strray-ai install

echo "Step 4: Run doctor check"
npx strray-ai doctor

echo "✅ ALL TESTS PASSED!"
echo "Package installation working correctly"