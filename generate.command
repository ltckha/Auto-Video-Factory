#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f ~/.bash_profile ]; then source ~/.bash_profile; fi
    if [ -f ~/.zshrc ]; then source ~/.zshrc; fi
fi

echo "=================================================="
echo "       AUTO-VIDEO-FACTORY - AI TIMELINE GENERATOR"
echo "=================================================="
echo ""

if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Không tìm thấy biến môi trường GEMINI_API_KEY."
    read -p "Vui lòng dán GEMINI_API_KEY của bạn vào đây và nhấn Enter: " INPUT_KEY
    echo ""
    if [ -z "$INPUT_KEY" ]; then
        echo "Lỗi: API Key không được để trống!"
        echo ""
        read -n 1 -s -r -p "Nhấn phím bất kỳ để thoát..."
        exit 1
    fi
    export GEMINI_API_KEY="$INPUT_KEY"
fi

echo "👉 Kéo thả 1 file video (.mp4), nhiều file hoặc 1 Thư Mục clips vào đây,"
echo "   sau đó nhấn [ENTER] để bắt đầu:"
echo ""

read -r -p "Đường dẫn đầu vào: " RAW_INPUT

if [ -z "$RAW_INPUT" ]; then
    echo ""
    echo "❌ Lỗi: Đường dẫn không được để trống!"
    echo ""
    read -n 1 -s -r -p "Nhấn phím bất kỳ để thoát..."
    exit 1
fi

echo ""
echo "🔍 Đang đo tổng thời lượng video nguồn..."
RAW_DUR=$(node renderer/scripts/measureDuration.js "$RAW_INPUT")

MODE_FLAG=""

if [ -n "$RAW_DUR" ] && [ "$RAW_DUR" != "0" ]; then
    DUR_FLOAT=$(printf "%.1f" "$RAW_DUR")
    DUR_INT=${DUR_FLOAT%.*}

    if [ "$DUR_INT" -lt 60 ]; then
        MODE_FLAG="--mode=short2short"
        echo "⏱️ Tổng thời lượng: ${DUR_FLOAT}s (< 60s) ➔ Tự động chọn Chế độ [Short2Short]"
    elif [ "$DUR_INT" -ge 60 ] && [ "$DUR_INT" -le 90 ]; then
        echo "⏱️ Tổng thời lượng: ${DUR_FLOAT}s (Vùng 60s - 90s linh hoạt)."
        echo "🎯 Vui lòng chọn Chế độ Xử lý Video:"
        echo "   [1] Short2Short : Tái cấu trúc, đổi voice & hiệu ứng cho Video Ngắn (Mặc định)"
        echo "   [2] Long2Short  : Cắt lọc phân cảnh đắt giá từ Video Dài"
        echo ""
        read -p "Nhập lựa chọn của bạn [Mặc định 1]: " MODE_CHOICE
        if [ "$MODE_CHOICE" = "2" ]; then
            MODE_FLAG="--mode=long2short"
            echo "👉 Đã chọn Chế độ: LONG2SHORT"
        else
            MODE_FLAG="--mode=short2short"
            echo "👉 Đã chọn Chế độ: SHORT2SHORT"
        fi
    elif [ "$DUR_INT" -gt 90 ] && [ "$DUR_INT" -le 180 ]; then
        MODE_FLAG="--mode=long2short"
        echo "⏱️ Tổng thời lượng: ${DUR_FLOAT}s (90s - 3 phút) ➔ Tự động chọn Chế độ [Long2Short]"
    elif [ "$DUR_INT" -gt 180 ] && [ "$DUR_INT" -le 300 ]; then
        echo "⏱️ Tổng thời lượng: ${DUR_FLOAT}s (Vùng 3m - 5m linh hoạt)."
        echo "🎯 Vui lòng chọn Chế độ Xử lý Video:"
        echo "   [1] Long2Short            : Cắt 01 Video Ngắn rút gọn (Mặc định)"
        echo "   [2] LongHighlightClusters : Tự động lọc rác & Xuất Chùm 3-5 Video Ngắn MỚI"
        echo ""
        read -p "Nhập lựa chọn của bạn [Mặc định 1]: " MODE_CHOICE
        if [ "$MODE_CHOICE" = "2" ]; then
            MODE_FLAG="--mode=long_highlight_clusters"
            echo "👉 Đã chọn Chế độ MỚI: LONG HIGHLIGHT CLUSTERS (BATCH SHORTS)"
        else
            MODE_FLAG="--mode=long2short"
            echo "👉 Đã chọn Chế độ: LONG2SHORT"
        fi
    else
        MODE_FLAG="--mode=long_highlight_clusters"
        echo "⏱️ Tổng thời lượng: ${DUR_FLOAT}s (> 5 phút) ➔ Tự động kích hoạt Mode MỚI [LongHighlightClusters (Batch Shorts)]"
    fi
else
    echo "⚠️ Không thể tự động đo thời lượng video. Vui lòng chọn Chế độ xử lý:"
    echo "   [1] Short2Short            : Video ngắn (< 60s)"
    echo "   [2] Long2Short             : Video dài (60s - 5 phút)"
    echo "   [3] LongHighlightClusters  : Video rất dài (> 5m) hoặc Chùm Clips MỚI"
    read -p "Nhập lựa chọn của bạn [Mặc định 2]: " MODE_CHOICE
    if [ "$MODE_CHOICE" = "1" ]; then
        MODE_FLAG="--mode=short2short"
    elif [ "$MODE_CHOICE" = "3" ]; then
        MODE_FLAG="--mode=long_highlight_clusters"
    else
        MODE_FLAG="--mode=long2short"
    fi
fi

echo ""
echo "🚀 Đang khởi chạy Gemini AI phân tích video ($MODE_FLAG)..."
echo "--------------------------------------------------"

node renderer/scripts/generateTimeline.js "$RAW_INPUT" "$MODE_FLAG"
GEN_STATUS=$?

if [ $GEN_STATUS -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "⚡ BẠN CÓ MUỐN TIẾN HÀNH RENDER DỰ ÁN NGAY KHÔNG?"
    echo "   [1] Có   - Tiến hành Render & Gửi ra NAS ngay (Mặc định)"
    echo "   [2] Không - Thoát và để render sau"
    echo "=================================================="
    echo ""
    read -p "Nhập lựa chọn của bạn [Mặc định 1]: " RENDER_CHOICE

    if [ "$RENDER_CHOICE" != "2" ]; then
        echo ""
        echo "🚀 Đang tiến hành Render dự án..."
        echo "--------------------------------------------------"
        node renderer/scripts/render.js
    else
        echo ""
        echo "💡 Đã lưu kịch bản. Bạn có thể mở render.command để dựng video bất cứ lúc nào."
    fi
fi

echo ""
echo "=================================================="
echo "                  HOÀN TẤT"
echo "=================================================="
echo ""
read -n 1 -s -r -p "Nhấn phím bất kỳ để đóng..."
