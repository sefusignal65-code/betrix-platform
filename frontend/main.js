// Entry point for Vite static site

function initApp() {
  try {
    const app = document.getElementById("app");
    if (!app) {
      throw new Error("Could not find #app element in the document");
    }

    // If the `#app` element already contains markup (from `index.html`),
    // do not replace it. Instead, wire up any interactive behavior.
    const hasContent = app.children && app.children.length > 0 && app.textContent.trim().length > 0;
    if (!hasContent) {
      // Fallback content for very minimal setups
      app.innerHTML = `
        <h1>Welcome to Betrix Platform!</h1>
        <p>This is a Vite-powered static site.</p>
      `;
    }

    // Attach simple behavior to CTA buttons if present
    try {
      const ctas = app.querySelectorAll(".cta-button");
      ctas.forEach((btn) => {
        // If the button is an <a> tag with an href, let it behave normally.
        // Otherwise, add a click to show a simple message or navigate.
        if (btn.tagName === "A") return;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          // Example: if a data-href attribute exists, navigate to it
          const href = btn.getAttribute("data-href");
          if (href) window.location.href = href;
        });
      });
    } catch (err) {
      // Non-fatal: continue even if wiring up CTAs fails
      console.warn("Failed to attach CTA handlers", err);
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
    document.body.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h1>Error Loading Application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
      </div>
    `;
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
