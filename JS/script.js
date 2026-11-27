lucide.createIcons();

// THEME SWITCHER
// THEME SWITCHER

const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

// LOAD SAVED THEME
const savedTheme = localStorage.getItem("theme") || "dark";

root.setAttribute("data-theme", savedTheme);

function updateThemeIcon() {
  if (!themeToggle) return;

  const theme = root.getAttribute("data-theme");

  themeToggle.innerHTML =
    theme === "dark"
      ? '<i data-lucide="sun"></i>'
      : '<i data-lucide="moon"></i>';

  lucide.createIcons();
}

updateThemeIcon();

// TOGGLE THEME
themeToggle?.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");

  const newTheme = currentTheme === "dark" ? "light" : "dark";

  root.setAttribute("data-theme", newTheme);

  localStorage.setItem("theme", newTheme);

  updateThemeIcon();

  console.log("Theme saved:", localStorage.getItem("theme"));
});

// MOBILE MENU

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle?.addEventListener("click", () => {
  if (!navLinks) return;

  navLinks.classList.toggle("active");

  menuToggle.innerHTML = navLinks.classList.contains("active")
    ? '<i data-lucide="x"></i>'
    : '<i data-lucide="menu"></i>';

  lucide.createIcons();
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks?.classList.remove("active");

    if (menuToggle) {
      menuToggle.innerHTML = '<i data-lucide="menu"></i>';
      lucide.createIcons();
    }
  });
});

// LOCAL TIME

function updateTime() {
  const timeElement = document.getElementById("localTime");

  if (!timeElement) return;

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  timeElement.textContent = " / " + time;
}

updateTime();

// FOOTER YEAR

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// LOADER

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const progress = document.querySelector(".loader-progress");

  if (!loader) return;

  if (window.gsap && progress) {
    gsap.to(progress, {
      width: "100%",
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => loader.remove(),
        });
      },
    });
  } else {
    loader.remove();
  }
});

//  VINYL INTERACTION
const vinyl = document.getElementById("vinylRecord");
const recordToggle = document.getElementById("recordToggle");
const recordStatus = document.getElementById("recordStatus");

if (vinyl && recordToggle) {
  let isPlaying = true;
  let isScratching = false;
  let lastAngle = 0;
  let currentRotation = 0;
  let spinAnimation = null;
  let activePointerId = null;

  const getAngle = (event, element) => {
    const rect = element.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return (
      Math.atan2(event.clientY - centerY, event.clientX - centerX) *
      (180 / Math.PI)
    );
  };

  // START SPINNING FROM CURRENT POSITION

  const startSpinning = () => {
    if (spinAnimation) {
      spinAnimation.cancel();
      spinAnimation = null;
    }

    vinyl.style.animation = "none";

    vinyl.style.transform = `rotate(${currentRotation}deg)`;

    if (!isPlaying || isScratching) return;

    spinAnimation = vinyl.animate(
      [
        { transform: `rotate(${currentRotation}deg)` },
        { transform: `rotate(${currentRotation + 360}deg)` },
      ],
      {
        duration: 2200,
        iterations: Infinity,
        easing: "linear",
      },
    );
  };

  // STOP AND SAVE CURRENT ROTATION

  const stopSpinning = () => {
    if (!spinAnimation) return;

    const computed = new DOMMatrixReadOnly(
      window.getComputedStyle(vinyl).transform,
    );

    let angle = Math.atan2(computed.b, computed.a) * (180 / Math.PI);

    if (angle < 0) angle += 360;

    // Keep rotation continuous across full revolutions
    const previousAngle = ((currentRotation % 360) + 360) % 360;
    let difference = angle - previousAngle;

    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;

    currentRotation += difference;

    spinAnimation.cancel();
    spinAnimation = null;

    vinyl.style.transform = `rotate(${currentRotation}deg)`;
  };

  // UPDATE PLAY STATE

  const updatePlayState = () => {
    vinyl.classList.toggle("is-playing", isPlaying);

    if (recordStatus) {
      recordStatus.textContent = isScratching
        ? "SCRATCHING"
        : isPlaying
          ? "NOW PLAYING"
          : "PAUSED";
    }

    recordToggle.innerHTML = isPlaying
      ? '<i data-lucide="pause"></i>'
      : '<i data-lucide="play"></i>';

    recordToggle.setAttribute(
      "aria-label",
      isPlaying ? "Pause record" : "Play record",
    );

    if (window.lucide) lucide.createIcons();
  };

  // PLAY / PAUSE

  recordToggle.addEventListener("click", () => {
    isPlaying = !isPlaying;

    if (isPlaying && !isScratching) {
      startSpinning();
    } else {
      stopSpinning();
    }

    updatePlayState();
  });

  // VINYL SCRATCHING

  vinyl.addEventListener("pointerdown", (event) => {
    if (isScratching) return;

    isScratching = true;
    activePointerId = event.pointerId;

    stopSpinning();

    lastAngle = getAngle(event, vinyl);

    vinyl.setPointerCapture(event.pointerId);
    vinyl.style.cursor = "grabbing";

    updatePlayState();
  });

  vinyl.addEventListener("pointermove", (event) => {
    if (!isScratching || event.pointerId !== activePointerId) return;

    const currentAngle = getAngle(event, vinyl);

    let difference = currentAngle - lastAngle;

    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;

    currentRotation += difference;
    lastAngle = currentAngle;

    vinyl.style.transform = `rotate(${currentRotation}deg)`;
  });

  // STOP SCRATCHING

  const stopScratching = (event) => {
    if (!isScratching) return;

    if (
      event &&
      activePointerId !== null &&
      event.pointerId !== activePointerId
    )
      return;

    isScratching = false;
    activePointerId = null;

    vinyl.style.cursor = "grab";

    if (isPlaying) {
      startSpinning();
    } else {
      vinyl.style.transform = `rotate(${currentRotation}deg)`;
    }

    updatePlayState();
  };
  vinyl.addEventListener("pointerup", stopScratching);
  vinyl.addEventListener("pointercancel", stopScratching);
  vinyl.addEventListener("lostpointercapture", stopScratching);
  vinyl.style.animation = "none";
  vinyl.style.transform = "rotate(0deg)";
  startSpinning();
  updatePlayState();
}
