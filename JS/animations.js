// =========================================
// GSAP SMOOTH ANIMATIONS
// =========================================

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // GLOBAL DEFAULTS
  gsap.defaults({
    ease: "power3.out",
    duration: 1,
  });

  // HERO INTRODUCTION
  const heroTimeline = gsap.timeline({
    delay: 0.3,
    defaults: {
      ease: "power4.out",
    },
  });

  heroTimeline
    .from(".hero-intro", {
      y: 25,
      opacity: 0,
      duration: 1,
    })
    .from(
      ".hero-heading h1",
      {
        y: 70,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
      },
      "-=0.65",
    )
    .from(
      ".hero-bottom",
      {
        y: 25,
        opacity: 0,
        duration: 1,
      },
      "-=0.7",
    )
    .from(
      ".hero-visual",
      {
        scale: 0.92,
        y: 30,
        opacity: 0,
        duration: 1.4,
        ease: "power3.out",
      },
      "-=1",
    );

  // SECTION LABELS
  gsap.utils.toArray(".section-label").forEach((label) => {
    gsap.from(label, {
      y: 20,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",

      scrollTrigger: {
        trigger: label,
        start: "top 90%",
        toggleActions: "play none none reverse",
      },
    });
  });

  // ABOUT HEADING
  gsap.from(".about-content h2", {
    y: 50,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",

    scrollTrigger: {
      trigger: ".about-content",
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

  // ABOUT IMAGE
  gsap.from(".about-image", {
    x: -40,
    y: 20,
    opacity: 0,
    duration: 1.3,
    ease: "power3.out",

    scrollTrigger: {
      trigger: ".about-bottom",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  // PROJECT ANIMATIONS
  gsap.utils.toArray(".project-item").forEach((project) => {
    gsap.from(project, {
      y: 45,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",

      scrollTrigger: {
        trigger: project,
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    });
  });

  // SKILLS ANIMATION
  gsap.from(".skill-group", {
    y: 35,
    opacity: 0,
    stagger: 0.12,
    duration: 1,
    ease: "power3.out",

    scrollTrigger: {
      trigger: ".skills-grid",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  // CONTACT ANIMATION
  gsap.from(".contact h2", {
    y: 55,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",

    scrollTrigger: {
      trigger: ".contact",
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

  // REFRESH SCROLLTRIGGER
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
}
