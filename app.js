const GAS_URL = "https://script.google.com/macros/s/AKfycbx_GbN4Uhr34gUpIuE20KgA8DkvQH6m-pGk9SoUBBEYqVIxau1ybt81-zUai2xUOvs/exec";
const ADMIN_PASSWORD = "secret123";
let isAdmin = false;
let tableData = {}; // { table1: {x, y, players: []}, ... }

// 管理者モード切替
function toggleAdminMode() {
  const input = document.getElementById("adminPass").value;
  if (input === ADMIN_PASSWORD) {
    isAdmin = !isAdmin;
    document.getElementById("saveBtn").style.display = isAdmin ? "inline" : "none";
    document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";
    enableDraggable(isAdmin);
  } else {
    alert("パスワードが違います");
  }
}

// ドラッグ有効化・無効化
function enableDraggable(enable) {
  document.querySelectorAll(".table-box").forEach(el => {
    el.draggable = enable;
    if (enable) {
      el.classList.add("draggable");
      el.addEventListener("dragstart", dragStart);
      el.addEventListener("dragend", dragEnd);
    } else {
      el.classList.remove("draggable");
      el.removeEventListener("dragstart", dragStart);
      el.removeEventListener("dragend", dragEnd);
    }
  });
}

let offsetX, offsetY;
function dragStart(e) {
  const rect = e.target.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
}
function dragEnd(e) {
  const el = e.target;
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  const id = el.dataset.id;
  if (tableData[id]) {
    tableData[id].x = x;
    tableData[id].y = y;
  }
}

// 配置保存
async function saveLayout() {
  try {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "save", layoutData: tableData, operator: "admin" })
    });
    alert("配置を保存しました");
  } catch {
    alert("保存に失敗しました");
  }
}

// レイアウト読み込み
async function loadLayout() {
  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    // GAS側が { tables: [...], ... } 形式なら変換する
    // ここはGASレスポンスに合わせて調整してください
    // 例：配列→オブジェクト形式に変換
    tableData = {};
    if (data.tables) {
      data.tables.forEach(t => {
        tableData[t.tableID] = { x: t.x, y: t.y, players: t.playerIds };
      });
    }
    renderTables();
  } catch (e) {
    console.error("座席データ読み込み失敗:", e);
  }
}

// テーブル描画
function renderTables() {
  const container = document.getElementById("layoutArea");
  container.innerHTML = "";
  for (const id in tableData) {
    const info = tableData[id];
    const el = document.createElement("div");
    el.className = "table-box";
    el.textContent = id.replace("table", "");
    el.style.left = `${info.x}px`;
    el.style.top = `${info.y}px`;
    el.dataset.id = id;
    if ((info.players || []).length > 0) el.classList.add("occupied");
    container.appendChild(el);
  }
  enableDraggable(isAdmin);
}

// ログ表示読み込み（適宜作成してください）
async function loadLog() {
  try {
    const res = await fetch(GAS_URL + "?mode=logs"); // 例URL
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const logViewer = document.getElementById("logViewer");
    logViewer.innerHTML = data.logs.map(log => `<div>${log.date} - ${log.operator} - ${log.action}</div>`).join("");
  } catch (e) {
    console.error("ログ読み込み失敗:", e);
  }
}

// 自動リロード（管理者モード中は停止）
function autoReloadLayout(intervalMs = 30000) {
  setInterval(() => {
    if (isAdmin) return;
    console.log("⏳ 自動読み込み...");
    loadLayout();
  }, intervalMs);
}

// 画面切替イベント登録
function setupScreenToggle() {
  document.getElementById("showLayoutBtn").addEventListener("click", () => {
    document.getElementById("layoutArea").style.display = "block";
    document.getElementById("logArea").style.display = "none";
  });
  document.getElementById("showLogBtn").addEventListener("click", () => {
    document.getElementById("layoutArea").style.display = "none";
    document.getElementById("logArea").style.display = "block";
    loadLog();
  });
}

// 初期処理
window.onload = () => {
  setupScreenToggle();
  loadLayout();
  autoReloadLayout();

  // 初期表示は座席管理画面
  document.getElementById("layoutArea").style.display = "block";
  document.getElementById("logArea").style.display = "none";
};
