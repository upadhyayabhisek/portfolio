document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://portfolio-blog-api.g38099933.workers.dev/api/blog";

  const container = document.getElementById("postContainer");

  const html = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

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

      window.lucide?.createIcons();
    }
  }

  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("theme") || "dark";
  } catch (error) {
    // Default to dark.
  }

  applyTheme(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const current = html.getAttribute("data-theme");

    applyTheme(current === "dark" ? "light" : "dark");
  });

  // FOOTER YEAR

  document.getElementById("year").textContent = new Date().getFullYear();

  // HELPERS

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

  function formatDate(dateString) {
    if (!dateString) return "DATE UNAVAILABLE";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "DATE UNAVAILABLE";
    }

    return date
      .toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();
  }

  function calculateReadingTime(content) {
    const words = String(content || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 200));
  }

  // SAFE MARKDOWN RENDERER

  function renderMarkdown(markdown) {
    const fragment = document.createDocumentFragment();

    const lines = String(markdown || "")
      .replace(/\r\n/g, "\n")
      .split("\n");

    let paragraph = [];
    let list = null;
    let codeLines = null;

    function flushParagraph() {
      if (!paragraph.length) return;

      const p = createElement("p");

      appendInline(p, paragraph.join(" "));

      fragment.appendChild(p);
      paragraph = [];
    }

    function flushList() {
      if (!list) return;

      fragment.appendChild(list);
      list = null;
    }

    function appendInline(parent, value) {
      // Escape all content first.
      const tokens = [];
      const regex =
        /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

      let lastIndex = 0;
      let match;

      while ((match = regex.exec(value)) !== null) {
        parent.appendChild(
          document.createTextNode(value.slice(lastIndex, match.index)),
        );

        let element;

        if (match[1] !== undefined) {
          element = createElement("code");
          element.textContent = match[1];
        } else if (match[2] !== undefined) {
          element = createElement("strong");
          element.textContent = match[2];
        } else if (match[3] !== undefined) {
          element = createElement("em");
          element.textContent = match[3];
        } else {
          element = createElement("a");
          element.textContent = match[4];
          element.href = match[5];
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }

        parent.appendChild(element);
        lastIndex = regex.lastIndex;
      }

      parent.appendChild(document.createTextNode(value.slice(lastIndex)));
    }

    lines.forEach((line) => {
      const trimmed = line.trim();

      // CODE BLOCKS

      if (trimmed.startsWith("```")) {
        flushParagraph();
        flushList();

        if (codeLines) {
          const pre = createElement("pre");
          const code = createElement("code");

          code.textContent = codeLines.join("\n");
          pre.appendChild(code);

          fragment.appendChild(pre);
          codeLines = null;
        } else {
          codeLines = [];
        }

        return;
      }

      if (codeLines) {
        codeLines.push(line);
        return;
      }

      // EMPTY LINES

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      // HEADINGS

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);

      if (heading) {
        flushParagraph();
        flushList();

        const level = heading[1].length;
        const element = createElement(`h${level}`);

        appendInline(element, heading[2]);
        fragment.appendChild(element);

        return;
      }

      // BLOCKQUOTES

      if (trimmed.startsWith("> ")) {
        flushParagraph();
        flushList();

        const quote = createElement("blockquote");

        appendInline(quote, trimmed.slice(2));

        fragment.appendChild(quote);
        return;
      }

      // UNORDERED AND ORDERED LISTS

      const unordered = trimmed.match(/^[-*]\s+(.+)$/);
      const ordered = trimmed.match(/^\d+\.\s+(.+)$/);

      if (unordered || ordered) {
        flushParagraph();

        const type = unordered ? "ul" : "ol";

        if (!list || list.tagName.toLowerCase() !== type) {
          flushList();
          list = createElement(type);
        }

        const li = createElement("li");

        appendInline(li, (unordered || ordered)[1]);
        list.appendChild(li);

        return;
      }

      flushList();

      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    if (codeLines) {
      const pre = createElement("pre");
      const code = createElement("code");

      code.textContent = codeLines.join("\n");
      pre.appendChild(code);

      fragment.appendChild(pre);
    }

    return fragment;
  }

  // ARTICLE IMAGE

  function createCover(post) {
    if (!post.image || !post.image.trim()) {
      return null;
    }

    const wrapper = createElement("div", "post-cover");

    const image = document.createElement("img");

    image.src = post.image;
    image.alt = post.title || "Article cover";
    image.loading = "eager";

    image.onerror = () => {
      wrapper.remove();
    };

    wrapper.appendChild(image);

    return wrapper;
  }

  // ARTICLE TAGS

  function createTags(tags) {
    const wrapper = createElement("div", "post-tags");

    if (!Array.isArray(tags)) return wrapper;

    tags.forEach((tag) => {
      wrapper.appendChild(createElement("span", "post-tag", String(tag)));
    });

    if (!tags.length) {
      wrapper.appendChild(
        createElement("span", "sidebar-note", "No tags available."),
      );
    }

    return wrapper;
  }

  // ARTICLE HEADER

  function createHeader(post, readingTime) {
    const header = createElement("header", "post-header");

    const breadcrumb = createElement("div", "post-breadcrumb");

    breadcrumb.append(
      createElement("span", "", "ARTICLE"),
      createElement("span", "", "BLOG/ RANT / ENTRY"),
    );

    const title = createElement(
      "h1",
      "post-title",
      post.title || "Untitled Article",
    );

    const description = createElement(
      "p",
      "post-description",
      post.description || "An article by Abhisek Upadhyay.",
    );

    const meta = createElement("div", "post-meta");

    const items = [
      ["PUBLISHED", formatDate(post.date)],
      ["READING TIME", `${readingTime} MIN READ`],
      ["AUTHOR", "ABHISEK UPADHYAY"],
    ];

    items.forEach(([label, value]) => {
      const item = createElement("div", "post-meta-item");

      item.append(
        createElement("span", "", label),
        createElement("span", "", value),
      );

      meta.appendChild(item);
    });

    header.append(breadcrumb, title, description, meta);

    return header;
  }

  // ARTICLE BODY

  function createBody(post) {
    const wrapper = createElement("div", "post-body-wrapper");

    const content = createElement("div", "post-content");

    // FULL ARTICLE

    const articleBody = createElement("div", "post-content-body");

    articleBody.appendChild(
      renderMarkdown(post.longDescription || "Article content coming soon."),
    );

    // ARTICLE FOOTER

    const footer = createElement("div", "post-footer");

    footer.appendChild(createElement("span", "", "END OF ARTICLE."));

    content.append(articleBody, footer);

    // SIDEBAR
    const sidebar = createElement("aside", "post-sidebar");
    const tagBlock = createElement("div", "sidebar-block");

    tagBlock.append(
      createElement("span", "sidebar-label", "FILED UNDER"),
      createTags(post.tags),
    );

    sidebar.append(tagBlock);

    wrapper.append(content, sidebar);

    return wrapper;
  }

  // RENDER ARTICLE

  function renderPost(post) {
    container.replaceChildren();

    const readingTime = calculateReadingTime(post.longDescription);

    const header = createHeader(post, readingTime);
    const cover = createCover(post);
    const body = createBody(post);

    container.append(header);

    if (cover) {
      container.appendChild(cover);
    }

    container.appendChild(body);

    // Update browser title

    document.title = `${post.title || "Article"} — Abhisek Upadhyay`;

    // Update meta description

    const descriptionMeta = document.querySelector('meta[name="description"]');

    if (descriptionMeta) {
      descriptionMeta.content =
        post.description || "An article by Abhisek Upadhyay.";
    }

    // Refresh icons

    window.lucide?.createIcons();
  }

  // ERROR STATE

  function showError(message) {
    container.replaceChildren();

    const error = createElement("div", "post-error");

    error.append(createElement("span", "", message));

    const link = createElement("a", "", "← BACK TO JOURNAL");

    link.href = "blog.html";

    error.appendChild(link);

    container.appendChild(error);
  }

  // FETCH ARTICLE

  async function fetchPost() {
    const params = new URLSearchParams(window.location.search);

    const slug = params.get("slug");

    if (!slug) {
      showError("NO ARTICLE WAS SPECIFIED.");
      return;
    }

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to fetch articles.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.posts)) {
        throw new Error("Invalid API response.");
      }

      const post = data.posts.find((item) => item.slug === slug);

      if (!post) {
        showError("ARTICLE NOT FOUND.");
        return;
      }

      renderPost(post);
    } catch (error) {
      console.error("Article API Error:", error);

      showError("UNABLE TO LOAD ARTICLE. PLEASE TRY AGAIN LATER.");
    }
  }

  fetchPost();
});
