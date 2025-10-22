// Example Vite app entry point

export function initApp() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<h1>Welcome to Betrix Platform!</h1><p>This is a Vite-powered static site.</p>`;
  }
}

initApp();
