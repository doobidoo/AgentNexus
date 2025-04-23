#!/bin/bash

# Kill any existing Next.js servers
pkill -f next-server

# Navigate to project directory
cd "$(dirname "$0")"

# Run the development server
npm run dev