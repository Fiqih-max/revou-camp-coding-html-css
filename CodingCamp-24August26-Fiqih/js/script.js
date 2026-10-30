// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
const pad = (n) => String(n).padStart(2, "0");

// ---------- Theme (Challenge: Light / Dark mode) ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("theme-toggle").textContent = theme === "dark" ? "Light mode" : "Dark mode";
}
let theme = load("theme", "light");
applyTheme(theme);
$("theme-toggle").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  save("theme", theme);
  applyTheme(theme);
});

// ---------- Greeting, time and date (Challenge: Custom name) ----------
let userName = load("userName", "");
$("name-input").value = userName;
$("name-input").addEventListener("input", (e) => {
  userName = e.target.value.trim();
  save("userName", userName);
  updateClock();
});

function updateClock() {
  const now = new Date();
  $("clock").textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
  $("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const h = now.getHours();
  let part = "evening";
  if (h < 12) part = "morning";
  else if (h < 18) part = "afternoon";
  $("greeting").textContent = "Good " + part + (userName ? ", " + userName : "") + ".";
}
updateClock();
setInterval(updateClock, 1000);

// ---------- Focus timer (Challenge: Change Pomodoro time) ----------
let minutes = load("timerMinutes", 25);
let remaining = minutes * 60; // seconds
let endTime = null;
let tick = null;

$("timer-minutes").value = minutes;

function showTimer() {
  $("timer-display").textContent = pad(Math.floor(remaining / 60)) + ":" + pad(remaining % 60);
  document.title = tick ? $("timer-display").textContent + " - Focus" : "Life Dashboard";
}
function stopTimer() {
  clearInterval(tick);
  tick = null;
  showTimer();
}
function startTimer() {
  if (tick || remaining <= 0) return;
  endTime = Date.now() + remaining * 1000;
  tick = setInterval(() => {
    remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    if (remaining === 0) {
      stopTimer();
      alert("Time is up! Take a short break.");
    }
    showTimer();
  }, 250);
  showTimer();
}
function resetTimer() {
  stopTimer();
  remaining = minutes * 60;
  showTimer();
}
$("timer-start").addEventListener("click", startTimer);
$("timer-stop").addEventListener("click", stopTimer);
$("timer-reset").addEventListener("click", resetTimer);
$("timer-minutes").addEventListener("change", (e) => {
  const value = Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 25));
  minutes = value;
  e.target.value = value;
  save("timerMinutes", value);
  resetTimer();
});
showTimer();

// ---------- To-do list ----------
let tasks = load("tasks", []);
const list = $("todo-list");

function renderTasks() {
  list.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.className = "done";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", "Mark done: " + task.text);
    check.addEventListener("change", () => {
      task.done = check.checked;
      save("tasks", tasks);
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = task.text;

    const edit = document.createElement("button");
    edit.className = "btn ghost small";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => startEdit(li, task, text, edit));

    const del = document.createElement("button");
    del.className = "btn ghost small";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      save("tasks", tasks);
      renderTasks();
    });

    li.append(check, text, edit, del);
    list.appendChild(li);
  });
  $("todo-empty").style.display = tasks.length ? "none" : "block";
}

function startEdit(li, task, textEl, editBtn) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = task.text;
  input.maxLength = 120;
  li.replaceChild(input, textEl);
  editBtn.textContent = "Save";
  input.focus();

  const finish = () => {
    const value = input.value.trim();
    if (value) task.text = value;
    save("tasks", tasks);
    renderTasks();
  };
  editBtn.onclick = finish;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish();
    if (e.key === "Escape") renderTasks();
  });
}

$("todo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const value = $("todo-input").value.trim();
  if (!value) return;
  $("todo-msg").textContent = "";
  tasks.push({ id: Date.now(), text: value, done: false });
  save("tasks", tasks);
  $("todo-input").value = "";
  renderTasks();
});
renderTasks();

// ---------- Quick links ----------
let links = load("links", [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "GitHub", url: "https://github.com" },
  { id: 3, name: "YouTube", url: "https://www.youtube.com" },
]);

function renderLinks() {
  const box = $("links-list");
  box.innerHTML = "";
  links.forEach((link) => {
    const chip = document.createElement("div");
    chip.className = "link-chip";

    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.name;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", "Remove " + link.name);
    del.addEventListener("click", () => {
      links = links.filter((l) => l.id !== link.id);
      save("links", links);
      renderLinks();
    });

    chip.append(a, del);
    box.appendChild(chip);
  });
}

$("links-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("link-name").value.trim();
  let url = $("link-url").value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  links.push({ id: Date.now(), name, url });
  save("links", links);
  $("links-form").reset();
  renderLinks();
});
renderLinks();