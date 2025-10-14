#!/bin/bash

# Trust System Quick Start Deployment Script
# Run this to set up the complete trust system

set -e

echo "🚀 Trust System Deployment Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Get database credentials
echo "🔐 Database Configuration"
echo "------------------------"
read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database name (default: sellfast): " DB_NAME
DB_NAME=${DB_NAME:-sellfast}

read -p "Database user (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""
echo ""

# Test database connection
echo "🔌 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Run migration
echo "📊 Running database migration..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f prisma/migrations/trust_system_v1.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
echo ""

# Verify tables
echo "✅ Verifying tables..."
TABLE_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'trust_%'" | tr -d ' ')

if [ "$TABLE_COUNT" -eq "5" ]; then
    echo -e "${GREEN}✅ All 5 trust tables created successfully${NC}"
    echo "   - trust_scores"
    echo "   - trust_events"
    echo "   - trust_rules"
    echo "   - trust_verifications"
    echo "   - trust_milestones"
else
    echo -e "${RED}❌ Expected 5 tables, found $TABLE_COUNT${NC}"
    exit 1
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install @prisma/client lucide-react
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Initialize trust scores for existing users
echo "👥 Initializing trust scores for existing users..."
USER_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users" | tr -d ' ')

if [ "$USER_COUNT" -gt "0" ]; then
    echo "Found $USER_COUNT existing users"
    read -p "Initialize trust scores for all users? (y/n): " INIT_USERS
    
    if [ "$INIT_USERS" = "y" ]; then
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
        DO \$\$
        DECLARE
            user_record RECORD;
        BEGIN
            FOR user_record IN SELECT id FROM users LOOP
                PERFORM initialize_trust_score(user_record.id);
            END LOOP;
        END \$\$;
        "
        echo -e "${GREEN}✅ Trust scores initialized for all users${NC}"
    fi
else
    echo "No existing users found"
fi
echo ""

# Run tests
echo "🧪 Running test suite..."
read -p "Run tests to verify installation? (y/n): " RUN_TESTS

if [ "$RUN_TESTS" = "y" ]; then
    npx ts-node tests/trustSystemTest.ts
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Some tests failed - please review output${NC}"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Trust System Deployment Complete!"
echo "=========================================="
echo ""
echo "📖 Next Steps:"
echo "   1. Review the integration guide: docs/TRUST_SYSTEM_INTEGRATION.md"
echo "   2. Add trust routes to your Express app"
echo "   3. Import and use TrustScoreDisplay component"
echo "   4. Connect trust events to your existing workflows"
echo ""
echo "🔗 API Endpoints Available:"
echo "   GET  /api/trust/:userId"
echo "   GET  /api/trust/:userId/badges"
echo "   GET  /api/trust/leaderboard"
echo "   GET  /api/trust/me (authenticated)"
echo "   POST /api/trust/recalculate (authenticated)"
echo ""
echo "📊 Database Tables:"
echo "   - trust_scores (user scores)"
echo "   - trust_events (score history)"
echo "   - trust_rules (scoring rules)"
echo "   - trust_verifications (verification tracking)"
echo "   - trust_milestones (achievements)"
echo ""
echo "🎯 Start using the trust system by:"
echo "   import { trustScoreService } from './services/trustScoreService';"
echo ""
echo -e "${GREEN}Happy selling! 🚀${NC}"
