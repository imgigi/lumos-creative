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
  initSplash();
});

// ==================== SPLASH SCREEN ====================
function initSplash() {
  const splash = document.getElementById('splash');
  const canvas = document.getElementById('splashCanvas');
  const ctx = canvas.getContext('2d');
  const textWrap = splash.querySelector('.splash-text-wrap');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const cx = () => canvas.width / 2;
  const cy = () => canvas.height / 2;

  // ---- Breathing light timeline (ms) ----
  // 0 - 600ms     : silence (pure dark)
  // 600 - 2200ms  : first breath — inhale up, exhale down (faint)
  // 2200 - 2600ms : pause between breaths
  // 2600 - 4400ms : second breath — inhale up, exhale down (stronger)
  // 4400 - 5200ms : light stabilizes, text fades in
  // 5200 - 8200ms : text holds (3 seconds visible)
  // 8200 - 9400ms : everything fades out, splash dismissed

  const startTime = performance.now();

  // Breathing curve: slow inhale (ease-in), quick peak, slow exhale (ease-out)
  function breathCurve(p) {
    // Asymmetric bell: slower rise, gentle fall — like real breathing
    if (p < 0.4) {
      // Inhale: slow start, accelerate
      const t = p / 0.4;
      return t * t * (3 - 2 * t); // smoothstep
    } else if (p < 0.55) {
      // Peak hold
      return 1;
    } else {
      // Exhale: ease out
      const t = (p - 0.55) / 0.45;
      return 1 - t * t;
    }
  }

  let animId;
  function drawFrame(now) {
    const t = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let glowAlpha = 0;
    let glowRadius = 0;
    const scale = canvas.width / 1440;

    if (t >= 600 && t < 2200) {
      // First breath: faint, like a tiny ember
      const p = (t - 600) / 1600;
      const b = breathCurve(p);
      glowAlpha = 0.18 * b;
      glowRadius = (200 + 100 * b) * scale;
    } else if (t >= 2600 && t < 4400) {
      // Second breath: stronger, light is waking up
      const p = (t - 2600) / 1800;
      const b = breathCurve(p);
      glowAlpha = 0.5 * b;
      glowRadius = (300 + 180 * b) * scale;
    } else if (t >= 4400 && t < 5200) {
      // Stabilize: glow settles into a steady warm light
      const p = (t - 4400) / 800;
      glowAlpha = 0.3 + 0.05 * Math.sin(p * Math.PI);
      glowRadius = 420 * scale;
    } else if (t >= 5200 && t < 8200) {
      // Sustained gentle glow while text is visible
      const p = (t - 5200) / 3000;
      glowAlpha = 0.3 * (1 - p * 0.3);
      glowRadius = 420 * scale;
    } else if (t >= 8200 && t < 9400) {
      // Fade out glow
      const p = (t - 8200) / 1200;
      glowAlpha = 0.21 * (1 - p);
      glowRadius = 420 * scale;
    }

    if (glowAlpha > 0) {
      // Warm white glow — like a candle or dawn light
      const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), glowRadius);
      grad.addColorStop(0, `rgba(255, 252, 240, ${glowAlpha})`);
      grad.addColorStop(0.25, `rgba(245, 240, 225, ${glowAlpha * 0.6})`);
      grad.addColorStop(0.55, `rgba(220, 215, 200, ${glowAlpha * 0.2})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Text appears at 4600ms (slightly after light stabilizes)
    if (t >= 4600 && textWrap.style.opacity === '0') {
      textWrap.style.transition = 'opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      textWrap.style.opacity = '1';
    }

    if (t < 9400) {
      animId = requestAnimationFrame(drawFrame);
    } else {
      cancelAnimationFrame(animId);
    }
  }

  textWrap.style.opacity = '0';
  animId = requestAnimationFrame(drawFrame);

  // Fade out splash at 8200ms (text has been visible ~3.6s)
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => { splash.style.display = 'none'; }, 1200);
  }, 8200);
}

// ==================== CANVAS CURSOR ====================
function initCursor() {
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const canvas = document.getElementById('cursorCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  let mx = -200, my = -200;
  let isHovering = false; // hovering over interactive element
  let isHoveringImage = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Track hover state
  document.addEventListener('mouseover', e => {
    const imgCard = e.target.closest('.project-card, .work-exp-card');
    isHoveringImage = !!imgCard;
    const interactive = e.target.closest('a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick]');
    isHovering = !!interactive;
  });
  document.addEventListener('mouseout', e => {
    const imgCard = e.target.closest('.project-card, .work-exp-card');
    if (imgCard) isHoveringImage = false;
    const interactive = e.target.closest('a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick]');
    if (interactive) isHovering = false;
  });

  // Particles
  const particles = [];
  const MAX_P = 12;

  function spawnParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.7;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed * 0.2,
      vy: Math.sin(angle) * speed * 0.2 - 0.3,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 1.5,
    });
    if (particles.length > MAX_P) particles.shift();
  }

  let lastSpawn = 0;

  function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn particle on movement
    if (now - lastSpawn > 30) {
      spawnParticle(mx, my);
      lastSpawn = now;
    }

    // Draw particles (soft white-blue glow dots)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      const alpha = p.life * 0.55;
      const r = p.size * p.life;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
      grad.addColorStop(0, `rgba(220, 230, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(180, 200, 255, ${alpha * 0.3})`);
      grad.addColorStop(1, 'rgba(180, 200, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main glow at cursor — focused and tight
    const baseSize = isHovering ? 16 : 10;
    const outerSize = isHoveringImage ? 32 : (isHovering ? 24 : 18);

    // Inner bright spot
    const ig = ctx.createRadialGradient(mx, my, 0, mx, my, baseSize);
    ig.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    ig.addColorStop(0.4, 'rgba(210, 220, 255, 0.4)');
    ig.addColorStop(0.8, 'rgba(180, 200, 255, 0.06)');
    ig.addColorStop(1, 'rgba(180, 200, 255, 0)');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(mx, my, baseSize, 0, Math.PI * 2);
    ctx.fill();

    // Outer halo — tighter
    const og = ctx.createRadialGradient(mx, my, 0, mx, my, outerSize);
    og.addColorStop(0, `rgba(200, 215, 255, ${isHoveringImage ? 0.12 : 0.07})`);
    og.addColorStop(0.6, `rgba(180, 200, 255, ${isHoveringImage ? 0.04 : 0.02})`);
    og.addColorStop(1, 'rgba(180, 200, 255, 0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(mx, my, outerSize, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// ==================== LANGUAGE ====================
function setLang(lang) {
  currentLang = lang;
  updateLangToggle();
  renderAll();
}

function updateLangToggle() {
  document.getElementById('langEN').classList.toggle('active', currentLang === 'en');
  document.getElementById('langZH').classList.toggle('active', currentLang === 'zh');
}

function t(obj, field) {
  return obj[field + '_' + currentLang] || obj[field + '_en'] || '';
}

// ==================== RENDER ====================
function renderAll() {
  if (!siteData) return;

  const logo = document.getElementById('logoText');
  if (currentLang === 'zh') {
    logo.textContent = '里面是·创意事务';
    logo.style.fontFamily = 'var(--font-serif-zh)';
  } else {
    logo.textContent = 'LUMOS CREATIVE';
    logo.style.fontFamily = 'var(--font-en)';
  }

  document.getElementById('nav-home').textContent = currentLang === 'zh' ? '首页' : 'Projects';
  document.getElementById('nav-about').textContent = currentLang === 'zh' ? '关于' : 'About';

  // Splash text is always fixed: EN main + ZH sub (no language switching)

  renderHome();
  renderAbout();
}

// ==================== HOME PAGE ====================
function renderHome() {
  document.getElementById('heroName').textContent = t(siteData.about, 'name');
  document.getElementById('heroSubtitle').textContent = t(siteData.about, 'title');

  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';

  siteData.categories.forEach((cat) => {
    const block = document.createElement('div');
    block.className = 'category-block';

    const header = document.createElement('div');
    header.className = 'category-header open';

    const catName = t(cat, 'name');
    const displayName = currentLang === 'en'
      ? catName.replace(/\b\w/g, c => c.toUpperCase())
      : catName;

    header.innerHTML = `<div class="arrow"></div><h2>${displayName}</h2>`;
    header.onclick = () => {
      header.classList.toggle('open');
      block.querySelector('.projects-grid').classList.toggle('open');
    };

    const grid = document.createElement('div');
    grid.className = 'projects-grid open';

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

  document.getElementById('workExpHeader').textContent =
    currentLang === 'zh' ? '工作经历' : 'Work Experience';
  document.getElementById('servicesHeader').textContent =
    currentLang === 'zh' ? '专业领域' : 'Professional Field';

  // Work Experience - image cards
  const workContainer = document.getElementById('workExpContainer');
  workContainer.innerHTML = '';
  const workScroll = document.createElement('div');
  workScroll.className = 'work-exp-scroll';

  siteData.workExperience.forEach((exp, idx) => {
    let coverImg = exp.cover || '';
    if (!coverImg && siteData.categories.length > 0) {
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

  // Services / Professional Field
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

  // Contact links - all 5, icon only, centered, bigger
  const cc = document.getElementById('contactContainer');
  cc.innerHTML = '';

  const links = [
    {
      href: siteData.links.linkedin,
      icon: '<svg viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>'
    },
    {
      href: siteData.links.github,
      icon: '<svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>'
    },
    {
      href: siteData.links.replit,
      icon: '<svg viewBox="0 0 24 24"><path d="M2 6a4 4 0 014-4h5v7H4a2 2 0 01-2-2V6zm0 5a2 2 0 012-2h7v6H4a2 2 0 01-2-2v-2zm9-9h5a4 4 0 014 4v1a2 2 0 01-2 2h-7V2zm0 20h5a4 4 0 004-4v-1a2 2 0 00-2-2h-7v7zm-7-7h7v7H6a4 4 0 01-4-4v-1a2 2 0 012-2z"/></svg>'
    },
    {
      href: siteData.links.xiaohongshu,
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13.93V18h-2v-2.07A6.01 6.01 0 016.07 11H8.1c.44 2.28 2.44 4 4.9 4s4.46-1.72 4.9-4h2.03A6.01 6.01 0 0113 15.93zM13 11V6h-2v5H9l3 3 3-3h-2z"/></svg>'
    },
    {
      href: siteData.links.email ? 'mailto:' + siteData.links.email : '',
      icon: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
    }
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
  document.querySelectorAll('.nav-center a').forEach(a => a.classList.remove('active'));
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
        html += `<p class="modal-text">${block.text.replace(/\n/g, '\n')}</p>`;
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
        html += `<div class="modal-link-wrap"><a href="${block.url}" target="_blank" class="modal-link">${block.text} →</a></div>`;
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

  if (proj.link && proj.link !== '#') {
    html += `<div class="modal-link-wrap"><a href="${proj.link}" target="_blank" class="modal-link">${currentLang === 'zh' ? '查看项目' : 'View Project'} →</a></div>`;
  }

  content.innerHTML = html;

  // Show overlay first (display: flex), then trigger background + content animation
  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';

  // Small delay so browser paints the element before transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  });
}

function openWorkExpModal(exp) {
  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const blocks = currentLang === 'zh' ? (exp.content_zh || []) : (exp.content_en || []);

  let html = `<h2>${t(exp, 'title')}</h2>`;
  html += `<p class="modal-text" style="margin-bottom:1.5rem;color:var(--text-muted)">${exp.period}</p>`;
  html += renderContentBlocks(blocks, exp.detailFolder || '');

  content.innerHTML = html;

  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  });
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.classList.remove('visible');
    document.body.style.overflow = '';
  }, 700);
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
