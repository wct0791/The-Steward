#!/bin/bash

# Start script for The Steward Web Interface
# Starts both backend API and frontend React app

echo "🚀 Starting The Steward Web Interface..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "web-interface" ]; then
    echo "❌ Please run this script from The Steward root directory"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down web interface..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Install backend dependencies if needed
if [ ! -d "web-interface/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd web-interface/backend
    npm install
    cd ../..
fi

# Install frontend dependencies if needed
if [ ! -d "web-interface/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd web-interface/frontend
    npm install
    cd ../..
fi

# Start backend API
echo "🔧 Starting backend API on port 3002..."
cd web-interface/backend
npm start &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
sleep 3

# Start frontend development server
echo "🌐 Starting frontend on port 3001..."
cd web-interface/frontend
npm start &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ The Steward Web Interface is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:3002"
echo "📊 Health Check: http://localhost:3002/health"
echo ""
echo "ℹ️  Open WebUI remains on port 3000 (no conflicts)"
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait $BACKEND_PID
wait $FRONTEND_PID