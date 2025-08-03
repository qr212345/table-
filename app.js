const ADMIN_PASSWORD = "babanuki123";
let isAdmin = false;

const layoutArea = document.getElementById("layoutArea");
const layoutAreaAdmin = document.getElementById("layoutAreaAdmin");

let layoutData = JSON.parse(localStorage.getItem("layoutData")) || [];

// 初期座席生成
function createInitialTables() {
  for (let i = 1; i <= 7; i++) {
    const id = `table${i}`;
    const el = createElement("table", 60 * i, 60, 0, id);
    layoutAreaAdmin.appendChild(el);
  }
}

function createElement(type, x, y, rotation = 0, id = null) {
  const el = document.createElement("div");
  el.classList.add("table-box", type);
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.transform = `rotate(${rotation}deg)`;
  el.dataset.type = type;
  el.dataset.x = x;
  el.dataset.y = y;
  el.dataset.rotation = rotation;
  el.dataset.id = id || `${type}_${Date.now()}`;
  el.dataset.mode = "move"; // 初期状態は移動モード

  // GAS連携の人の有無に応じて occupied クラスを設定
  if (type === "table") {
    fetchOccupiedStatus(el.dataset.id).then(isOccupied => {
      if (isOccupied) el.classList.add("occupied");
    });
  }

  if (isAdmin) el.classList.add("draggable");

  el.addEventListener("mousedown", dragStart);

  // 管理者の編集モード時のクリック：回転または削除
  el.addEventListener("click", (e) => {
    if (!isAdmin) return;

    if (el.dataset.mode === "rotate") {
      const rot = (parseInt(el.dataset.rotation) + 90) % 360;
      el.dataset.rotation = rot;
      el.style.transform = `rotate(${rot}deg)`;
      el.dataset.mode = "resize";
    } else if (el.dataset.mode === "resize") {
      const isVertical = el.classList.toggle("vertical");
      el.style.width = isVertical ? "30px" : "60px";
      el.style.height = isVertical ? "60px" : "30px";
      el.dataset.mode = "move";
    } else if (el.dataset.type !== "table") {
      // 移動状態でない pillar/door/screen は削除可能
      layoutAreaAdmin.removeChild(el);
    }
  });

  return el;
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbza3MwtSu_QCN_ZZKg7BnkBtUL3wTaZmtkRgymRGv-7PQnsd6piwbxmMu_uOZGfvfA/exec"; // あなたのGASのURLに置き換えてください

async function fetchOccupiedStatus(seatId) {
  try {
    const response = await fetch(`${GAS_URL}?seatId=${encodeURIComponent(seatId)}`);
    const data = await response.json();
    return data.occupied === true;
  } catch (error) {
    console.error("座席状況の取得エラー:", error);
    return false; // エラー時は空席として扱う
  }
}

function dragStart(e) {
  if (!isAdmin) return;
  const el = e.currentTarget;

  el.dataset.mode = "rotate"; // ドラッグ後は回転へ

  let shiftX = e.clientX - el.getBoundingClientRect().left;
  let shiftY = e.clientY - el.getBoundingClientRect().top;

  function moveAt(pageX, pageY) {
    el.style.left = pageX - shiftX + "px";
    el.style.top = pageY - shiftY + "px";
    el.dataset.x = parseInt(pageX - shiftX);
    el.dataset.y = parseInt(pageY - shiftY);
  }

  function onMouseMove(e) {
    moveAt(e.pageX, e.pageY);
  }

  document.addEventListener("mousemove", onMouseMove);

  el.onmouseup = () => {
    document.removeEventListener("mousemove", onMouseMove);
    el.onmouseup = null;
  };
}

function renderLayout(area, data, editable = false) {
  area.innerHTML = "";
  data.forEach(item => {
    const el = createElement(item.type, item.x, item.y, item.rotation, item.id);
    if (!editable) {
      el.classList.remove("draggable");
      el.style.cursor = "default";
    }
    area.appendChild(el);
  });
}

function saveLayout() {
  const boxes = Array.from(layoutAreaAdmin.children);
  const data = boxes.map(el => ({
    id: el.dataset.id,
    type: el.dataset.type,
    x: parseInt(el.dataset.x),
    y: parseInt(el.dataset.y),
    rotation: parseInt(el.dataset.rotation)
  }));
  layoutData = data;
  localStorage.setItem("layoutData", JSON.stringify(data));
  alert("保存しました！");
  renderLayout(layoutArea, layoutData, false);
}

function toggleAdminMode() {
  const input = document.getElementById("adminPass").value;
  if (input === ADMIN_PASSWORD) {
    isAdmin = !isAdmin;
    document.getElementById("adminControls").style.display = isAdmin ? "block" : "none";
    alert(isAdmin ? "管理者モード ON" : "管理者モード OFF");
    if (isAdmin) {
      renderLayout(layoutAreaAdmin, layoutData, true);
    }
  } else {
    alert("パスワードが違います");
  }
}

// モード切替
document.getElementById("showLayoutBtn").onclick = () => {
  document.getElementById("layoutView").style.display = "block";
  document.getElementById("layoutAdmin").style.display = "none";
  document.getElementById("logArea").style.display = "none";
  renderLayout(layoutArea, layoutData, false);
};

document.getElementById("showAdminBtn").onclick = () => {
  document.getElementById("layoutView").style.display = "none";
  document.getElementById("layoutAdmin").style.display = "block";
  document.getElementById("logArea").style.display = "none";
  renderLayout(layoutAreaAdmin, layoutData, true);
};

document.getElementById("showLogBtn").onclick = () => {
  document.getElementById("layoutView").style.display = "none";
  document.getElementById("layoutAdmin").style.display = "none";
  document.getElementById("logArea").style.display = "block";
};

document.getElementById("adminToggleBtn").onclick = toggleAdminMode;
document.getElementById("saveBtn").onclick = saveLayout;

// パレットから table は除外（追加不可）
function setupPalette() {
  const types = ["pillar", "door", "screen"];
  const palette = document.createElement("div");
  palette.style.margin = "1em 0";

  types.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = `${type}`;
    btn.onclick = () => {
      const newEl = createElement(type, 50, 50);
      layoutAreaAdmin.appendChild(newEl);
    };
    palette.appendChild(btn);
  });

  document.getElementById("adminControls").appendChild(palette);
}

setupPalette();

// サイドバー開閉
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggleBtn");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-hidden");
  });
});

// 初期化
createInitialTables();
renderLayout(layoutArea, layoutData, false);
