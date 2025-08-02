const GAS_URL = "https://script.google.com/macros/s/AKfycbza3MwtSu_QCN_ZZKg7BnkBtUL3wTaZmtkRgymRGv-7PQnsd6piwbxmMu_uOZGfvfA/exec";
const ADMIN_PASSWORD = "babanuki123";

let isAdmin = false;
let tableData = {}; // { table1: {x, y, players: []}, ... }

////////////////////////////
// 管理者モード切替
function toggleAdminMode() {
  const passInput = document.getElementById('adminPass');
  const inputPass = passInput.value.trim();

  if (inputPass === ADMIN_PASSWORD) {
    isAdmin = !isAdmin;

    const controls = document.getElementById('adminControls');
    controls.style.display = isAdmin ? 'block' : 'none';

    if (isAdmin) {
      renderTablesAdmin();
      showScreen('adminView');
    } else {
      showScreen('seatView');
      renderTablesView();
    }

    console.log(isAdmin ? '🔓 編集モード ON' : '🔒 編集モード OFF');
  } else {
    alert('❌ パスワードが間違っています');
  }
}
window.toggleAdminMode = toggleAdminMode;

////////////////////////////
// 画面切替関数
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

////////////////////////////
// ドラッグの有効化・無効化
function enableDraggable(enable) {
  document.querySelectorAll("#layoutAreaAdmin .table-box").forEach(el => {
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

  const container = document.getElementById("layoutAreaAdmin");
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

////////////////////////////
// 配置保存
async function saveLayout() {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "save",
        layoutData: Object.values(tableData),
        operator: "admin"
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    if (result.status === "success") {
      alert("配置を保存しました");
      // 保存後は管理者モード画面の再描画など必要ならここで行う
    } else {
      alert("保存に失敗しました: " + (result.error || "不明なエラー"));
    }
  } catch (e) {
    console.error("保存処理でエラー:", e);
    alert("保存に失敗しました");
  }
}

////////////////////////////
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
    // 両方の画面で表示を更新
    renderTablesView();
    if (isAdmin) renderTablesAdmin();

    console.log(`[loadLayout] 座席データ読み込み成功: テーブル数=${data.tables ? data.tables.length : 0}`);
  } catch (e) {
    console.error("[loadLayout] 座席データ読み込み失敗:", e);
  }
}

////////////////////////////
// 閲覧用座席表示描画（編集不可）
function renderTablesView() {
  const container = document.getElementById("layoutAreaView");
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

    if ((info.players || []).length > 0) {
      el.classList.add("occupied");
    }
    container.appendChild(el);
  }
}

////////////////////////////
// 管理者モード用座席表示描画（編集可能）
function renderTablesAdmin() {
  const container = document.getElementById("layoutAreaAdmin");
  container.innerHTML = "";
  for (const id in tableData) {
    const info = tableData[id];
    const el = document.createElement("div");
    el.className = "table-box draggable";
    el.textContent = id.replace("table", "");
    el.style.position = "absolute";
    el.style.left = `${info.x}px`;
    el.style.top = `${info.y}px`;
    el.dataset.id = id;

    if ((info.players || []).length > 0) {
      el.classList.add("occupied");
    }
    container.appendChild(el);
  }
  enableDraggable(true);
}

////////////////////////////
// 自動リロード（管理者モード中は停止）
function autoReloadLayout(intervalMs = 30000) {
  setInterval(async () => {
    if (isAdmin) return;
    try {
      await loadLayout();
      console.log("自動リロードで座席データ更新");
    } catch (e) {
      console.error("自動リロードでエラー:", e);
    }
  }, intervalMs);
}

////////////////////////////
// サイドバーの開閉制御（既存コード）
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

////////////////////////////
// 初期化
window.onload = async () => {
  setupSidebarToggle();
  await loadLayout();
  autoReloadLayout();

  // 画面切替ボタンのイベントはHTML側で設定済み（例：showSeatViewBtnなど）
};
