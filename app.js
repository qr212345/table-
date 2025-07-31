const GAS_URL = "https://script.google.com/macros/s/AKfycbzvQs-eSz2v_ndBTKg-S2ZPJhDe7G0GGro7PZfKLpptjDqasHQuznAaWtVKIbbeXvI/exec";
const ADMIN_PASSWORD = "secret123";
let isAdmin = false;
let tableData = {}; // { table1: {x, y, players: []}, ... }

function toggleAdminMode() {
  const input = document.getElementById("adminPass").value;
  if (input === ADMIN_PASSWORD) {
    isAdmin = !isAdmin;
    document.getElementById("saveBtn").style.display = isAdmin ? "inline" : "none";
    enableDraggable(isAdmin);
  } else {
    alert("パスワードが違います");
  }
}

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

async function saveLayout() {
  await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(tableData)
  });
  alert("配置を保存しました");
}

async function loadLayout() {
  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    tableData = data;
    renderTables();
  } catch (e) {
    console.error("座席データ読み込み失敗:", e);
  }
}

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

function autoReloadLayout(intervalMs = 30000) {
  setInterval(() => {
    if (isAdmin) return;  // 管理者モード中は読み込みをスキップ
    console.log("⏳ 自動読み込み...");
    loadLayout();
  }, intervalMs);
}

window.onload = () => {
  loadLayout();           // 初回読み込み
  autoReloadLayout();     // 自動読み込み（30秒ごと）
};
