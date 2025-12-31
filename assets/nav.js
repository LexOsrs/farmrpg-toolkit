// Responsive navigation
const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Apple Pie Calculator', href: '/apps/apple-pie-calc.html' },
  { name: 'Second App', href: '/apps/second-app.html' },
  { name: 'Third App', href: '/apps/third-app.html' },
  { name: 'Fourth App', href: '/apps/fourth-app.html' },
  { name: 'Fifth App', href: '/apps/fifth-app.html' },
  { name: 'Sixth App', href: '/apps/sixth-app.html' }
];

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = `
    <nav class="main-nav">
      <div class="nav-title-row">
        <span class="nav-title">FarmRPG Toolkit</span>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="7" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
            <rect y="14" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
            <rect y="21" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
          </svg>
        </button>
      </div>
      <div class="overlay-nav closed" id="overlayNav">
        <button class="close-btn" aria-label="Close menu">&times;</button>
        ${navLinks.map(link => `<a href="${link.href}">${link.name}</a>`).join('')}
      </div>
    </nav>
  `;
  const toggle = nav.querySelector('.nav-toggle');
  const overlay = nav.querySelector('#overlayNav');
  const closeBtn = nav.querySelector('.close-btn');
  // Open overlay on hamburger click
  toggle.addEventListener('click', () => {
    overlay.classList.remove('closed');
    toggle.setAttribute('aria-expanded', 'true');
  });
  // Close overlay on close button click
  closeBtn.addEventListener('click', () => {
    overlay.classList.add('closed');
    toggle.setAttribute('aria-expanded', 'false');
  });
  // Close overlay when a link is clicked (for SPA feel)
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      overlay.classList.add('closed');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}
document.addEventListener('DOMContentLoaded', renderNav);
