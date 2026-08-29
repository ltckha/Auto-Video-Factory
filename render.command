#!/bin/bash
cd "$(dirname "$0")"

echo "========================="
echo "   AUTO-VIDEO-FACTORY"
echo "========================="
echo ""

echo "🎯 Vui lòng chọn Engine Render:"
echo "   [1] Remotion Hybrid Mới (Mặc định - Tự động sau 10s, có Fallback an toàn)"
echo "   [2] FFmpeg Legacy Cũ"
echo ""

read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1]: " RENDER_CHOICE

if [ "$RENDER_CHOICE" = "2" ]; then
    echo "🚀 Đang tiến hành Render qua FFmpeg Legacy Cũ..."
    RENDER_ENGINE=legacy node renderer-remotion/scripts/render_orchestrator.js
else
    echo "🚀 Đang tiến hành Render qua Remotion Hybrid Mới (Có Fallback an toàn)..."
    RENDER_ENGINE=hybrid node renderer-remotion/scripts/render_orchestrator.js
fi

echo ""
echo "========================="
echo " DONE"
echo "========================="
echo ""

read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ để đóng..."
