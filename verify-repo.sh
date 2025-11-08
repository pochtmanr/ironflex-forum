#!/bin/bash

# Verify correct GitHub repository is configured

CORRECT_REPO="https://github.com/pochtmanr/ironflex-forum.git"

echo "🔍 Checking Git Repository Configuration..."
echo ""

# Get current remote
CURRENT_REPO=$(git remote get-url origin 2>/dev/null)

if [ -z "$CURRENT_REPO" ]; then
    echo "❌ No git remote configured!"
    echo ""
    echo "Setting up correct remote..."
    git remote add origin "$CORRECT_REPO"
    echo "✅ Remote configured: $CORRECT_REPO"
elif [ "$CURRENT_REPO" = "$CORRECT_REPO" ]; then
    echo "✅ Correct repository configured!"
    echo "   $CORRECT_REPO"
else
    echo "⚠️  Wrong repository detected!"
    echo "   Current: $CURRENT_REPO"
    echo "   Expected: $CORRECT_REPO"
    echo ""
    read -p "Fix this? (yes/no): " fix
    if [ "$fix" = "yes" ]; then
        git remote set-url origin "$CORRECT_REPO"
        echo "✅ Fixed! Now using: $CORRECT_REPO"
    fi
fi

echo ""
echo "📊 Repository Status:"
git remote -v
echo ""
echo "🌿 Current Branch: $(git branch --show-current)"
echo "📝 Last Commit: $(git log -1 --oneline)"

