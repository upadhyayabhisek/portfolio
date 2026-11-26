(() => {
  "use strict";

  // Load game stylesheet
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "css/easter-egg.css";
  document.head.appendChild(stylesheet);

  // Create game interface
  const overlay = document.createElement("div");
  overlay.className = "ai-game-overlay";

  overlay.innerHTML = `
    <div class="ai-game-window">

      <div class="ai-game-header">
        <span class="ai-game-brand">Save the Dev</span>
        <button class="ai-game-close" aria-label="Close game">×</button>
      </div>

      <div class="ai-game-content">

        <h2 class="ai-game-title">
          RUN FROM <span>AI.</span>
        </h2>

        <p class="ai-game-subtitle">
          YOUR JOB IS AT STAKE. KEEP RUNNING.
        </p>

        <div class="ai-game-stats">
          <span>SCORE: <strong id="aiScore">0000</strong></span>
          <span>BEST: <strong id="aiBest">0000</strong></span>
          <span>LEVEL: <strong id="aiLevel">01</strong></span>
        </div>

        <div class="ai-game-canvas-wrap">
          <canvas id="aiGameCanvas" width="900" height="260"></canvas>
        </div>

        <p class="ai-game-status" id="aiGameStatus">
          <span>READY?</span> The AI agent is coming for your job.
        </p>

        <div class="ai-game-actions">
          <button class="ai-game-btn" id="aiStart">
            START RUNNING →
          </button>

          <button class="ai-game-btn secondary" id="aiExit">
            BACK TO PORTFOLIO
          </button>
        </div>

      </div>

      <div class="ai-game-footer">
        <span>SPACE / CLICK / TAP TO JUMP</span>
        <span>HUMANS VS MACHINES © 2026</span>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // DOM references
  const canvas = document.getElementById("aiGameCanvas");
  const ctx = canvas.getContext("2d", {
    alpha: false,
  });
  ctx.imageSmoothingEnabled = false;

  const scoreElement = document.getElementById("aiScore");
  const bestElement = document.getElementById("aiBest");
  const levelElement = document.getElementById("aiLevel");
  const statusElement = document.getElementById("aiGameStatus");

  const startButton = document.getElementById("aiStart");
  const exitButton = document.getElementById("aiExit");
  const closeButton = overlay.querySelector(".ai-game-close");

  // Game configuration
  const W = canvas.width;
  const H = canvas.height;
  const FLOOR = 210;

  const PLAYER_X = 135;
  const GRAVITY = 0.58;
  const JUMP_FORCE = -12.5;

  let coyoteTimer = 0;
  const COYOTE_TIME = 100;

  let running = false;
  let gameStarted = false;
  let gameOver = false;

  let animationFrame;
  let lastTime = 0;
  let elapsed = 0;
  let score = 0;
  let best = 0;
  let speed = 5;
  let spawnTimer = 0;
  let robotX = 15;
  let groundOffset = 0;

  let obstacles = [];
  let particles = [];

  const player = {
    x: PLAYER_X,
    y: FLOOR - 40,
    width: 26,
    height: 40,
    velocityY: 0,
    jumping: false,
  };

  // Persistent high score
  try {
    best = Number(localStorage.getItem("au-ai-best")) || 0;
  } catch (error) {
    best = 0;
  }

  bestElement.textContent = formatScore(best);

  function formatScore(value) {
    return String(Math.floor(value)).padStart(4, "0");
  }

  // PIXEL ART

  function pixel(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawDeveloper(x, y) {
    const phase = elapsed * 14;
    const bob = player.jumping ? 0 : Math.sin(phase * 2) * 1.5;
    const py = Math.round(y + bob);

    const dark = "#171916";
    const hoodie = "#c4f45d";
    const skin = "#f1c49a";
    const wheelRotation = elapsed * 12;

    // Detailed wheels
    function drawWheel(wx, wy) {
      ctx.beginPath();
      ctx.arc(wx + 6, wy + 6, 6, 0, Math.PI * 2);
      ctx.fillStyle = dark;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(wx + 6, wy + 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#42483f";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(wx + 6, wy + 6, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#a5aaa0";
      ctx.fill();

      // Spinning spokes
      ctx.save();
      ctx.translate(wx + 6, wy + 6);
      ctx.rotate(wheelRotation);

      ctx.strokeStyle = hoodie;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -4);
        ctx.stroke();
      }
      ctx.restore();
    }

    const wheelY = py + 33;

    drawWheel(x + 1, wheelY);
    drawWheel(x + 32, wheelY);

    // Rear mudguard
    pixel(x + 0, py + 31, 13, 3, "#777d70");

    // Scooter chassis
    pixel(x + 5, py + 27, 34, 6, dark);
    pixel(x + 8, py + 27, 26, 3, "#777d70");

    // Sleek deck
    pixel(x + 8, py + 25, 25, 4, hoodie);
    pixel(x + 10, py + 24, 21, 2, "#e0ff88");
    pixel(x + 12, py + 28, 18, 1, "#8da936");

    // Rear red tail light
    pixel(x + 5, py + 24, 3, 3, "#ff6655");

    // Front body / fairing
    pixel(x + 29, py + 19, 9, 11, dark);
    pixel(x + 31, py + 20, 6, 8, hoodie);
    pixel(x + 34, py + 23, 5, 5, "#8da936");

    // Front suspension fork
    pixel(x + 36, py + 27, 3, 8, "#a5aaa0");
    pixel(x + 37, py + 27, 1, 7, "#e0e4d9");

    // Handlebar stem
    pixel(x + 35, py + 12, 3, 13, dark);
    pixel(x + 36, py + 14, 2, 10, "#a5aaa0");
    // Handlebar
    pixel(x + 30, py + 11, 15, 3, dark);
    pixel(x + 30, py + 10, 4, 4, "#777d70");
    pixel(x + 42, py + 10, 4, 4, "#777d70");
    // Seat
    pixel(x + 10, py + 22, 15, 4, dark);
    pixel(x + 12, py + 21, 12, 3, "#777d70");
    pixel(x + 14, py + 21, 8, 1, "#a5aaa0");
    // Developer legs
    pixel(x + 13, py + 25, 7, 8, dark);
    pixel(x + 18, py + 28, 13, 5, "#777d70");
    // Shoes
    pixel(x + 25, py + 30, 8, 4, "#f1f1e9");
    pixel(x + 26, py + 33, 7, 1, "#a5aaa0");
    // Backpack
    pixel(x + 4, py + 10, 8, 15, dark);
    pixel(x + 5, py + 11, 6, 12, "#777d70");
    pixel(x + 6, py + 14, 4, 2, hoodie);
    // Hoodie body
    pixel(x + 9, py + 10, 17, 16, dark);
    pixel(x + 10, py + 11, 15, 14, hoodie);
    pixel(x + 13, py + 17, 9, 5, "#8da936");
    // Hoodie pocket
    pixel(x + 14, py + 21, 8, 3, "#8da936");
    pixel(x + 17, py + 21, 2, 1, "#e0ff88");
    // Head
    pixel(x + 11, py - 7, 18, 18, dark);
    pixel(x + 12, py - 6, 16, 16, skin);
    // Hair
    pixel(x + 9, py - 9, 18, 7, dark);
    pixel(x + 10, py - 8, 15, 4, "#29231f");
    pixel(x + 9, py - 4, 6, 5, "#29231f");
    // Eye
    pixel(x + 24, py + 0, 2, 3, dark);
    // Arm reaching handlebar
    pixel(x + 23, py + 13, 6, 4, hoodie);
    pixel(x + 27, py + 12, 8, 4, skin);
    // Bright LED headlight
    pixel(x + 38, py + 23, 5, 4, "#fff5b0");
    pixel(x + 39, py + 24, 3, 2, "#ffffff");
    // Small front indicator
    pixel(x + 37, py + 19, 3, 2, "#ffbd59");
  }

  function drawRobot(x, y) {
    // Animation timing
    const runPhase = Math.sin(elapsed * 14);
    const bob = Math.abs(runPhase) * 2;

    const legOffset = runPhase * 4;
    const antennaBob = Math.sin(elapsed * 5) * 2;

    // Arm movement
    const armSwing = Math.sin(elapsed * 14) * 3;
    const armY = bob + armSwing;

    // Robot shadow
    pixel(x + 1, y + 38, 40, 5, "rgba(0,0,0,.3)");

    // Antenna
    pixel(x + 18, y - 8 + bob + antennaBob, 3, 9, "#c4f45d");
    pixel(x + 16, y - 12 + bob + antennaBob, 7, 5, "#c4f45d");

    // Upper arm reaching forward (right)
    pixel(x + 34, y + 17 + armY, 14, 6, "#a5aaa0");
    pixel(x + 44, y + 15 + armY, 7, 6, "#777d70");

    // Upper hand and fingers
    pixel(x + 49, y + 12 + armY, 5, 4, "#c4f45d");
    pixel(x + 53, y + 15 + armY, 5, 4, "#c4f45d");
    pixel(x + 49, y + 20 + armY, 5, 4, "#c4f45d");

    // Lower arm reaching forward (right)
    pixel(x + 34, y + 26 - armY, 14, 6, "#a5aaa0");
    pixel(x + 44, y + 25 - armY, 7, 6, "#777d70");

    // Lower hand and fingers
    pixel(x + 49, y + 22 - armY, 5, 4, "#c4f45d");
    pixel(x + 53, y + 25 - armY, 5, 4, "#c4f45d");
    pixel(x + 49, y + 30 - armY, 5, 4, "#c4f45d");

    // Head
    pixel(x + 5, y + bob, 32, 24, "#a5aaa0");
    pixel(x + 9, y + 4 + bob, 24, 15, "#292d26");

    // Eyes
    const eyeColor = robotX > PLAYER_X - 100 ? "#ff3333" : "#ff6464";

    pixel(x + 12, y + 9 + bob, 5, 5, eyeColor);
    pixel(x + 26, y + 9 + bob, 5, 5, eyeColor);

    // Mouth
    pixel(x + 17, y + 17 + bob, 10, 2, "#c4f45d");

    // Body
    pixel(x + 3, y + 25 + bob, 36, 14, "#777d70");
    pixel(x + 9, y + 27 + bob, 24, 8, "#c4f45d");

    // legs
    pixel(x + 8 + legOffset, y + 39 + bob, 8, 7, "#a5aaa0");
    pixel(x + 26 - legOffset, y + 39 + bob, 8, 7, "#a5aaa0");
  }

  // BACKGROUND

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);

    // NIGHT SKY
    pixel(0, 0, W, H, "#20231e");

    // Stars
    for (let i = 0; i < 40; i++) {
      const x = (i * 137 + 30) % W;
      const y = (i * 53 + 20) % 120;

      const color = i % 4 === 0 ? "#c4f45d" : "#454b40";
      pixel(x, y, 2, 2, color);
    }

    // Moon
    pixel(750, 35, 20, 20, "#c4f45d");
    pixel(758, 28, 20, 20, "#20231e");

    // Extra stars
    pixel(710, 65, 3, 3, "#c4f45d");
    pixel(800, 85, 2, 2, "#777d70");
    pixel(650, 45, 2, 2, "#c4f45d");
    pixel(570, 75, 2, 2, "#454b40");
    pixel(350, 45, 3, 3, "#777d70");

    // CITY BUILDINGS
    const buildings = [
      {
        x: 0,
        w: 90,
        h: 65,
        color: "#292e27",
      },
      {
        x: 100,
        w: 75,
        h: 90,
        color: "#30372d",
      },
      {
        x: 190,
        w: 100,
        h: 55,
        color: "#292e27",
      },
      {
        x: 305,
        w: 75,
        h: 85,
        color: "#30372d",
      },
      {
        x: 395,
        w: 105,
        h: 65,
        color: "#292e27",
      },
      {
        x: 515,
        w: 80,
        h: 100,
        color: "#30372d",
      },
      {
        x: 610,
        w: 95,
        h: 70,
        color: "#292e27",
      },
      {
        x: 720,
        w: 110,
        h: 85,
        color: "#30372d",
      },
      {
        x: 850,
        w: 90,
        h: 60,
        color: "#292e27",
      },
    ];

    const offset = (groundOffset * 0.25) % 900;

    buildings.forEach((b, index) => {
      const x = (b.x - offset + 900) % 900;
      const y = FLOOR - b.h;

      // Building body
      pixel(x, y, b.w, b.h, b.color);

      // Roof
      pixel(x - 3, y - 4, b.w + 6, 4, "#454d40");

      // Side shading
      pixel(x + b.w - 5, y + 2, 5, b.h - 2, "#242a23");

      // Windows
      for (let wx = 10; wx < b.w - 10; wx += 20) {
        for (let wy = 12; wy < b.h - 12; wy += 20) {
          const lit = (index + wx + wy) % 3 !== 0;

          pixel(x + wx, y + wy, 7, 8, lit ? "#515a48" : "#20231e");
        }
      }

      // Rooftop antennas
      if (index % 3 === 1) {
        pixel(x + b.w / 2, y - 12, 3, 8, "#777d70");
        pixel(x + b.w / 2 - 3, y - 15, 9, 4, "#c4f45d");
      }

      // Rooftop ventilation
      if (index % 3 === 0) {
        pixel(x + 12, y - 9, 18, 5, "#515a48");
        pixel(x + 15, y - 12, 12, 3, "#777d70");
      }

      // Building signs
      if (index === 1) {
        pixel(x + 6, y + 5, 63, 15, "#171916");

        ctx.fillStyle = "#c4f45d";
        ctx.font = "bold 8px monospace";
        ctx.fillText("DEV HQ", x + 12, y + 16);
      }

      if (index === 7) {
        pixel(x + 9, y + 8, 88, 16, "#171916");

        ctx.fillStyle = "#c4f45d";
        ctx.font = "bold 8px monospace";
        ctx.fillText("SOS", x + 13, y + 19);
      }
    });

    // DISTANT CITY LIGHTS

    for (let i = 0; i < 18; i++) {
      const x = (i * 71 - offset * 0.5 + 900) % 900;
      const y = 35 + ((i * 17) % 65);

      pixel(x, y, 3, 3, i % 3 === 0 ? "#c4f45d" : "#515a48");
    }

    // GROUND
    pixel(0, FLOOR, W, 2, "#c4f45d");

    for (let i = 0; i < 35; i++) {
      const x = (i * 45 - groundOffset) % W;

      pixel((x + W) % W, FLOOR + 14, 13, 2, "#50574a");
    }

    // GAME LABEL
    ctx.fillStyle = "#777d70";
    ctx.font = "11px monospace";
    ctx.fillText("DEVELOPER MODE // SURVIVAL ACTIVE", 20, 25);
  }

  // OBSTACLES
  const obstacleTypes = [
    {
      label: "BUG",
      width: 39,
      height: 59,
      color: "#ff6464",
    },
    {
      label: "404",
      width: 55,
      height: 39,
      color: "#c4f45d",
    },
    {
      label: "KPI",
      width: 78,
      height: 39,
      color: "#e5a94b",
    },
    {
      label: "AI",
      width: 20,
      height: 70,
      color: "#a7aaff",
    },
    {
      label: "REPLACE",
      width: 80,
      height: 80,
      color: "#878787",
    },
  ];

  function spawnObstacle() {
    const type =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    obstacles.push({
      x: W + 20,
      y: FLOOR - type.height,
      width: type.width,
      height: type.height,
      label: type.label,
      color: type.color,
    });
  }

  function drawObstacles() {
    obstacles.forEach((obstacle) => {
      ctx.fillStyle = obstacle.color;

      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      ctx.fillStyle = "#171916";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        obstacle.label,
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2,
      );
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // PARTICLES
  function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 1) * 5,
        life: 30,
        color: "#c4f45d",
      });
    }
  }

  function updateParticles() {
    particles = particles.filter((p) => p.life > 0);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;

      pixel(p.x, p.y, 3, 3, p.color);
    });
  }

  // COLLISION

  function collides(a, b) {
    return (
      a.x + 5 < b.x + b.width - 3 &&
      a.x + a.width - 4 > b.x + 3 &&
      a.y + 5 < b.y + b.height &&
      a.y + a.height > b.y + 3
    );
  }

  // GAME UPDATE

  function update(delta) {
    const dt = Math.min(delta / 16.67, 2);

    elapsed += delta / 1000;
    score = Math.floor(elapsed * 10);

    speed = 5 + Math.min(elapsed * 0.12, 9);

    scoreElement.textContent = formatScore(score);
    levelElement.textContent = String(Math.floor(1 + elapsed / 15)).padStart(
      2,
      "0",
    );

    // Ground
    groundOffset += speed * dt;

    // Player physics
    player.velocityY += GRAVITY * dt;
    player.y += player.velocityY * dt;

    if (player.y >= FLOOR - player.height) {
      player.y = FLOOR - player.height;
      player.velocityY = 0;
      player.jumping = false;
      coyoteTimer = COYOTE_TIME;
    } else {
      coyoteTimer -= delta;
    }

    // Obstacles
    spawnTimer += delta;

    const spawnInterval = Math.max(950, 1450 - elapsed * 5);

    if (spawnTimer > spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
    }

    obstacles.forEach((obstacle) => {
      obstacle.x -= speed * dt;

      if (collides(player, obstacle)) {
        endGame("obstacle");
      }
    });

    obstacles = obstacles.filter((o) => o.x + o.width > 0);

    // AI chases the developer AI chase speed gradually increases
    // const aiSpeed = 0.025 + Math.min(elapsed * 0.00012, 0.12);
    // robotX += aiSpeed * dt;

    // if (robotX + 40 >= PLAYER_X - 2) {
    //   endGame("caught");
    // }

    // AI stays behind the developer
    robotX = Math.min(robotX + 0.015 * dt, 35);

    // Victory
    if (elapsed >= 120) {
      endGame("survived");
    }
  }

  // GAME RENDER

  function render() {
    drawBackground();

    drawObstacles();

    drawRobot(robotX, FLOOR - 46);

    drawDeveloper(player.x, player.y);

    updateParticles();

    // Robot warning
    ctx.fillStyle = "#ff6464";
    ctx.font = "10px monospace";
    ctx.fillText("AI AGENT", robotX - 3, FLOOR + 30);
  }

  // GAME LOOP

  const STEP = 1000 / 60;
  let accumulator = 0;

  function loop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;

    const delta = Math.min(timestamp - lastTime, 100);
    lastTime = timestamp;

    accumulator += delta;

    while (accumulator >= STEP && running) {
      update(STEP);
      accumulator -= STEP;
    }

    if (running) {
      render();
      animationFrame = requestAnimationFrame(loop);
    }
  }

  // JUMP

  function jump() {
    if (!running || coyoteTimer <= 0) return;

    player.velocityY = JUMP_FORCE;
    player.jumping = true;
    coyoteTimer = 0;

    createParticles(player.x + 10, FLOOR - 5);
  }

  // START GAME

  function startGame() {
    cancelAnimationFrame(animationFrame);

    running = true;
    gameStarted = true;
    gameOver = false;
    coyoteTimer = COYOTE_TIME;
    elapsed = 0;
    score = 0;
    speed = 5;
    spawnTimer = 0;
    robotX = 15;

    obstacles = [];
    particles = [];

    player.y = FLOOR - player.height;
    player.velocityY = 0;
    player.jumping = false;

    overlay.classList.remove("game-over");

    statusElement.innerHTML =
      "<span>RUN, DEVELOPER, RUN!</span> The AI is getting closer.";

    startButton.textContent = "RESTART GAME →";

    lastTime = 0;

    animationFrame = requestAnimationFrame(loop);
  }

  // GAME OVER

  function endGame(reason) {
    if (!running) return;

    running = false;
    gameOver = true;

    cancelAnimationFrame(animationFrame);

    if (score > best) {
      best = score;

      try {
        localStorage.setItem("au-ai-best", best);
      } catch (error) {
        // Game remains playable without storage.
      }
    }

    bestElement.textContent = formatScore(best);

    overlay.classList.add("game-over");

    if (reason === "survived") {
      statusElement.innerHTML =
        "<span>IMPOSSIBLE!</span> You survived 60 seconds. You are now more expensive than AI.";

      overlay.querySelector(".ai-game-title").innerHTML =
        "HUMAN <span>SUPREMACY.</span>";
    } else {
      statusElement.innerHTML =
        "<span>AI TAKEOVER COMPLETE.</span> Your position has been automated.";

      overlay.querySelector(".ai-game-title").innerHTML =
        "YOU GOT <span>REPLACED.</span>";
    }

    startButton.textContent = "TRY AGAIN →";

    render();
  }

  // GAME CONTROLS

  startButton.addEventListener("click", startGame);

  canvas.addEventListener("pointerdown", jump);

  document.addEventListener("keydown", (event) => {
    if (!overlay.classList.contains("active")) return;

    if (
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "KeyW"
    ) {
      event.preventDefault();

      if (!running && !gameOver) {
        startGame();
      } else {
        jump();
      }
    }

    if (event.code === "Escape") {
      closeGame();
    }
  });

  function closeGame() {
    running = false;
    gameStarted = false;

    cancelAnimationFrame(animationFrame);

    overlay.classList.remove("active", "game-over");

    overlay.querySelector(".ai-game-title").innerHTML =
      "RUN FROM <span>AI.</span>";

    startButton.textContent = "START RUNNING →";
  }

  closeButton.addEventListener("click", closeGame);
  exitButton.addEventListener("click", closeGame);

  // EASTER EGG ACTIVATION

  let logoClicks = 0;
  let logoTimer;

  const logo = document.querySelector(".navbar .logo");

  if (logo) {
    logo.addEventListener("click", () => {
      logoClicks++;

      clearTimeout(logoTimer);

      logoTimer = setTimeout(() => {
        logoClicks = 0;
      }, 2500);

      if (logoClicks >= 7) {
        logoClicks = 0;
        openGame();
      }
    });
  }

  // Konami code:
  // UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT

  const konami = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
  ];

  let keySequence = [];

  document.addEventListener("keydown", (event) => {
    if (overlay.classList.contains("active")) return;

    keySequence.push(event.key);

    keySequence = keySequence.slice(-konami.length);

    if (
      keySequence.length === konami.length &&
      keySequence.every((key, index) => key === konami[index])
    ) {
      keySequence = [];
      openGame();
    }
  });

  function openGame() {
    overlay.classList.add("active");

    overlay.classList.remove("game-over");

    overlay.querySelector(".ai-game-title").innerHTML =
      "RUN FROM <span>AI.</span>";

    statusElement.innerHTML =
      "<span>SECRET MODE ACTIVATED.</span> Your job is on the line.";

    render();
  }

  render();
})();
