const ADMIN_PASSWORD = "babanuki123";
let isAdmin = false;

const layoutArea = document.getElementById("layoutArea");
const layoutAreaAdmin = document.getElementById("layoutAreaAdmin");

let layoutData = JSON.parse(localStorage.getItem("layoutData")) || [];

function createElement(type, x, y, rotation = 0, id = null) {
  const el = document.createElement("div");
  el.classList.add("table-box", type, "draggable");
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.transform = `rotate(${rotation}deg)`;
  el.dataset.type = type;
  el.dataset.x = x;
  el.dataset.y = y;
  el.dataset.rotation = rotation;
  el.dataset.id = id || `${type}_${Date.now()}`;

  if (type === "table" && Math.random() > 0.5) {
    el.classList.add("occupied");
  }

  el.addEventListener("mousedown", dragStart);
  el.addEventListener("click", e => {
    if (isAdmin) {
      const rot = (parseInt(el.dataset.rotation) + 90) % 360;
      el.dataset.rotation = rot;
      el.style.transform = `rotate(${rot}deg)`;
    }
  });

  return el;
}

function dragStart(e) {
  if (!isAdmin) return;
  const el = e.currentTarget;
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
  } else {
    alert("パスワードが違います");
  }
}

// モード切替ボタン
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

function setupPalette() {
  const types = ["table", "pillar", "door", "screen"];
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
renderLayout(layoutArea, layoutData, false);
