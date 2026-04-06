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
  initCursor();

  // Splash screen: breathing flicker → text stays → fade out
  // Total: ~7s (was ~5s, added 2s)
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => { splash.style.display = 'none'; }, 1000);
  }, 7000);
});

// ==================== CUSTOM CURSOR ====================
function initCursor() {
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const dot = document.getElementById('cursorDot');
  const glow = document.getElementById('cursorGlow');
  let mouseX = 0, mouseY = 0;
  let dotX = 0, dotY = 0;
  let glowX = 0, glowY = 0;
  let trails = [];

  // Create trail particles
  for (let i = 0; i < 8; i++) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);
    trails.push({ el: trail, x: 0, y: 0 });
  }

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    // Dot follows precisely
    dotX += (mouseX - dotX) * 0.25;
    dotY += (mouseY - dotY) * 0.25;
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';

    // Glow follows with delay
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';

    // Trail particles
    for (let i = trails.length - 1; i > 0; i--) {
      trails[i].x = trails[i - 1].x;
      trails[i].y = trails[i - 1].y;
    }
    trails[0].x = dotX;
    trails[0].y = dotY;

    trails.forEach((t, i) => {
      t.el.style.left = t.x + 'px';
      t.el.style.top = t.y + 'px';
      t.el.style.opacity = (1 - i / trails.length) * 0.4;
      t.el.style.width = (4 - i * 0.4) + 'px';
      t.el.style.height = (4 - i * 0.4) + 'px';
    });

    requestAnimationFrame(animate);
  }
  animate();

  // Enlarge cursor on interactive elements
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick]');
    if (target) {
      dot.style.width = '14px';
      dot.style.height = '14px';
      glow.style.width = '60px';
      glow.style.height = '60px';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick]');
    if (target) {
      dot.style.width = '8px';
      dot.style.height = '8px';
      glow.style.width = '40px';
      glow.style.height = '40px';
    }
  });
}

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

  // Logo: always show LUMOS CREATIVE in en, 里面是·创意事务 in zh
  const logo = document.getElementById('logoText');
  logo.textContent = currentLang === 'en' ? 'LUMOS CREATIVE' : '里面是·创意事务';

  // Nav labels
  document.getElementById('nav-home').textContent = currentLang === 'zh' ? '首页' : 'Projects';
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

    // Category header: arrow + name (right-aligned, no hollow triangle)
    const header = document.createElement('div');
    header.className = 'category-header open'; // default open
    const catName = t(cat, 'name');
    // Capitalize first letter of each word for English
    const displayName = currentLang === 'en'
      ? catName.replace(/\b\w/g, c => c.toUpperCase())
      : catName;
    header.innerHTML = `<div class="arrow"></div><h2>${displayName}</h2>`;
    header.onclick = () => {
      header.classList.toggle('open');
      block.querySelector('.projects-grid').classList.toggle('open');
    };

    // Horizontal scrollable project cards
    const grid = document.createElement('div');
    grid.className = 'projects-grid open'; // default open

    cat.projects.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="card-image">
          <img src="${proj.cover || ''}" alt="${t(proj, 'title')}" loading="lazy" onerror="this.style.display='none'">
        </div>
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

  // Awards section
  const awardsEl = document.getElementById('aboutAwards');
  if (currentLang === 'zh') {
    awardsEl.textContent =
      '第29届亚洲电视大奖 - 最佳娱乐节目奖（2024）\n' +
      '中国电视艺术家协会 - 最佳作品奖（2023）\n' +
      '上海国际艺术节 - 专题策划奖（2019，2020）';
  } else {
    awardsEl.textContent =
      '29th Asian Television Awards - Best Entertainment (One-Off or Annual) (2024)\n' +
      'China Television Artists Association - Best Work Award (2023)\n' +
      'Shanghai International Arts Festival - Special Programming Award (2019, 2020)';
  }

  // Section headers - localized
  document.getElementById('workExpHeader').textContent =
    currentLang === 'zh' ? '工作经历' : 'Work Experience';
  document.getElementById('servicesHeader').textContent =
    currentLang === 'zh' ? '专业领域' : 'Professional Field';

  // Work Experience - image cards like projects
  const workContainer = document.getElementById('workExpContainer');
  workContainer.innerHTML = '';
  const workScroll = document.createElement('div');
  workScroll.className = 'work-exp-scroll';

  siteData.workExperience.forEach((exp, idx) => {
    // Find a cover image: use exp.cover, or grab from related category projects
    let coverImg = exp.cover || '';
    if (!coverImg && siteData.categories.length > 0) {
      // Try to match work exp to a category by related projects
      const allProjects = siteData.categories.flatMap(c => c.projects);
      if (allProjects[idx] && allProjects[idx].cover) {
        coverImg = allProjects[idx].cover;
      } else if (allProjects.length > 0) {
        coverImg = allProjects[idx % allProjects.length]?.cover || '';
      }
    }

    const card = document.createElement('div');
    card.className = 'work-exp-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${coverImg}" alt="${t(exp, 'title')}" loading="lazy" onerror="this.parentElement.style.background='var(--bg-secondary)'">
      </div>
      <div class="card-title">${t(exp, 'title')}</div>
      <div class="card-period">${exp.period}</div>
    `;
    card.onclick = () => openWorkExpModal(exp);
    workScroll.appendChild(card);
  });
  workContainer.appendChild(workScroll);

  // Services / Professional Field list - centered
  const servicesContainer = document.getElementById('servicesContainer');
  servicesContainer.innerHTML = '';
  const servicesGrid = document.createElement('div');
  servicesGrid.className = 'services-grid';

  siteData.services.forEach(svc => {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.innerHTML = `
      <div class="service-title">${t(svc, 'title')}</div>
      <div class="service-desc">${t(svc, 'desc')}</div>
    `;
    servicesGrid.appendChild(item);
  });
  servicesContainer.appendChild(servicesGrid);

  // Contact links - icon only, centered, all links
  const cc = document.getElementById('contactContainer');
  cc.innerHTML = '';

  const links = [
    { href: siteData.links.linkedin, icon: '<svg viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>' },
    { href: siteData.links.github, icon: '<svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' },
    { href: siteData.links.replit, icon: '<svg viewBox="0 0 24 24"><path d="M2 6a4 4 0 014-4h5v7H4a2 2 0 01-2-2V6zm0 5a2 2 0 012-2h7v6H4a2 2 0 01-2-2v-2zm9-9h5a4 4 0 014 4v1a2 2 0 01-2 2h-7V2zm0 20h5a4 4 0 004-4v-1a2 2 0 00-2-2h-7v7zm-7-7h7v7H6a4 4 0 01-4-4v-1a2 2 0 012-2z"/></svg>' },
    { href: siteData.links.xiaohongshu, icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5h-7v-1h7v1zm0-3h-7v-1h7v1zm0-3h-7v-1h7v1zm-8.5-3V6h2v1.5h-2z"/></svg>' },
    { href: siteData.links.email ? 'mailto:' + siteData.links.email : '', icon: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' }
  ];

  links.forEach(l => {
    if (!l.href || l.href === '#' || l.href === 'mailto:') return;
    const a = document.createElement('a');
    a.href = l.href;
    a.target = l.href.startsWith('mailto:') ? '_self' : '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = l.icon;
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
          html += `<div class="modal-images">`;
          block.files.forEach(file => {
            const src = file.startsWith('http') ? file : basePath + file;
            html += `<img src="${src}" alt="" loading="lazy" onclick="openLightbox('${src}'); event.stopPropagation();" onerror="this.style.display='none'">`;
          });
          html += `</div>`;
        }
        break;
      case 'link':
        html += `<div class="modal-link-wrap"><a href="${block.url}" target="_blank" class="modal-link">${block.text} \u2192</a></div>`;
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

  // If project has a link, add a button
  if (proj.link && proj.link !== '#') {
    html += `<div class="modal-link-wrap"><a href="${proj.link}" target="_blank" class="modal-link">${currentLang === 'zh' ? '查看项目' : 'View Project'} \u2192</a></div>`;
  }

  content.innerHTML = html;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openWorkExpModal(exp) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const blocks = currentLang === 'zh' ? (exp.content_zh || []) : (exp.content_en || []);

  let html = `<h2>${t(exp, 'title')}</h2>`;
  html += `<p class="modal-text" style="margin-bottom:1.5rem;color:var(--text-muted)">${exp.period}</p>`;
  html += renderContentBlocks(blocks, exp.detailFolder || '');

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
