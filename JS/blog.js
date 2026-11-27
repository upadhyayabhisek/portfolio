document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

  const API_URL = "https://portfolio-blog-api.g38099933.workers.dev/api/blog";

  const container = document.getElementById("blogContainer");
  const articleCount = document.getElementById("articleCount");

  // THEME MANAGEMENT
  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);

    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.warn("Theme preference could not be saved.");
    }

    if (themeIcon) {
      themeIcon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");

      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("theme") || "dark";
  } catch (error) {
    // Fall back to dark theme.
  }

  applyTheme(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");

    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ELEMENT HELPER

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = text;
    }

    return element;
  }

  // DATE FORMATTING

  function formatDate(dateString) {
    if (!dateString) return "DATE UNAVAILABLE";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "DATE UNAVAILABLE";
    }

    return date
      .toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  }

  // ARTICLE COUNT

  function updateCount(count) {
    if (!articleCount) return;

    articleCount.textContent = `${String(count).padStart(2, "0")} ARTICLES PUBLISHED`;
  }

  // ARTICLE TAGS

  function createTags(tags) {
    const wrapper = createElement("div", "blog-tags");

    if (!Array.isArray(tags)) return wrapper;

    tags.forEach((tag) => {
      const element = createElement("span", "blog-tag", String(tag));

      wrapper.appendChild(element);
    });

    return wrapper;
  }

  function createArticle(post, index) {
    const article = createElement("article", "blog-card");

    const content = createElement("div", "blog-card-content");
    const meta = createElement("div", "blog-card-meta");

    meta.append(
      createElement("span", "", formatDate(post.date)),
      createElement(
        "span",
        "",
        `ENTRY / ${String(index + 1).padStart(2, "0")}`,
      ),
    );

    // CATEGORY

    const tags = Array.isArray(post.tags) ? post.tags : [];

    // TITLE

    const title = createElement("h2", "", post.title || "Untitled Article");

    // DESCRIPTION

    const description = createElement(
      "p",
      "blog-card-description",
      post.description || "Explore this article.",
    );

    // TAGS

    const tagElements = createTags(tags);

    // READ LINK

    const link = document.createElement("a");

    link.className = "blog-read";
    link.href = `post.html?slug=${encodeURIComponent(post.slug || "")}`;

    const label = createElement("span", "", "READ THE ARTICLE");

    const arrow = createElement("span", "", "↗");

    link.append(label, arrow);

    // ASSEMBLE CONTENT

    content.append(meta, title, description, tagElements, link);

    article.append(content);

    return article;
  }

  function renderBlogs(posts) {
    if (!container) return;

    container.replaceChildren();

    if (!posts.length) {
      container.appendChild(
        createElement(
          "p",
          "blog-empty",
          "NO ARTICLES YET. SOMETHING IS IN THE WORKS.",
        ),
      );

      updateCount(0);
      return;
    }

    // SORT NEWEST FIRST

    const sortedPosts = [...posts].sort((a, b) => {
      const dateA = new Date(`${a.date || "1970-01-01"}T00:00:00`);

      const dateB = new Date(`${b.date || "1970-01-01"}T00:00:00`);

      return dateB - dateA;
    });

    updateCount(sortedPosts.length);

    sortedPosts.forEach((post, index) => {
      const article = createArticle(post, index);

      container.appendChild(article);
    });
  }

  async function fetchBlogs() {
    if (!container) return;

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Unable to fetch articles.");
      }
      const data = await response.json();

      if (!data.success || !Array.isArray(data.posts)) {
        throw new Error("Invalid API response.");
      }

      renderBlogs(data.posts);
    } catch (error) {
      console.error("Blog API Error:", error);

      container.replaceChildren();

      container.appendChild(
        createElement(
          "p",
          "blog-status",
          "UNABLE TO LOAD ARTICLES. PLEASE TRY AGAIN LATER.",
        ),
      );
    }
  }

  fetchBlogs();
});
