#!/bin/bash
# Setup script for Agent Nexus development environment

echo "Setting up Agent Nexus development environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is required but not installed. Please install pip3 and try again."
    exit 1
fi

# Create and activate a Python virtual environment for Agno
echo "Creating a Python virtual environment for Agno..."

# Create the venv directory if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Install Agno in the virtual environment
echo "Installing Agno in the virtual environment..."
./venv/bin/pip install -U agno
echo "Agno installed successfully in the virtual environment."

# Create an activation script
cat > activate-agno.sh << EOL
#!/bin/bash
source venv/bin/activate
echo "Agno virtual environment activated. Run 'deactivate' when done."
EOL

chmod +x activate-agno.sh
echo "Created activation script: activate-agno.sh"


# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm/yarn/pnpm is installed
if command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
elif command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
else
    echo "No package manager found. Please install npm, yarn, or pnpm and try again."
    exit 1
fi

echo "Using package manager: $PACKAGE_MANAGER"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    echo "Git repository initialized."
else
    echo "Git repository already initialized."
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore file..."
    cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# Python
/venv/
__pycache__/
*.py[cod]
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
EOL
    echo ".gitignore file created."
fi

# Install dependencies
echo "Installing dependencies..."
$PACKAGE_MANAGER install

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    echo "OPENAI_API_KEY=" > .env.local
    echo ".env.local file created. Please add your OpenAI API key."
fi

# Check for TypeScript
if [ ! -f "tsconfig.json" ]; then
    echo "TypeScript configuration not found. Creating tsconfig.json..."
    cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL
    echo "tsconfig.json created."
fi

# Make script files executable
chmod +x scripts/task-nexus-bridge.ts
chmod +x scripts/setup.sh

# Add everything to git
git add .

# Initial commit if this is a new repository
if [ -z "$(git log -1 2>/dev/null)" ]; then
    echo "Making initial commit..."
    git commit -m "Initial commit: Agent Nexus framework with Agno integration"
    echo "Initial commit created."
else
    echo "Repository already has commits. Skipping initial commit."
fi

echo "Setup complete! You can now start the development server with: $PACKAGE_MANAGER run dev"
echo "Don't forget to add your OpenAI API key to .env.local"
