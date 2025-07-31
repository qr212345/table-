const GAS_URL = "https://script.google.com/macros/s/AKfycbx_GbN4Uhr34gUpIuE20KgA8DkvQH6m-pGk9SoUBBEYqVIxau1ybt81-zUai2xUOvs/exec";
const ADMIN_PASSWORD = "secret123";
let isAdmin = false;
let tableData = {}; // { table1: { x, y, players: [] }, ... }

// 管理者モード切り替え
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

// ドラッグ機能
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

// レイアウト保存
async function saveLayout() {
  const payload = {
    mode: "save",
    layoutData: Object.entries(tableData).map(([tableID, info]) => ({
      tableID,
      x: info.x,
      y: info.y,
      playerIds: info.players || []
    })),
    operator: "admin"
  };

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    alert("配置を保存しました");
  } catch (e) {
    alert("保存失敗：" + e);
  }
}

// レイアウト読み込み
async function loadLayout() {
  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    tableData = {};
    data.tables.forEach(row => {
      tableData[row.tableID] = {
        x: row.x,
        y: row.y,
        players: row.playerIds || []
      };
    });
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

// 自動更新
function autoReloadLayout(intervalMs = 30000) {
  setInterval(() => {
    if (!isAdmin) loadLayout();
  }, intervalMs);
}

// テーブル追加
async function addTable() {
  const tableID = prompt("追加するテーブルIDを入力（例: table5）:");
  const x = parseInt(prompt("X座標（px）:"), 10);
  const y = parseInt(prompt("Y座標（px）:"), 10);
  if (!tableID || isNaN(x) || isNaN(y)) return;

  const payload = {
    mode: "addTable",
    tableID,
    x,
    y,
    operator: "admin"
  };

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (result.status === "added") {
    tableData[tableID] = { x, y, players: [] };
    renderTables();
  } else {
    alert("既に存在するかエラー");
  }
}

// テーブル削除
async function deleteTable() {
  const tableID = prompt("削除するテーブルID（例: table3）:");
  if (!tableID) return;

  const payload = {
    mode: "deleteTable",
    tableID,
    operator: "admin"
  };

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (result.status === "deleted") {
    delete tableData[tableID];
    renderTables();
  } else {
    alert("見つかりませんでした");
  }
}

// プレイヤー更新
async function updatePlayers() {
  const tableID = prompt("更新するテーブルID:");
  const players = prompt("プレイヤーID（カンマ区切り）:");
  if (!tableID || !players) return;

  const payload = {
    mode: "updatePlayers",
    tableID,
    players: players.split(',').map(s => s.trim()),
    operator: "admin"
  };

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (result.status === "updated") {
    tableData[tableID].players = players.split(',').map(s => s.trim());
    renderTables();
  } else {
    alert("更新失敗");
  }
}

// 初期読み込み
window.onload = () => {
  loadLayout();
  autoReloadLayout();
};
