// =========================================
// MAIN JAVASCRIPT
// =========================================

// ICONS
lucide.createIcons();

// THEME SWITCHER

const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("portfolio-theme");

if (savedTheme) {
  root.setAttribute("data-theme", savedTheme);
}

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

themeToggle?.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  root.setAttribute("data-theme", newTheme);
  localStorage.setItem("portfolio-theme", newTheme);

  updateThemeIcon();
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

// =========================================
// DJ VINYL INTERACTION
// =========================================

const vinyl = document.getElementById("vinylRecord");
const recordToggle = document.getElementById("recordToggle");
const recordStatus = document.getElementById("recordStatus");

if (vinyl && recordToggle) {
  let isPlaying = true;
  let isScratching = false;
  let lastAngle = 0;
  let scratchRotation = 0;

  const getAngle = (event, element) => {
    const rect = element.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return (
      Math.atan2(event.clientY - centerY, event.clientX - centerX) *
      (180 / Math.PI)
    );
  };

  const updatePlayState = () => {
    vinyl.classList.toggle("is-playing", isPlaying);

    if (recordStatus) {
      recordStatus.textContent = isPlaying ? "NOW PLAYING" : "PAUSED";
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
    updatePlayState();
  });

  // VINYL SCRATCHING

  vinyl.addEventListener("pointerdown", (event) => {
    isScratching = true;
    lastAngle = getAngle(event, vinyl);

    vinyl.setPointerCapture(event.pointerId);
    vinyl.style.animationPlayState = "paused";
    vinyl.style.cursor = "grabbing";

    if (recordStatus) {
      recordStatus.textContent = "SCRATCHING";
    }
  });

  vinyl.addEventListener("pointermove", (event) => {
    if (!isScratching) return;

    const currentAngle = getAngle(event, vinyl);

    let difference = currentAngle - lastAngle;

    // Prevent sudden rotation jumps across the angle boundary.
    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;

    scratchRotation += difference;
    lastAngle = currentAngle;

    vinyl.style.transform = `rotate(${scratchRotation}deg)`;
  });

  const stopScratching = () => {
    if (!isScratching) return;

    isScratching = false;

    vinyl.style.cursor = "grab";
    vinyl.style.transform = "";

    vinyl.style.animationPlayState = isPlaying ? "running" : "paused";

    if (recordStatus) {
      recordStatus.textContent = isPlaying ? "NOW PLAYING" : "PAUSED";
    }
  };

  vinyl.addEventListener("pointerup", stopScratching);
  vinyl.addEventListener("pointercancel", stopScratching);
  vinyl.addEventListener("lostpointercapture", stopScratching);
  updatePlayState();
}
