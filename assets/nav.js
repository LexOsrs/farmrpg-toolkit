// Responsive navigation
// Detect base path for local or GitHub Pages
let basePath = '/';
if (window.location.pathname.includes('/farmrpg-toolkit/')) {
  basePath = '/farmrpg-toolkit/';
}

const navLinks = [
  { name: 'Home', href: basePath + 'index.html' },
  { name: 'Apple Pie Calculator', href: basePath + 'apps/apple-pie-calc.html' },
  { name: 'Crop Yield Calculator', href: basePath + 'apps/crop-calc.html' },
];

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = `
    <nav class="main-nav">
      <div class="nav-title-row">
        <div class="nav-title-left">
            <img src="${basePath}assets/img/farm_large.png" alt="Farm" class="farm-icon" style="margin-right:8px;width:34px;height:34px;object-fit:contain;vertical-align:middle;" />
          <a class="nav-title" href="${basePath}index.html" style="text-decoration:none;color:#2e7d4f;display:inline-block;vertical-align:middle;">FarmRPG Toolkit</a>
        </div>
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
