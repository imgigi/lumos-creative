// ==================== STATE ====================
let siteData = null;
let currentLang = 'zh';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage;
  currentLang = browserLang.startsWith('zh') ? 'zh' : 'en';
  updateLangToggle();

  try {
    const res = await fetch('/api/data');
    siteData = await res.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    return;
  }

  renderAll();

  // Splash screen: black → glow → white → text → fade to home
  // The CSS animations handle the visual effect.
  // After ~5s total, fade out the splash.
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => { splash.style.display = 'none'; }, 800);
  }, 5000);
});

// ==================== LANGUAGE ====================
function setLang(lang) {
  currentLang = lang;
  updateLangToggle();
  renderAll();
}

function toggleLang() {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
}

function updateLangToggle() {
  document.getElementById('langEN').classList.toggle('active', currentLang === 'en');
  document.getElementById('langZH').classList.toggle('active', currentLang === 'zh');
}

// Helper: get localized field
function t(obj, field) {
  return obj[field + '_' + currentLang] || obj[field + '_en'] || '';
}

// ==================== RENDER ====================
function renderAll() {
  if (!siteData) return;

  // Logo: show site title based on language
  const logo = document.getElementById('logoText');
  logo.textContent = currentLang === 'en' ? siteData.site.title_en : siteData.site.title_zh;

  // Nav labels
  document.getElementById('nav-home').textContent = currentLang === 'zh' ? '首页' : 'Home';
  document.getElementById('nav-about').textContent = currentLang === 'zh' ? '关于' : 'About';

  renderHome();
  renderAbout();
}

// ==================== HOME PAGE ====================
function renderHome() {
  // Hero: name + title
  document.getElementById('heroName').textContent = t(siteData.about, 'name');
  document.getElementById('heroSubtitle').textContent = t(siteData.about, 'title');

  // Categories
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';

  siteData.categories.forEach((cat) => {
    const block = document.createElement('div');
    block.className = 'category-block';

    // Category header with triangle + arrow + name
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `<span class="triangle">△</span><div class="arrow"></div><h2>${t(cat, 'name')}</h2>`;
    header.onclick = () => {
      header.classList.toggle('open');
      block.querySelector('.projects-grid').classList.toggle('open');
    };

    // Horizontal scrollable project cards
    const grid = document.createElement('div');
    grid.className = 'projects-grid';

    cat.projects.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <img src="${proj.cover || ''}" alt="${t(proj, 'title')}" loading="lazy" onerror="this.style.display='none'">
        <div class="card-title">${t(proj, 'title')}</div>
      `;
      card.onclick = () => openProjectModal(proj);
      grid.appendChild(card);
    });

    block.appendChild(header);
    block.appendChild(grid);
    container.appendChild(block);
  });
}

// ==================== ABOUT PAGE ====================
function renderAbout() {
  document.getElementById('aboutPhoto').src = siteData.about.photo;
  document.getElementById('aboutName').textContent = t(siteData.about, 'name');
  document.getElementById('aboutTitle').textContent = t(siteData.about, 'title');
  document.getElementById('aboutQuote').textContent = t(siteData.about, 'quote');
  document.getElementById('aboutBio').textContent = t(siteData.about, 'bio');
  document.getElementById('aboutEdu').textContent = t(siteData.about, 'education');

  // Section headers
  document.getElementById('workExpHeader').textContent =
    currentLang === 'zh' ? 'work experience' : 'work experience';
  document.getElementById('servicesHeader').textContent =
    currentLang === 'zh' ? 'service' : 'service';

  // Work Experience list
  const workContainer = document.getElementById('workExpContainer');
  workContainer.innerHTML = '';
  siteData.workExperience.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'work-exp-item';
    item.innerHTML = `<span class="title">${t(exp, 'title')}</span><span class="period">${exp.period}</span>`;
    item.onclick = () => openWorkExpModal(exp);
    workContainer.appendChild(item);
  });

  // Services list
  const servicesContainer = document.getElementById('servicesContainer');
  servicesContainer.innerHTML = '';
  siteData.services.forEach(svc => {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.innerHTML = `
      <div class="service-title">${t(svc, 'title')}</div>
      <div class="service-desc">${t(svc, 'desc')}</div>
    `;
    servicesContainer.appendChild(item);
  });

  // Contact links
  const cc = document.getElementById('contactContainer');
  cc.innerHTML = '';

  const links = [
    { href: siteData.links.linkedin, icon: 'M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z', label: 'LinkedIn' },
    { href: siteData.links.github, icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z', label: 'GitHub' },
    { href: siteData.links.xiaohongshu, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z', label: '小红书' },
    { href: 'mailto:' + siteData.links.email, icon: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z', label: 'Email' }
  ];

  links.forEach(l => {
    if (!l.href || l.href === '#') return;
    const a = document.createElement('a');
    a.href = l.href;
    a.target = l.href.startsWith('mailto:') ? '_self' : '_blank';
    a.innerHTML = `<svg viewBox="0 0 24 24"><path d="${l.icon}"/></svg>${l.label}`;
    cc.appendChild(a);
  });
}

// ==================== SECTION TOGGLE ====================
function toggleSection(header) {
  header.classList.toggle('open');
  const content = header.nextElementSibling;
  if (content && content.classList.contains('section-content')) {
    content.classList.toggle('open');
  }
}

// ==================== NAVIGATION ====================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== CONTENT BLOCKS RENDERER ====================
// Renders an ordered array of content blocks: text, heading, images, link
function renderContentBlocks(blocks, imageFolder) {
  let html = '';
  const basePath = imageFolder ? `/images/projects/${imageFolder}/` : '';

  blocks.forEach(block => {
    switch (block.type) {
      case 'heading':
        html += `<h3 class="modal-heading">${block.text}</h3>`;
        break;
      case 'text':
        html += `<p class="modal-text">${block.text.replace(/\n/g, '<br>')}</p>`;
        break;
      case 'images':
        if (block.files && block.files.length > 0) {
          const colClass = block.files.length === 1 ? 'single'
            : block.files.length === 2 ? 'double' : 'triple';
          html += `<div class="modal-images ${colClass}">`;
          block.files.forEach(file => {
            const src = file.startsWith('http') ? file : basePath + file;
            html += `<img src="${src}" alt="" loading="lazy" onclick="openLightbox('${src}'); event.stopPropagation();" onerror="this.style.display='none'">`;
          });
          html += `</div>`;
        }
        break;
      case 'link':
        html += `<a href="${block.url}" target="_blank" class="modal-link">${block.text} \u2192</a>`;
        break;
    }
  });

  return html;
}

// ==================== MODAL ====================
function openProjectModal(proj) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const blocks = currentLang === 'zh' ? (proj.content_zh || []) : (proj.content_en || []);

  let html = `<h2>${t(proj, 'title')}</h2>`;
  html += renderContentBlocks(blocks, proj.imageFolder);

  content.innerHTML = html;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openWorkExpModal(exp) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const blocks = currentLang === 'zh' ? (exp.content_zh || []) : (exp.content_en || []);

  let html = `<h2>${t(exp, 'title')}</h2>`;
  html += `<p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.85rem">${exp.period}</p>`;
  html += renderContentBlocks(blocks, '');

  content.innerHTML = html;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on background click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeLightbox(); }
});

// ==================== LIGHTBOX ====================
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}
