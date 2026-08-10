#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f ~/.bash_profile ]; then source ~/.bash_profile; fi
    if [ -f ~/.zshrc ]; then source ~/.zshrc; fi
fi

echo "=================================================="
echo "      AUTO-VIDEO-FACTORY - VIRAL STYLE LEARNER"
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

echo "👉 Dán LINK VIDEO (TikTok, YouTube Shorts, Reels, Douyin...)"
echo "   HOẶC Kéo thả file video (.mp4) vào đây rồi nhấn [ENTER]:"
echo ""

read -p "URL / Đường dẫn video viral: " INPUT_VAL

INPUT_VAL=$(echo "$INPUT_VAL" | sed -e "s/^'//" -e "s/'$//" -e 's/^"//' -e 's/"$//' -e 's/\\ / /g' -e 's/\\//g')

if [ -z "$INPUT_VAL" ]; then
    echo ""
    echo "❌ Lỗi: URL hoặc Đường dẫn video không được để trống!"
    echo ""
    read -n 1 -s -r -p "Nhấn phím bất kỳ để thoát..."
    exit 1
fi

echo ""
echo "🚀 Đang khởi chạy Gemini AI phân tích & học phong cách video mẫu..."
echo "--------------------------------------------------"

node renderer/scripts/learnStyle.js "$INPUT_VAL"

echo ""
echo "=================================================="
echo "                  HOÀN TẤT"
echo "=================================================="
echo ""
read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ để đóng..."
