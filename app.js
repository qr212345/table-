const GAS_URL = "https://script.google.com/macros/s/AKfycbwnWq1mjqWjm-il7Y0_8Ozq7uHn-SZNKuOjQyMS2pa8MEm4bv8hhZLafSth8SRZqg4/exec";
const ADMIN_PASSWORD = "babanuki123";

let isAdmin = false;
let tableData = {}; // { table1: {x, y, players: []}, ... }

// 管理者モード切替
function toggleAdminMode() {
  const input = document.getElementById("adminPass").value;
  if (input === ADMIN_PASSWORD) {
    isAdmin = !isAdmin;
    document.getElementById("saveBtn").style.display = isAdmin ? "inline-block" : "none";
    document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";
    enableDraggable(isAdmin);
  } else {
    alert("パスワードが違います");
  }
}

// ドラッグの有効化・無効化
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

  // 座席領域内に収める制限（必要なら調整）
  const container = document.getElementById("layoutArea");
  const maxX = container.clientWidth - el.offsetWidth;
  const maxY = container.clientHeight - el.offsetHeight;
  el.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
  el.style.top = `${Math.min(Math.max(0, y), maxY)}px`;

  const id = el.dataset.id;
  if (tableData[id]) {
    tableData[id].x = parseInt(el.style.left, 10);
    tableData[id].y = parseInt(el.style.top, 10);
  }
}

// 配置保存
async function saveLayout() {
  try {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "save", layoutData: Object.values(tableData), operator: "admin" })
    });
    alert("配置を保存しました");
  } catch (e) {
    console.error(e);
    alert("保存に失敗しました");
  }
}

// レイアウト読み込み
async function loadLayout() {
  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    tableData = {};
    if (data.tables) {
      data.tables.forEach(t => {
        tableData[t.tableID] = { x: t.x, y: t.y, players: t.playerIds || [] };
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
    el.style.position = "absolute";
    el.style.left = `${info.x}px`;
    el.style.top = `${info.y}px`;
    el.dataset.id = id;

    // プレイヤーがいれば赤色に occupied クラス付与、いなければ灰色
    if ((info.players || []).length > 0) {
      el.classList.add("occupied");
    }

    container.appendChild(el);
  }
  enableDraggable(isAdmin);
}

// ログ読み込みは別途作れば呼び出し可能

// サイドバー内の画面切替ボタン制御
function setupScreenToggle() {
  document.getElementById("showLayoutBtn").addEventListener("click", () => {
    document.getElementById("layoutArea").style.display = "block";
    document.getElementById("logArea").style.display = "none";
  });
  document.getElementById("showLogBtn").addEventListener("click", () => {
    document.getElementById("layoutArea").style.display = "none";
    document.getElementById("logArea").style.display = "block";
    // ここでログ読み込み関数呼び出し可
  });
}

// サイドバーの開閉制御
function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggleBtn");
  toggleBtn.addEventListener("click", () => {
    if (sidebar.style.left === "0px" || sidebar.style.left === "") {
      sidebar.style.left = "-250px";
    } else {
      sidebar.style.left = "0px";
    }
  });
}

// 自動リロード（管理者モード中はスキップ）
function autoReloadLayout(intervalMs = 30000) {
  setInterval(() => {
    if (isAdmin) return;
    loadLayout();
  }, intervalMs);
}

window.onload = () => {
  setupScreenToggle();
  setupSidebarToggle();
  loadLayout();
  autoReloadLayout();

  // 初期は座席管理画面表示
  document.getElementById("layoutArea").style.display = "block";
  document.getElementById("logArea").style.display = "none";

  // サイドバー初期位置を左に隠す
  document.getElementById("sidebar").style.left = "-250px";
};
