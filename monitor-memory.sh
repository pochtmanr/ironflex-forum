#!/bin/bash

# Memory Monitoring Script
# Run this to continuously monitor your server's memory usage

echo "🔍 Memory Monitoring - Press Ctrl+C to stop"
echo "================================================"
echo ""

while true; do
    clear
    echo "🖥️  System Memory Usage"
    echo "================================================"
    free -h
    echo ""
    
    echo "📊 Docker Container Memory Usage"
    echo "================================================"
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"
    echo ""
    
    echo "⚠️  Memory Warnings:"
    # Check if any container is using more than 90% of its limit
    docker stats --no-stream --format "{{.Container}}: {{.MemPerc}}" | while read line; do
        container=$(echo $line | cut -d: -f1)
        percent=$(echo $line | cut -d: -f2 | tr -d '% ')
        if [ "$percent" != "" ] && [ $(echo "$percent > 90" | bc -l 2>/dev/null || echo 0) -eq 1 ]; then
            echo "  ⚠️  $container is using $percent% of its memory limit!"
        fi
    done
    
    echo ""
    echo "🔄 Refreshing in 5 seconds... (Ctrl+C to stop)"
    sleep 5
done

