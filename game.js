const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const feedbackEl = document.getElementById("game-feedback");
const debugEl = document.getElementById("debug");

const gridSize = 20; // 20x20 cells
let tileSize; // computed from canvas pixel size
const controlsEl = document.getElementById("controls");

function resizeCanvas() {
  // Use the rendered CSS size so we respect safe-area and layout.
  const rect = canvas.getBoundingClientRect();
  const displaySize = Math.max(0, Math.floor(rect.width));
  const dpr = window.devicePixelRatio || 1;
  // size backing canvas in device pixels
  canvas.width = Math.floor(displaySize * dpr);
  canvas.height = Math.floor(displaySize * dpr);
  // ensure the canvas CSS width remains the layout width (keep aspect ratio via CSS)
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.width + "px";
  tileSize = canvas.width / gridSize;
  ctx.imageSmoothingEnabled = false;
}

function isMobile() {
  return (
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    /Mobi|Android/i.test(navigator.userAgent)
  );
}

let snake, dir, food, score, running, paused, lastMoveTime, speed, boostActive, prevSpeed, gameOver;

function updatePauseButtonLabel(label) {
  if (pauseBtn) pauseBtn.textContent = label;
  const mobilePauseBtn = document.getElementById("mobile-pause");
  if (mobilePauseBtn) mobilePauseBtn.textContent = label;
}

function updateStartButtonLabel(label) {
  const mobileStart = document.getElementById("mobile-start");
  if (mobileStart) mobileStart.textContent = label;
  if (startBtn) startBtn.textContent = label;
}

function isBoostAvailable(){
  return !!snake && !gameOver && (running || paused);
}

function updateBoostButtonState(){
  const b = document.getElementById('mobile-boost');
  if(!b) return;
  const label = b.querySelector('.boost-label');
  const subtext = b.querySelector('.boost-subtext');
  const available = isBoostAvailable();
  b.setAttribute('aria-pressed', boostActive ? 'true' : 'false');
  b.disabled = !available;
  if(label) label.textContent = 'Q';
  if(subtext) subtext.textContent = 'Boost';
  b.classList.toggle('active', !!boostActive);
  b.classList.toggle('disabled', !available);
}

function toggleBoost(){
  if(!snake) return; // nothing to do if game not initialized
  if(!boostActive){
    prevSpeed = speed;
    speed = speed + 2;
    boostActive = true;
  } else {
    speed = (typeof prevSpeed === 'number') ? prevSpeed : Math.max(1, speed - 2);
    prevSpeed = null;
    boostActive = false;
  }
  updateBoostButtonState();
  updateDebug();
}

function showFeedback(show) {
  if (!feedbackEl) return;
  feedbackEl.classList.toggle("hidden", !show);
  if (show) {
    const title = feedbackEl.querySelector(".feedback-title");
    if (title) title.textContent = "Game Over: Final Score " + score;
  }
}

function updateDebug() {
  if (!debugEl) return;
  const length = snake ? snake.length : 0;
  debugEl.textContent = `Speed: ${speed} Length: ${length}`;
}

function getFoodState(item) {
  const age = Date.now() - item.spawnedAt;
  if (age < 2500) return { points: 3, color: "#FFD700" };
  if (age < 6000) return { points: 2, color: "#FF8C00" };
  return { points: 1, color: "#ff4d4d" };
}

function init() {
  snake = [{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }];
  dir = { x: 0, y: 0 };
  placeFood();
  score = 0;
  running = false;
  paused = false;
  gameOver = false;
  speed = 8; // moves per second
  boostActive = false;
  prevSpeed = null;
  scoreEl.textContent = "Score: 0";
  updatePauseButtonLabel("Pause");
  updateStartButtonLabel("Start");
  updateBoostButtonState();
  showFeedback(false);
  updateDebug();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
      spawnedAt: Date.now(),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

function start(initialDir) {
  // If game is paused, resume. If initialDir is provided while paused, use it.
  if (paused) {
    if (initialDir) dir = initialDir;
    running = true;
    paused = false;
    gameOver = false;
    updatePauseButtonLabel("Pause");
    updateStartButtonLabel("Start");
    updateBoostButtonState();
    showFeedback(false);
    lastMoveTime = 0;
    window.requestAnimationFrame(loop);
    return;
  }

  // fresh start (or after game over)
  init();
  dir = initialDir || { x: 1, y: 0 };
  running = true;
  paused = false;
  gameOver = false;
  lastMoveTime = 0;
  updatePauseButtonLabel("Pause");
  updateStartButtonLabel("Start");
  updateBoostButtonState();
  showFeedback(false);
  window.requestAnimationFrame(loop);
}

function togglePause() {
  if (!snake || gameOver) return;

  if (running) {
    running = false;
    paused = true;
    updatePauseButtonLabel("Resume");
    return;
  }

  if (paused) {
    running = true;
    paused = false;
    gameOver = false;
    updatePauseButtonLabel("Pause");
    lastMoveTime = 0;
    window.requestAnimationFrame(loop);
    return;
  }

  start();
}

function loop(timestamp) {
  if (!running) return;
  if (!lastMoveTime) lastMoveTime = timestamp;
  const interval = 1000 / speed;
  if (timestamp - lastMoveTime > interval) {
    update();
    lastMoveTime = timestamp;
  }
  draw();
  window.requestAnimationFrame(loop);
}

function update() {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  // wrap around edges
  if (head.x < 0) head.x = gridSize - 1;
  if (head.x >= gridSize) head.x = 0;
  if (head.y < 0) head.y = gridSize - 1;
  if (head.y >= gridSize) head.y = 0;

  // collision with self
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    running = false;
    paused = false;
    gameOver = true;
    // reset any active boost so the button returns to its default color
    if (boostActive) {
      boostActive = false;
      if (typeof prevSpeed === 'number') {
        speed = prevSpeed;
      }
      prevSpeed = null;
    }
    updateBoostButtonState();
    updatePauseButtonLabel("Pause");
    updateStartButtonLabel("New Game");
    showFeedback(true);
    updateDebug();
    return;
  }

  snake.unshift(head);

  // eating food
  if (head.x === food.x && head.y === food.y) {
    const foodState = getFoodState(food);
    score += foodState.points;
    scoreEl.textContent = "Score: " + score;
    placeFood();
    if (score % 5 === 0) speed += 1; // gradually speed up
  } else {
    snake.pop();
  }
  // update debug HUD (length and speed)
  updateDebug();
}

