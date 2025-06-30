#!/bin/bash

# Script to launch the entire fact-checker system

echo "🚀 Starting AI Fact-Checker..."

# Check Python
echo "📍 Checking Python..."
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python3 not found. Please install Python3."
    exit 1
fi

# Check Python dependencies
echo "📦 Checking Python dependencies..."
python3 -c "import requests, bs4" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install requests beautifulsoup4
fi

# Start backend server
echo "🖥️  Starting backend server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
node server.js &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Check backend health
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend API available"
else
    echo "⚠️  Backend API unavailable, check port 3001"
fi

# Go back to root directory
cd ..

# Start frontend
echo "🌐 Starting frontend..."

# Compile Tailwind CSS
if [ -f "index.css" ]; then
    echo "🎨 Compiling Tailwind CSS..."
    npx tailwindcss -i ./index.css -o ./dist/output.css --minify
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 System started!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "To stop, press Ctrl+C"

# Function to stop all processes
cleanup() {
    echo ""
    echo "🛑 Stopping system..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ System stopped"
    exit 0
}

# Trap interrupt signal
trap cleanup SIGINT

# Wait
wait
