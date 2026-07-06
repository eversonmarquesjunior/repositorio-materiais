function initThemeToggle() {
  const checkbox = document.getElementById('themeToggle');
  if (!checkbox) return;
  checkbox.checked = document.documentElement.getAttribute('data-theme') === 'dark';
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  });
}

function initResponsiveSidebar() {
  const body = document.body;
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const links = document.querySelectorAll('.app-sidebar .sidebar-link');

  if (!toggle) return;

  const closeSidebar = () => body.classList.remove('sidebar-open');
  const openSidebar = () => body.classList.add('sidebar-open');

  toggle.addEventListener('click', () => {
    body.classList.toggle('sidebar-open');
  });

  backdrop?.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeSidebar();
  });

  links.forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeSidebar();
  });
}

window.addEventListener('DOMContentLoaded', initResponsiveSidebar);
window.addEventListener('DOMContentLoaded', initThemeToggle);