function draw() {
  // clear
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle grid
  ctx.fillStyle = "#0a0a0a";
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      ctx.fillRect(x * tileSize, y * tileSize, tileSize - 1, tileSize - 1);
    }
  }

  // snake
  snake.forEach((s, i) => {
    // entire snake becomes light blue while boost is active
    ctx.fillStyle = boostActive ? "#8ad8ff" : (i === 0 ? "#7CFC00" : "#32CD32");
    ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 1, tileSize - 1);
  });

  // food
  const foodState = getFoodState(food);
  ctx.fillStyle = foodState.color;
  ctx.fillRect(
    food.x * tileSize,
    food.y * tileSize,
    tileSize - 1,
    tileSize - 1,
  );
}

// controls
window.addEventListener("keydown", (e) => {
  const key = e.key;

  // Prevent accidental restart or resume during game-over feedback
  if (gameOver && !running && !paused) {
    if (key === " " || key === "Spacebar" || e.code === "Space") {
      e.preventDefault();
      return;
    }
    if (key && key.toLowerCase && key.toLowerCase() === "q") {
      e.preventDefault();
      return;
    }

    const isDirectionKey =
      key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight" ||
      key === "w" || key === "a" || key === "s" || key === "d" ||
      key === "W" || key === "A" || key === "S" || key === "D";
    if (isDirectionKey) {
      e.preventDefault();
      return;
    }
  }

  // Space toggles pause/resume
  if (key === " " || key === "Spacebar" || e.code === "Space") {
    e.preventDefault();
    togglePause();
    return;
  }

  // Q toggles boost
  if (key && key.toLowerCase && key.toLowerCase() === "q") {
    e.preventDefault();
    if (!isBoostAvailable()) return;
    toggleBoost();
    return;
  }

  let nd = null;
  if ((key === "ArrowUp" || key === "w" || key === "W") && dir.y !== 1) nd = { x: 0, y: -1 };
  if ((key === "ArrowDown" || key === "s" || key === "S") && dir.y !== -1) nd = { x: 0, y: 1 };
  if ((key === "ArrowLeft" || key === "a" || key === "A") && dir.x !== 1) nd = { x: -1, y: 0 };
  if ((key === "ArrowRight" || key === "d" || key === "D") && dir.x !== -1)
    nd = { x: 1, y: 0 };
  if (!nd) return;
  // If not running or paused, start/resume with this direction
  if (!running || paused) {
    showFeedback(false);
    start(nd);
    return;
  }
  dir = nd;
});

// setup controls and listeners
if (controlsEl) {
  controlsEl.querySelectorAll("[data-dir]").forEach((btn) => {
    const dirName = btn.getAttribute("data-dir");
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      setDirFromControl(dirName);
    });
    btn.addEventListener("touchstart", (e) => e.preventDefault());
  });
  const mobileStart = document.getElementById("mobile-start");
  if (mobileStart) mobileStart.addEventListener("click", () => start());

  const mobilePause = document.getElementById("mobile-pause");
  if (mobilePause) mobilePause.addEventListener("click", togglePause);

  const mobileBoost = document.getElementById('mobile-boost');
  if(mobileBoost) {
    mobileBoost.addEventListener('click', () => {
      if (!isBoostAvailable()) return;
      toggleBoost();
    });
  }
}

function setDirFromControl(name) {
  if (gameOver) return;

  const mapping = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nd = mapping[name];
  if (!nd) return;
  // prevent reversing directly
  if (nd.x === -dir.x && nd.y === -dir.y && (dir.x !== 0 || dir.y !== 0))
    return;
  // If not running (fresh start or after game over) or paused, start/resume with this direction
  if (!running || paused) {
    // hide feedback if visible and start with initial direction
    showFeedback(false);
    start(nd);
    return;
  }
  dir = nd;
}

if (startBtn) startBtn.addEventListener("click", start);
if (pauseBtn) pauseBtn.addEventListener("click", togglePause);

// initial draw
init();
resizeCanvas();
draw();

// resize handling
window.addEventListener("resize", () => {
  resizeCanvas();
  draw();
});
