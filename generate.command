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

VIDEO_BATCH_COUNT=0
MAX_BATCH_VIDEOS=3
RAW_INPUT=""

while true; do
    # Nếu đang trong vòng lặp auto (đã xong video trước) thì bỏ qua prompt, tự lấy job tiếp theo
    if [ -z "$RAW_INPUT" ] && [ $VIDEO_BATCH_COUNT -gt 0 ]; then
        echo ""
        echo "=================================================="
        echo "🔄 [TIẾN TRÌNH HÀNG ĐỢI: VIDEO $((VIDEO_BATCH_COUNT + 1))/$MAX_BATCH_VIDEOS]"
        echo "=================================================="
    else
        echo "👉 Kéo thả 1 file video (.mp4) để phân tích ngay,"
        echo "👉 HOẶC nhấn [ENTER] (để trống) để TỰ ĐỘNG LẤY VIDEO CÓ STATUS TRỐNG từ Google Sheets,"
        echo "👉 HOẶC nhập 'scan' để quét thư mục video nạp vào Sheet:"
        echo ""
        read -r -p "Đường dẫn đầu vào: " RAW_INPUT
    fi

    # 1. Chế độ quét thư mục
    if [ "$RAW_INPUT" = "scan" ] || [ "$RAW_INPUT" = "SCAN" ]; then
        echo ""
        read -r -p "👉 Kéo thả thư mục chứa video vào đây: " SCAN_DIR
        if [ -n "$SCAN_DIR" ]; then
            node renderer/scripts/folderScanner.js "$SCAN_DIR"
            echo ""
            echo "💡 Đã quét xong! Nhấn Enter để bắt đầu chạy video từ Hàng đợi."
        fi
        RAW_INPUT=""
        continue
    fi

    # 2. Chế độ lấy từ hàng đợi Google Sheets (Status trống)
    if [ -z "$RAW_INPUT" ]; then
        echo ""
        echo "📋 Đang kiểm tra Hàng đợi trên Google Sheets (Tab Auto-Video-Factory)..."
        NEXT_JOB_JSON=$(node renderer/scripts/getNextEmptyJob.js 2>/dev/null)
        EXIT_CODE=$?

        if [ $EXIT_CODE -ne 0 ] || [ -z "$NEXT_JOB_JSON" ]; then
            echo "ℹ️ Không tìm thấy video nào có Status trống trong tab Auto-Video-Factory."
            echo "💡 Bạn có thể dùng 'scan' hoặc mở scan.command để nạp thêm video vào Sheet."
            echo ""
            read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ để đóng..."
            exit 0
        fi

        JOB_ID=$(node -e "console.log(JSON.parse(process.argv[1]).jobId)" "$NEXT_JOB_JSON")
        INPUT_FILE=$(node -e "console.log(JSON.parse(process.argv[1]).inputFile)" "$NEXT_JOB_JSON")

        echo "🎯 Tìm thấy video từ Hàng đợi Sheet: $JOB_ID"
        echo "📁 File video: $INPUT_FILE"

        if [ ! -f "$INPUT_FILE" ]; then
            echo "❌ Lỗi: File video không tồn tại trên đĩa: $INPUT_FILE"
            node -e "require('./renderer/scripts/googleSheetsSync').updateProjectStatus('$JOB_ID', '❌ File Not Found')" 2>/dev/null
            RAW_INPUT=""
            continue
        fi

        RAW_INPUT="$INPUT_FILE"
    fi

    # 3. Nếu người dùng kéo thả cả thư mục vào ô input
    CLEANED_INPUT=$(node -e "console.log(require('./renderer/scripts/folderScanner').cleanPath(process.argv[1]))" "$RAW_INPUT" 2>/dev/null)
    if [ -d "$CLEANED_INPUT" ]; then
        echo ""
        echo "📁 Bạn đã nhập một THƯ MỤC: $CLEANED_INPUT"
        echo "   [1] Quét & nạp tất cả video mới vào Sheet Auto-Video-Factory (Mặc định sau 10s)"
        echo "   [2] Ghép các clip trong thư mục thành 1 video duy nhất (Multi-Clip Concat)"
        read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1]: " DIR_CHOICE
        if [ "$DIR_CHOICE" = "2" ]; then
            RAW_INPUT="$CLEANED_INPUT"
        else
            node renderer/scripts/folderScanner.js "$CLEANED_INPUT"
            echo ""
            echo "💡 Đã quét thư mục vào Sheet. Nhấn Enter để bắt đầu chạy video từ Hàng đợi!"
            RAW_INPUT=""
            continue
        fi
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
            read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: " MODE_CHOICE
            if [ "$MODE_CHOICE" = "2" ]; then
                MODE_FLAG="--mode=long2short"
                echo "👉 Đã chọn Chế độ: LONG2SHORT"
            else
                MODE_FLAG="--mode=short2short"
                echo "👉 Đã chọn Chế độ: SHORT2SHORT (Mặc định)"
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
            read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: " MODE_CHOICE
            if [ "$MODE_CHOICE" = "2" ]; then
                MODE_FLAG="--mode=long_highlight_clusters"
                echo "👉 Đã chọn Chế độ MỚI: LONG HIGHLIGHT CLUSTERS (BATCH SHORTS)"
            else
                MODE_FLAG="--mode=long2short"
                echo "👉 Đã chọn Chế độ: LONG2SHORT (Mặc định)"
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
        read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 2 (tự động sau 10s)]: " MODE_CHOICE
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

    if [ $GEN_STATUS -ne 0 ]; then
        echo ""
        echo "❌ Quá trình tạo timeline không thành công."
        read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s hoặc nhấn phím bất kỳ..."
        exit $GEN_STATUS
    fi

    echo ""
    echo "=================================================="
    echo "⚡ BẠN CÓ MUỐN TIẾN HÀNH RENDER DỰ ÁN NGAY KHÔNG?"
    echo "   [1] Remotion Hybrid Mới (Mặc định - Tự động chọn sau 10s, có Fallback an toàn)"
    echo "   [2] FFmpeg Legacy Cũ   (Dựng video theo engine cũ)"
    echo "   [3] Thoát và để render sau"
    echo "=================================================="
    echo ""
    read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: " RENDER_CHOICE

    if [ "$RENDER_CHOICE" = "3" ]; then
        echo ""
        echo "💡 Đã lưu kịch bản. Bạn có thể mở render.command để dựng video bất cứ lúc nào."
        exit 0
    elif [ "$RENDER_CHOICE" = "2" ]; then
        echo ""
        echo "🚀 Đang tiến hành Render qua FFmpeg Legacy Cũ..."
        echo "--------------------------------------------------"
        RENDER_ENGINE=legacy node renderer-remotion/scripts/render_orchestrator.js
    else
        echo ""
        echo "🚀 Đang tiến hành Render qua Remotion Hybrid Mới (Có Fallback an toàn)..."
        echo "--------------------------------------------------"
        RENDER_ENGINE=hybrid node renderer-remotion/scripts/render_orchestrator.js
    fi

    # Đếm số lượng video đã render trong đợt này
    VIDEO_BATCH_COUNT=$((VIDEO_BATCH_COUNT + 1))

    # Nếu đã đạt giới hạn 3 video liên tiếp
    if [ $VIDEO_BATCH_COUNT -ge $MAX_BATCH_VIDEOS ]; then
        echo ""
        echo "=================================================="
        echo "🎉 ĐÃ HOÀN THÀNH TỐI ĐA 3 VIDEO LIÊN TIẾP TRONG LƯỢT NÀY!"
        echo "=================================================="
        echo ""
        read -t 10 -n 1 -s -r -p "Tự động đóng sau 10s không làm gì hoặc nhấn phím bất kỳ để thoát..."
        exit 0
    fi

    # Nếu chưa đủ 3 video: Luôn hỏi làm video tiếp theo (chờ 10s tự chạy tiếp)
    echo ""
    echo "=================================================="
    echo "⚡ BẠN CÓ MUỐN LÀM VIDEO TIẾP THEO TỪ HÀNG ĐỢI KHÔNG? ($VIDEO_BATCH_COUNT/$MAX_BATCH_VIDEOS)"
    echo "   [1] Tiếp tục làm video tiếp theo (Mặc định - Tự động chạy sau 10s)"
    echo "   [2] Dừng lại và thoát"
    echo "=================================================="
    echo ""
    read -t 10 -p "Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: " NEXT_CHOICE

    if [ "$NEXT_CHOICE" = "2" ] || [ "$NEXT_CHOICE" = "q" ] || [ "$NEXT_CHOICE" = "Q" ]; then
        echo ""
        echo "👋 Đã dừng tiến trình. Tạm biệt!"
        exit 0
    fi

    echo ""
    echo "🚀 Đang tự động chuyển sang video tiếp theo trong Hàng đợi Sheet..."
    RAW_INPUT=""
done

