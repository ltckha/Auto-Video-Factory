/**
 * Direct Google Sheets API v4 Client for Node.js (Auto-Video-Factory)
 * 100% DYNAMIC HEADER-BASED READ / WRITE ENGINE (Zero fixed-column assumptions).
 * Uses google-auth-library with config/service_account.json.
 */

const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const ROOT = path.resolve(__dirname, "..", "..");
const SA_PATH = path.join(ROOT, "config", "service_account.json");
const SPREADSHEET_ID = "1Xg67qhp1J_Izt7v5uDKRgKjdEZapX9giKJ_ym0OMJN4";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Column name aliases map for resilient fuzzy header matching
const FIELD_ALIASES = {
  job_id: ["job_id", "project_id", "project id", "mã sản phẩm", "sku", "id", "video id"],
  status: ["status", "trạng thái", "manual_status"],
  input_file: ["input_file", "input file", "file gốc", "video gốc", "source_file"],
  title: ["title", "tên video", "tên sản phẩm", "tiêu đề", "video title"],
  raw_caption: ["raw_caption", "caption", "mô tả", "captionhashtags", "caption_hashtags"],
  original_duration: ["original_duration", "original duration", "thời lượng gốc", "độ dài gốc"],
  short_duration: ["short_duration", "short duration", "thời lượng short", "độ dài short"],
  scene_count: ["scene_count", "scene count", "số cảnh", "scenes"],
  hook_score: ["hook_score", "hook score", "opening hook score", "điểm hook"],
  effects_summary: ["effects_summary", "effects summary", "hiệu ứng", "tóm tắt hiệu ứng"],
  video_path: ["video_path", "output_file", "output file", "file video xuất", "đường dẫn video", "final_video"],
  created_at: ["created_at", "created at", "ngày tạo", "thời gian tạo"],
  rendered_at: ["rendered_at", "rendered at", "ngày render", "thời gian render"],
  brand_fb: ["brand_fb", "fanpage facebook", "brand fb"],
  brand_yt: ["brand_yt", "kênh youtube", "brand yt"],
  brand_ig: ["brand_ig", "kênh instagram", "brand ig"],
  brand_tt: ["brand_tt", "kênh tiktok", "brand tt", "tiktok brand"],
  brand_shopee: ["brand_shopee", "brand shopee", "kênh shopee"],
  brand_zalo: ["brand_zalo", "brand zalo", "kênh zalo"],
};

function normalizeName(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[\s_\-]/g, "");
}

function findHeaderIndex(headers, fieldKey) {
  const aliases = FIELD_ALIASES[fieldKey] || [fieldKey];
  const normalizedAliases = aliases.map(normalizeName);

  for (let i = 0; i < headers.length; i++) {
    const normH = normalizeName(headers[i]);
    if (normalizedAliases.includes(normH)) {
      return i;
    }
  }
  return -1;
}

class GoogleSheetsDirectClient {
  constructor() {
    this.auth = null;
    this.client = null;
    this.initAuth();
  }

  initAuth() {
    if (fs.existsSync(SA_PATH)) {
      this.auth = new GoogleAuth({
        keyFile: SA_PATH,
        scopes: SCOPES,
      });
    }
  }

  async getAuthClient() {
    if (!this.auth) this.initAuth();
    if (!this.auth) return null;
    if (!this.client) {
      this.client = await this.auth.getClient();
    }
    return this.client;
  }

  async request(url, options = {}) {
    const client = await this.getAuthClient();
    if (!client) {
      throw new Error("Service Account JSON not found at " + SA_PATH);
    }
    return await client.request({
      url,
      ...options,
    });
  }

  /**
   * Get all values from a range
   */
  async getValues(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    const res = await this.request(url, { method: "GET" });
    return res.data ? res.data.values || [] : [];
  }

