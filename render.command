#!/bin/bash
cd "$(dirname "$0")"

echo "========================="
echo "   AUTO-VIDEO-FACTORY"
echo "========================="
echo ""

node renderer/scripts/render.js

echo ""
echo "========================="
echo " DONE"
echo "========================="
echo ""

read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ để đóng..."
