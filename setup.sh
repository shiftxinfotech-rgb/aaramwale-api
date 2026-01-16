#!/bin/bash

echo "🚀 AaramWale API - Quick Setup Script"
echo "======================================"
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Get database credentials
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASS
echo ""

read -p "Enter database name (default: aaramwale_db): " DB_NAME
DB_NAME=${DB_NAME:-aaramwale_db}

read -p "Enter database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Creating database..."

# Create database
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -p $DB_PORT -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Database created/verified successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "Updating .env file..."

# Update .env file
cat > .env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
EOF

echo "✅ .env file updated"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the server, run:"
echo "  npm run start:dev"
echo ""
echo "Then visit:"
echo "  http://localhost:3000/api - for API documentation"
echo ""
