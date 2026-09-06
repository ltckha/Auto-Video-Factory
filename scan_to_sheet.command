#!/bin/bash
cd "$(dirname "$0")"

echo "=================================================="
echo "   AUTO-VIDEO-FACTORY - QUÉT THƯ MỤC VÀO SHEET"
echo "=================================================="
echo ""
echo "👉 Kéo thả thư mục chứa video (.mp4, .mov...) vào đây,"
echo "   sau đó nhấn [ENTER] để hệ thống quét và lọc trùng:"
echo ""

read -r -p "Đường dẫn thư mục: " RAW_FOLDER

if [ -z "$RAW_FOLDER" ]; then
    echo ""
    echo "❌ Lỗi: Đường dẫn không được để trống!"
    echo ""
    read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ..."
    exit 1
fi

echo ""
echo "🚀 Đang tiến hành quét và đồng bộ lên Google Sheets..."
echo "--------------------------------------------------"

node renderer/scripts/folderScanner.js "$RAW_FOLDER"
SCAN_STATUS=$?

echo ""
echo "=================================================="
if [ $SCAN_STATUS -eq 0 ]; then
    echo "                  HOÀN TẤT"
    echo "💡 Các video mới đã sẵn sàng trong hàng đợi (Status trống)."
    echo "   Bạn có thể mở 'generate.command' để bắt đầu chạy!"
else
    echo "               ĐÃ XẢY RA LỖI"
fi
echo "=================================================="
echo ""
read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ để đóng..."
exit $SCAN_STATUS
