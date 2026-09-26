// Gemini Vids Button — content script
// Adds a "Vids" action button to the left sidebar of gemini.google.com,
// styled like the existing native buttons (e.g. "Chat", "Images", ...).

(() => {
  const BTN_ID = "gemini-vids-extension-button";
  const BTN_LABEL = "Vids";

  // ---------- helpers ----------

  function log(...args) {
    console.log("[GeminiVids]", ...args);
  }

  // Collect candidate containers for the sidebar action buttons.
  // We look for elements that contain several <button> children with
  // mat-mdc-icon-button / class containing "ngcontent" typical of Angular Material.
  function findCandidateContainers(root) {
    const selectors = [
      // Current known classes in Gemini's sidebar (as of 2025/2026 UI)
      "aside mat-mdc-nav-list",
      "aside .side-nav-menu",
      "aside",
      "nav",
      "div[role='navigation']",
      "div[role='complementary']",
    ];
    const found = [];
    for (const sel of selectors) {
      root.querySelectorAll(sel).forEach((el) => found.push(el));
    }
    return found;
  }

  // Pick the container whose direct/descendant buttons look like the sidebar actions.
  function pickActionContainer(root) {
    const candidates = findCandidateContainers(root);
    let best = null;
    let bestScore = -1;

    for (const c of candidates) {
      // Count buttons that have an icon + text label pattern used by sidebar actions
      const buttons = Array.from(c.querySelectorAll("button"));
      if (!buttons.length) continue;

      let score = 0;
      for (const b of buttons) {
        const cls = (b.className || "").toString();
        const txt = (b.textContent || "").trim();
        const hasIcon = !!b.querySelector("mat-icon, svg, i");
        if (hasIcon && txt && txt.length <= 30) score += 1;
        if (cls.includes("ng-star-inserted")) score += 0.1;
      }

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  // Find the last "action-like" button inside the container so we can insert after it.
  function findLastActionButton(container) {
    const buttons = Array.from(container.querySelectorAll("button")).filter((b) => {
      const txt = (b.textContent || "").trim();
      const hasIcon = !!b.querySelector("mat-icon, svg, i");
      return hasIcon && txt && txt.length <= 30;
    });
    return buttons.length ? buttons[buttons.length - 1] : null;
  }

  // Clone styling from a reference button so our button looks native.
  function buildButton(reference) {
    let btn;
    if (reference) {
      btn = reference.cloneNode(true);
      // Clear old content & handlers
      btn.id = BTN_ID;
      btn.className = reference.className;
      btn.innerHTML = "";
      btn.removeAttribute("jsaction");
      btn.removeAttribute("aria-label");
    } else {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.className = "vids-btn-fallback";
    }

    btn.setAttribute("data-gemini-vids", "true");
    btn.setAttribute("aria-label", BTN_LABEL);
    btn.setAttribute("title", BTN_LABEL);
    btn.style.cursor = "pointer";

    // Icon: simple video/play glyph (inline SVG)
    const iconWrap = document.createElement("span");
    iconWrap.className = "vids-icon";
    iconWrap.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" focusable="false">
        <path d="M480-480q-33 0-56.5-23.5T400-560q0-33 23.5-56.5T480-640q33 0 56.5 23.5T560-560q0 33-23.5 56.5T480-480Zm0 80q55 0 105.5 15.5T684-340q24 23 37.5 58t13.5 78H225q0-43 13.5-78t37.5-58q47-44 97.5-59.5T480-400Zm0 320q-83 0-146-32t-110-87.5Q170-295 150-369q-20-74-20-151 0-49 12.5-95.5T177-699q-1-11 2.5-22t13.5-19q9-9 20.5-12t23.5-1q13 1 23 6.5t17 16.5q11 19 25.5 36.5T367-680q27-13 56.5-19.5T480-705q28 0 56.5 6t55.5 18q17-14 31.5-31.5T649-730q7-11 17-16.5t23-6.5q12-2 23.5 1t20.5 12q10 8 13.5 19t2.5 22q24 42 36.5 88.5T789-520q0 77-20 151-20 74-60 137.5Q663-176 600-144t-120 32Z"/>
      </svg>`;
    btn.appendChild(iconWrap);

    const label = document.createElement("span");
    label.className = "vids-label";
    label.textContent = BTN_LABEL;
    btn.appendChild(label);

    // Click handler — currently does nothing except a console log.
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      log(`"${BTN_LABEL}" button clicked (no action yet).`);
    });

    return btn;
  }

  // Insert our button right after the last action button in the container.
  function insertButton(container) {
    const reference = findLastActionButton(container);

    if (reference) {
      const btn = buildButton(reference);
      // Try to insert as sibling after the reference's closest list-item wrapper
      const refWrapper =
        reference.closest("li") ||
        reference.closest("[role='listitem']") ||
        reference.parentElement;
      if (refWrapper && refWrapper.parentNode === container) {
        refWrapper.after(btn);
      } else if (reference.parentElement) {
        reference.parentElement.after(btn);
      } else {
        container.appendChild(btn);
      }
      log("Inserted 'Vids' button after reference button.");
      return true;
    }

    // Fallback: append to container directly
    const btn = buildButton(null);
    container.appendChild(btn);
    log("Inserted 'Vids' button (fallback) into container.");
    return true;
  }

  // ---------- main loop ----------

  function tryAdd() {
    if (document.getElementById(BTN_ID)) return true; // already added

    const container = pickActionContainer(document);
    if (!container) return false;

    return insertButton(container);
  }

  function start() {
    // Immediate attempt
    if (tryAdd()) return;

    // Watch DOM for when the sidebar appears (Angular renders async)
    const observer = new MutationObserver(() => {
      if (tryAdd()) {
        observer.disconnect();
        log("'Vids' button successfully added.");
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Safety timeout: stop observing after 60s
    setTimeout(() => observer.disconnect(), 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
