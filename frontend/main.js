// Entry point for Vite static site

function initApp() {
  try {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('Could not find #app element in the document');
    }
    app.innerHTML = `
      <h1>Welcome to Betrix Platform!</h1>
      <p>This is a Vite-powered static site.</p>
    `;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.body.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h1>Error Loading Application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
      </div>
    `;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
