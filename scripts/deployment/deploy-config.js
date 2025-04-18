/**
 * Production Deployment Configuration
 * 
 * This script sets up the necessary environment for deploying
 * AgentNexus to production, handling environment variables,
 * API keys, and infrastructure configuration.
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default configuration
const DEFAULT_CONFIG = {
  appName: 'agent-nexus',
  environment: 'production',
  nodeVersion: '18.x',
  pythonVersion: '3.9',
  region: 'us-west-2',
  dbType: 'none', // 'none', 'postgres', 'redis', 'dynamodb'
  defaultModelProvider: 'anthropic',
  useLocalModels: false,
  enableAgno: true,
  enforceHttps: true,
  logLevel: 'info'
};

// Load configuration from command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      config[key] = value;
      i++;
    }
  }
  
  return config;
}

// Create production environment file
function createEnvFile(config) {
  console.log('Creating production environment file...');
  
  // Start with sample file
  let envContent = fs.readFileSync(path.resolve(process.cwd(), 'sample.env.local'), 'utf8');
  
  // Replace default values with production config
  envContent = envContent.replace(/DEFAULT_MODEL_PROVIDER=.*/, 
    `DEFAULT_MODEL_PROVIDER=${config.defaultModelProvider}`);
  
  // Add production-specific variables
  envContent += `\n# Production Configuration\n`;
  envContent += `NODE_ENV=production\n`;
  envContent += `LOG_LEVEL=${config.logLevel}\n`;
  envContent += `ENFORCE_HTTPS=${config.enforceHttps}\n`;
  
  if (config.enableAgno) {
    envContent += `ENABLE_AGNO=true\n`;
    envContent += `AGNO_PYTHON_PATH=${config.pythonVersion === '3.9' ? 'python3.9' : 'python3'}\n`;
  } else {
    envContent += `ENABLE_AGNO=false\n`;
  }
  
  // Configure database if specified
  if (config.dbType !== 'none') {
    envContent += `\n# Database Configuration\n`;
    envContent += `DB_TYPE=${config.dbType}\n`;
    
    if (config.dbType === 'postgres') {
      envContent += `DATABASE_URL=postgresql://username:password@localhost:5432/agentnexus\n`;
    } else if (config.dbType === 'redis') {
      envContent += `REDIS_URL=redis://localhost:6379\n`;
    } else if (config.dbType === 'dynamodb') {
      envContent += `DYNAMODB_TABLE=${config.appName}-memory\n`;
      envContent += `AWS_REGION=${config.region}\n`;
    }
  }
  
  // Enable local models if specified
  if (config.useLocalModels) {
    envContent = envContent.replace(/ENABLE_OLLAMA=.*/, `ENABLE_OLLAMA=true`);
  }
  
  // Write to .env.production
  fs.writeFileSync(path.resolve(process.cwd(), '.env.production'), envContent);
  console.log('Created .env.production file');
}

// Create Docker configuration
function createDockerConfig(config) {
  console.log('Creating Docker configuration...');
  
  // Create Dockerfile
  const dockerfile = `
FROM node:${config.nodeVersion} as base

# Install Python ${config.pythonVersion} if needed
${config.enableAgno ? `
RUN apt-get update && apt-get install -y python${config.pythonVersion} python${config.pythonVersion}-venv python3-pip
` : ''}

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set up Python environment if needed
${config.enableAgno ? `
RUN python${config.pythonVersion} -m venv venv
RUN . venv/bin/activate && pip install -r requirements.txt
` : ''}

# Create production image
FROM node:${config.nodeVersion}-slim as production

WORKDIR /app

# Install Python runtime if needed
${config.enableAgno ? `
RUN apt-get update && apt-get install -y python${config.pythonVersion}
` : ''}

# Copy built application
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
${config.enableAgno ? `COPY --from=base /app/venv ./venv` : ''}
${config.enableAgno ? `COPY --from=base /app/scripts ./scripts` : ''}

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Copy environment file
COPY .env.production .env.local

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
  `;
  
  fs.writeFileSync(path.resolve(process.cwd(), 'Dockerfile'), dockerfile);
  console.log('Created Dockerfile');
  
  // Create docker-compose.yml
  const dockerCompose = `
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
    ${config.dbType !== 'none' ? 'depends_on:\n      - db' : ''}
    
  ${config.dbType === 'postgres' ? `
  db:
    image: postgres:13
    environment:
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agentnexus
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  ` : ''}
  
  ${config.dbType === 'redis' ? `
  db:
    image: redis:6
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
  ` : ''}
  
  ${config.useLocalModels ? `
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
  ` : ''}

${config.dbType === 'postgres' || config.dbType === 'redis' || config.useLocalModels ? `
volumes:
  ${config.dbType === 'postgres' ? 'postgres_data:' : ''}
  ${config.dbType === 'redis' ? 'redis_data:' : ''}
  ${config.useLocalModels ? 'ollama_data:' : ''}
` : ''}
  `;
  
  fs.writeFileSync(path.resolve(process.cwd(), 'docker-compose.yml'), dockerCompose);
  console.log('Created docker-compose.yml');
}

