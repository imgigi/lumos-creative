// ==================== STATE ====================
let siteData = null;
let currentLang = 'zh';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
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
  initCursor();

  // Splash screen
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => splash.style.display = 'none', 1000);
  }, 3500);
});

// ==================== CURSOR ====================
function initCursor() {
  if (window.innerWidth <= 768) return;
  const glow = document.getElementById('cursorGlow');
  const trail = document.getElementById('cursorTrail');
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
  });
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .project-card, .category-header, .work-exp-item')) {
      glow.style.width = '40px'; glow.style.height = '40px';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .project-card, .category-header, .work-exp-item')) {
      glow.style.width = '20px'; glow.style.height = '20px';
    }
  });
}

// ==================== LANGUAGE ====================
function toggleLang() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  updateLangToggle();
  renderAll();
}

function updateLangToggle() {
  document.getElementById('langToggle').textContent = currentLang === 'zh' ? 'EN' : '中';
}

function t(obj, field) {
  return obj[field + '_' + currentLang] || obj[field + '_en'] || '';
}

// ==================== RENDER ====================
function renderAll() {
  if (!siteData) return;
  const logo = document.getElementById('logoText');
  logo.textContent = currentLang === 'en' ? siteData.site.title_en : siteData.site.title_zh;
  document.getElementById('nav-home').textContent = currentLang === 'zh' ? '首页' : 'Home';
  document.getElementById('nav-about').textContent = currentLang === 'zh' ? '关于' : 'About';
  renderHome();
  renderAbout();
}

function renderHome() {
  document.getElementById('heroName').textContent = t(siteData.about, 'name');
  document.getElementById('heroSubtitle').textContent = t(siteData.about, 'title');

  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';

  siteData.categories.forEach((cat) => {
    const block = document.createElement('div');
    block.className = 'category-block';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `<span class="triangle">△</span><div class="arrow"></div><h2>${t(cat, 'name')}</h2>`;
    header.onclick = () => {
      header.classList.toggle('open');
      block.querySelector('.projects-grid').classList.toggle('open');
    };

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

function renderAbout() {
  document.getElementById('aboutPhoto').src = siteData.about.photo;
  document.getElementById('aboutName').textContent = t(siteData.about, 'name');
  document.getElementById('aboutTitle').textContent = t(siteData.about, 'title');
  document.getElementById('aboutQuote').textContent = t(siteData.about, 'quote');
  document.getElementById('aboutBio').textContent = t(siteData.about, 'bio');
  document.getElementById('aboutEdu').textContent = t(siteData.about, 'education');

  document.getElementById('workExpHeader').textContent = currentLang === 'zh' ? '工作经验' : 'Work Experience';
  document.getElementById('servicesHeader').textContent = currentLang === 'zh' ? '服务' : 'Services';
  document.getElementById('contactHeader').textContent = currentLang === 'zh' ? '联系方式' : 'Contact';

  const workContainer = document.getElementById('workExpContainer');
  workContainer.innerHTML = '';
  siteData.workExperience.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'work-exp-item';
    item.innerHTML = `<span class="title">${t(exp, 'title')}</span><span class="period">${exp.period}</span>`;
    if (exp.detailFolder) item.onclick = () => openWorkExpModal(exp);
    workContainer.appendChild(item);
  });

  const servicesContainer = document.getElementById('servicesContainer');
  servicesContainer.innerHTML = '';
  siteData.services.forEach(svc => {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.innerHTML = `<div class="service-title">${t(svc, 'title')}</div><div class="service-desc">${t(svc, 'desc')}</div>`;
    servicesContainer.appendChild(item);
  });

  const cc = document.getElementById('contactContainer');
  cc.innerHTML = `
    <a href="${siteData.links.linkedin}" target="_blank"><svg viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>LinkedIn</a>
    <a href="${siteData.links.github}" target="_blank"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub</a>
    <a href="mailto:${siteData.links.email}"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Email</a>
  `;
}

// ==================== NAVIGATION ====================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== MODAL ====================
function openProjectModal(proj) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const sections = currentLang === 'zh' ? (proj.sections_zh || []) : (proj.sections_en || []);
  const images = proj.images || [];

  let html = `<h2>${t(proj, 'title')}</h2>`;
  sections.forEach(sec => {
    html += `<div class="modal-section">`;
    if (sec.subtitle) html += `<h3>${sec.subtitle}</h3>`;
    html += `<p>${sec.text.replace(/\n/g, '<br>')}</p></div>`;
  });
  if (proj.link) {
    html += `<a href="${proj.link}" target="_blank" class="modal-link">${currentLang === 'zh' ? '查看更多' : 'Learn More'} →</a>`;
  }
  if (images.length > 0) {
    html += `<div class="modal-gallery">`;
    images.forEach(img => {
      html += `<img src="${img}" alt="" loading="lazy" onclick="openLightbox('${img}'); event.stopPropagation();" onerror="this.style.display='none'">`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openWorkExpModal(exp) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  let detailText = '';
  siteData.categories.forEach(cat => {
    cat.projects.forEach(proj => {
      if (proj.id === exp.id) {
        const sections = currentLang === 'zh' ? (proj.sections_zh || []) : (proj.sections_en || []);
        sections.forEach(sec => {
          if (sec.subtitle) detailText += `<h3>${sec.subtitle}</h3>`;
          detailText += `<p>${sec.text.replace(/\n/g, '<br>')}</p>`;
        });
      }
    });
  });

  let html = `<h2>${t(exp, 'title')}</h2><p style="color:var(--text-dim);margin-bottom:1.5rem">${exp.period}</p>`;
  if (detailText) html += `<div class="modal-section">${detailText}</div>`;

  content.innerHTML = html;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

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
