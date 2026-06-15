#!/bin/bash

echo ""
echo "========================================"
echo "  HU Book Exchange - Quick Start"
echo "========================================"
echo ""

echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Install with: brew install node (Mac) or apt-get install nodejs (Linux)"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

echo "Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL is not installed!"
    echo "Install with: brew install postgresql (Mac) or apt-get install postgresql (Linux)"
    exit 1
fi

echo "✓ PostgreSQL found: $(psql --version)"
echo ""

echo "========================================"
echo "  Installing Backend Dependencies..."
echo "========================================"
cd server
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "  Backend Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Run: npm start (in server folder)"
echo "3. In frontend folder: python -m http.server 3000"
echo "4. Open http://localhost:3000"
echo ""
echo "Demo Account:"
echo "   Email: demo@students.hebron.edu"
echo "   Password: password123"
echo ""