// Create NGINX configuration for production
function createNginxConfig(config) {
  console.log('Creating NGINX configuration...');
  
  const nginxConfig = `
server {
    listen 80;
    server_name ${config.domain || '_'};
    
    ${config.enforceHttps ? `
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }` : `
    # Serve the Next.js application
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }`}
}

${config.enforceHttps ? `
server {
    listen 443 ssl;
    server_name ${config.domain || '_'};
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Serve the Next.js application
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}` : ''}
  `;
  
  // Create nginx directory if it doesn't exist
  const nginxDir = path.resolve(process.cwd(), 'nginx');
  if (!fs.existsSync(nginxDir)) {
    fs.mkdirSync(nginxDir);
  }
  
  fs.writeFileSync(path.resolve(nginxDir, 'default.conf'), nginxConfig);
  console.log('Created NGINX configuration');
}

// Create deployment script
function createDeployScript(config) {
  console.log('Creating deployment script...');
  
  const deployScript = `#!/bin/bash
  
# Deploy Agent Nexus to production
set -e

echo "Deploying Agent Nexus to production..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "Error: .env.production file not found!"
  echo "Run the deploy-config.js script first."
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed!"
  exit 1
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

echo "Agent Nexus deployed successfully!"
echo "The application is now running at http://localhost:3000"
${config.enforceHttps ? 'echo "Note: HTTPS is enforced, make sure to set up SSL certificates"' : ''}
  `;
  
  fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'deploy.sh'), deployScript);
  fs.chmodSync(path.resolve(process.cwd(), 'scripts', 'deploy.sh'), '755');
  console.log('Created deployment script');
}

// Add package.json scripts
function updatePackageJson(config) {
  console.log('Updating package.json...');
  
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add deployment scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'deploy:config': 'node scripts/deployment/deploy-config.js',
    'deploy:start': 'bash scripts/deploy.sh',
    'deploy:stop': 'docker-compose down',
    'deploy:logs': 'docker-compose logs -f',
    'deploy:clean': 'docker-compose down -v'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json');
}

// Create requirements.txt for Python dependencies
function createPythonRequirements(config) {
  if (!config.enableAgno) {
    return;
  }
  
  console.log('Creating Python requirements file...');
  
  const requirements = `
# Agent Nexus Python Dependencies
agno>=0.1.0
fastapi>=0.95.0
uvicorn>=0.22.0
pydantic>=2.0.0
langchain>=0.0.267
numpy>=1.24.0
requests>=2.28.0
python-dotenv>=1.0.0
  `.trim();
  
  fs.writeFileSync(path.resolve(process.cwd(), 'requirements.txt'), requirements);
  console.log('Created requirements.txt');
}

// Main function
function main() {
  console.log('Setting up production deployment configuration...');
  
  // Parse command line arguments
  const config = parseArgs();
  console.log('Configuration:', config);
  
  // Create scripts/deployment directory if it doesn't exist
  const deploymentDir = path.resolve(process.cwd(), 'scripts', 'deployment');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  // Save this script to scripts/deployment
  fs.copyFileSync(
    path.resolve(__filename),
    path.resolve(deploymentDir, 'deploy-config.js')
  );
  
  // Create production environment file
  createEnvFile(config);
  
  // Create Docker configuration
  createDockerConfig(config);
  
  // Create NGINX configuration
  createNginxConfig(config);
  
  // Create deployment script
  createDeployScript(config);
  
  // Update package.json
  updatePackageJson(config);
  
  // Create Python requirements file
  createPythonRequirements(config);
  
  console.log('\nProduction deployment configuration complete!');
  console.log('To deploy:');
  console.log('1. Configure your API keys in .env.production');
  console.log('2. Run: npm run deploy:start');
}

// Run the main function
main();