  /**
   * Append raw rows
   */
  async appendValues(range, values) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await this.request(url, {
      method: "POST",
      data: { values },
    });
    return res.data;
  }

  /**
   * Update raw rows
   */
  async updateValues(range, values) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await this.request(url, {
      method: "PUT",
      data: { values },
    });
    return res.data;
  }

  /**
   * Clear and write full table
   */
  async overwriteSheet(tabName, headers, rows) {
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(tabName)}:clear`;
    await this.request(clearUrl, { method: "POST" });

    const allValues = [headers, ...rows];
    return await this.updateValues(`${tabName}!A1`, allValues);
  }

  /**
   * Read all rows from tab as an array of objects keyed by Column Header Name
   */
  async readRowsByHeader(tabName) {
    const rawData = await this.getValues(`${tabName}!A:Z`);
    if (!rawData || rawData.length < 2) return [];

    const headers = rawData[0].map((h) => String(h).trim());
    const records = [];

    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !row.some((cell) => String(cell).trim() !== "")) continue;

      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        const headerKey = headers[c];
        if (headerKey) {
          obj[headerKey] = c < row.length ? row[c] : "";
        }
      }
      records.push(obj);
    }
    return records;
  }

  /**
   * Upsert a row by dynamic header mapping
   */
  async upsertRowByHeader(tabName, keyField, keyValue, recordDict) {
    const rawData = await this.getValues(`${tabName}!A:Z`);
    
    // If empty tab, create headers from recordDict keys
    if (!rawData || rawData.length === 0) {
      const headers = Object.keys(recordDict);
      const row = headers.map((k) => recordDict[k] ?? "");
      return await this.appendValues(`${tabName}!A1`, [headers, row]);
    }

    const headers = rawData[0].map((h) => String(h).trim());
    const keyColIndex = findHeaderIndex(headers, keyField);

    if (keyColIndex === -1) {
      throw new Error(`Khóa '${keyField}' không tồn tại trong danh sách Header của Tab '${tabName}'`);
    }

    // Find row index matching keyValue
    let targetRowNumber = -1;
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (row && keyColIndex < row.length && String(row[keyColIndex]).trim() === String(keyValue).trim()) {
        targetRowNumber = r + 1; // 1-indexed for Sheets
        break;
      }
    }

    // Build the row array dynamically mapped to the exact header columns in Row 1
    const rowValues = headers.map((headerName) => {
      // Direct key match
      if (recordDict[headerName] !== undefined) return recordDict[headerName];
      
      // Alias match
      const normH = normalizeName(headerName);
      for (const [fieldKey, val] of Object.entries(recordDict)) {
        const aliases = FIELD_ALIASES[fieldKey] || [fieldKey];
        if (aliases.map(normalizeName).includes(normH)) {
          return val;
        }
      }
      return "";
    });

    if (targetRowNumber > 0) {
      // Update existing row
      return await this.updateValues(`${tabName}!A${targetRowNumber}`, [rowValues]);
    } else {
      // Append new row
      return await this.appendValues(`${tabName}!A1`, [rowValues]);
    }
  }

  /**
   * Convert 0-indexed column number to Sheets column letter (0 -> A, 25 -> Z, 26 -> AA)
   */
  colIndexToLetter(colIndex) {
    let temp = colIndex;
    let letter = "";
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }

  /**
   * Fast update of a single cell for a specific record key
   */
  async updateCellByKey(tabName, keyField, keyValue, targetField, newValue) {
    const rawData = await this.getValues(`${tabName}!A:Z`);
    if (!rawData || rawData.length < 2) return null;

    const headers = rawData[0].map((h) => String(h).trim());
    const keyColIndex = findHeaderIndex(headers, keyField);
    const targetColIndex = findHeaderIndex(headers, targetField);

    if (keyColIndex === -1) {
      throw new Error(`Khóa '${keyField}' không tồn tại trong Header của Tab '${tabName}'`);
    }
    if (targetColIndex === -1) {
      throw new Error(`Cột đích '${targetField}' không tồn tại trong Header của Tab '${tabName}'`);
    }

    let targetRowNumber = -1;
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (row && keyColIndex < row.length && String(row[keyColIndex]).trim() === String(keyValue).trim()) {
        targetRowNumber = r + 1; // 1-indexed for Sheets
        break;
      }
    }

    if (targetRowNumber === -1) {
      console.warn(`[GoogleSheetDirect] Không tìm thấy dòng với ${keyField} = '${keyValue}' để cập nhật ${targetField}.`);
      return null;
    }

    const colLetter = this.colIndexToLetter(targetColIndex);
    const cellRange = `${tabName}!${colLetter}${targetRowNumber}`;
    return await this.updateValues(cellRange, [[newValue]]);
  }
}

module.exports = new GoogleSheetsDirectClient();
module.exports.findHeaderIndex = findHeaderIndex;
module.exports.FIELD_ALIASES = FIELD_ALIASES;
