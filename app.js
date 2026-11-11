// Frontend client logic connecting to SQLite Backend & Modern Interactions

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Scroll Effect
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY || window.pageYOffset;
    if (scrollPos > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Floating Back to Top Button
    if (backToTopBtn) {
      if (scrollPos > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 2. Mobile Menu Toggle (iOS & Android friendly)
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('active');
      mobileToggle.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    });

    // Close on navigation link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.classList.remove('open');
        document.body.style.overflow = 'auto';
      });
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        mobileToggle.classList.remove('open');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // 3. Scroll Reveal Animations (IntersectionObserver)
  initScrollReveal();

  // 4. Initial Database Connections & Data
  fetchHealthCheck(false); // Quick background ping
  fetchStats();
  loadProjects('All');

  // 5. Category Filter Tabs
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      loadProjects(category);
    });
  });

  // 6. Contact Form Submission (Saves into SQLite DB)
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        showStatus('Please fill in all required fields.', 'error');
        return;
      }

      // UI Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Sending...`;
      formStatus.innerHTML = '';
      formStatus.className = 'form-status';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showStatus('✨ Message received and saved in database! Stuti will contact you soon.', 'success');
          contactForm.reset();
          fetchStats(); // Update stats in ribbon
        } else {
          showStatus(data.error || 'Failed to send message. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Contact submission error:', err);
        showStatus('Network error: Unable to connect to backend server.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send Message</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;
      }
    });
  }

  function showStatus(msg, type) {
    formStatus.textContent = msg;
    formStatus.className = `form-status ${type}`;
  }

  // 7. Copy Email Helper
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText('stutu2004shah@gmail.com').then(() => {
        const originalText = copyEmailBtn.innerHTML;
        copyEmailBtn.innerHTML = '✓ Copied!';
        setTimeout(() => {
          copyEmailBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }

  // 8. Health Check Modal Trigger
  const openHealthBtn = document.getElementById('openHealthBtn');
  const healthModal = document.getElementById('healthModal');
  const closeHealthBtn = document.getElementById('closeHealthBtn');

  if (openHealthBtn && healthModal) {
    openHealthBtn.addEventListener('click', () => {
      fetchHealthCheck(true);
      healthModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeHealthBtn && healthModal) {
    closeHealthBtn.addEventListener('click', () => {
      healthModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    healthModal.addEventListener('click', (e) => {
      if (e.target === healthModal) {
        healthModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // 9. Inquiries Modal (View database messages)
  const openInquiriesBtn = document.getElementById('openInquiriesBtn');
  const inquiriesModal = document.getElementById('inquiriesModal');
  const closeInquiriesBtn = document.getElementById('closeInquiriesBtn');

  if (openInquiriesBtn && inquiriesModal) {
    openInquiriesBtn.addEventListener('click', () => {
      loadInquiries();
      inquiriesModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeInquiriesBtn && inquiriesModal) {
    closeInquiriesBtn.addEventListener('click', () => {
      inquiriesModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    inquiriesModal.addEventListener('click', (e) => {
      if (e.target === inquiriesModal) {
        inquiriesModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // 10. Case Study Modal
  const projectModal = document.getElementById('projectModal');
  const closeProjectModal = document.getElementById('closeProjectModal');

  if (closeProjectModal && projectModal) {
    closeProjectModal.addEventListener('click', () => {
      projectModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        projectModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }
});

// Scroll Reveal Initialization
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  } else {
    // Fallback for older browsers
    elements.forEach(el => el.classList.add('active'));
  }
}

// Fetch Live Health Check Data
async function fetchHealthCheck(showInModal = false) {
  const modalContent = document.getElementById('healthModalContent');
  if (showInModal && modalContent) {
    modalContent.innerHTML = `
      <div class="loading-state" style="text-align: center; padding: 30px;">
        <div class="spinner"></div>
        <p style="margin-top: 12px; color: var(--text-muted);">Testing Frontend ➔ Backend ➔ SQLite Database connection...</p>
      </div>
    `;
  }

  const startTime = performance.now();

  try {
    const res = await fetch('/api/health');
    const latency = Math.round(performance.now() - startTime);
    const data = await res.json();

    if (data.status === 'healthy') {
      const dbBadge = document.getElementById('dbBadge');
      if (dbBadge) {
        dbBadge.innerHTML = `<span class="pulse-dot"></span> Backend & DB: Healthy (${latency}ms)`;
      }

      if (showInModal && modalContent) {
        modalContent.innerHTML = `
          <div class="health-dashboard">
            <div class="health-status-badge">
              <span class="pulse-dot"></span> All Systems Operational (Healthy)
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">
              Frontend is successfully communicating with the Express backend, and the SQLite database executed live queries with <strong>${latency}ms</strong> round-trip latency.
            </p>

            <div class="health-grid">
              <div class="health-box">
                <div class="h-label">Frontend</div>
                <div class="h-val" style="color: #34d399;">Active (Browser)</div>
              </div>
              <div class="health-box">
                <div class="h-label">Express Backend</div>
                <div class="h-val" style="color: #34d399;">Running (Port 5000)</div>
              </div>
              <div class="health-box">
                <div class="h-label">Database Engine</div>
                <div class="h-val">${data.database.engine}</div>
              </div>
              <div class="health-box">
                <div class="h-label">DB Ping Response</div>
                <div class="h-val" style="color: #34d399;">Verified (1 / 1)</div>
              </div>
              <div class="health-box">
                <div class="h-label">Database Projects</div>
                <div class="h-val">${data.database.projectsCount} Loaded</div>
              </div>
              <div class="health-box">
                <div class="h-label">Stored Inquiries</div>
                <div class="h-val">${data.database.messagesCount} Messages</div>
              </div>
              <div class="health-box">
                <div class="h-label">Node Runtime</div>
                <div class="h-val">${data.system.nodeVersion}</div>
              </div>
              <div class="health-box">
                <div class="h-label">Server Uptime</div>
                <div class="h-val">${data.system.uptimeSeconds} seconds</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.warn('Backend health check error:', err);
    if (showInModal && modalContent) {
      modalContent.innerHTML = `
        <div class="health-dashboard" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
          <div class="health-status-badge" style="color: #f87171;">
            ⚠️ Backend Server Not Responding
          </div>
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
            Could not connect to <code>http://localhost:5000</code>. Please start the server using:
          </p>
          <pre style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #fff;">npm start</pre>
        </div>
      `;
    }
  }
}

// Fetch Live Database Stats
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success) {
      const messageCountEl = document.getElementById('dbMessageCount');
      if (messageCountEl) {
        messageCountEl.textContent = `${data.data.inquiries} Inquiries Stored`;
      }
    }
  } catch (err) {
    console.warn('Could not fetch backend stats:', err);
  }
}

// Load Projects from SQLite Backend
async function loadProjects(category = 'All') {
  const container = document.getElementById('projectGrid');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: var(--text-muted);">Loading projects from database...</p>
    </div>
  `;

  try {
    const url = category && category !== 'All' 
      ? `/api/projects?category=${encodeURIComponent(category)}` 
      : '/api/projects';

    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data || result.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No projects found in this category.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    result.data.forEach((p, index) => {
      const tagsList = p.tags ? p.tags.split(',').map(t => `<span class="project-tag">${t.trim()}</span>`).join('') : '';
      
      const card = document.createElement('div');
      card.className = 'project-card reveal';
      card.style.transitionDelay = `${index * 0.08}s`;

      card.innerHTML = `
        <div class="card-image-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="card-badge">${p.category}</div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${p.title}</h3>
          <p class="card-desc">${p.description}</p>
          <div class="project-tags">${tagsList}</div>
          <div class="card-actions">
            <button class="btn-case-study" onclick="openCaseStudy(${p.id})">
              Case Study
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <a href="${p.figma_url !== '#' ? p.figma_url : 'https://www.figma.com'}" target="_blank" class="btn-figma" title="Open Prototype" aria-label="Open Figma Prototype">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Re-trigger scroll reveal for newly added cards
    initScrollReveal();

  } catch (err) {
    console.warn('Backend server not detected or network error, rendering local fallback data:', err);
    // Graceful offline/file:// fallback so the portfolio displays even without running server
    const fallbackProjects = [
      {
        id: 1,
        title: 'Poster Store',
        category: 'E-Commerce',
        description: 'E-commerce UI with clean layout, product browsing, and smooth micro-interactions.',
        image: 'posterstore.png',
        tags: 'Figma,UI Design,E-Commerce,Grid System',
        figma_url: '#'
      },
      {
        id: 2,
        title: 'Shopping Website',
        category: 'E-Commerce',
        description: 'Modern responsive web UI with seamless onboarding, cart flow, and product showcases.',
        image: 'Shopping.png',
        tags: 'Figma,Responsive Design,Design System,UX Research',
        figma_url: '#'
      },
      {
        id: 3,
        title: 'DigiDoc Healthcare',
        category: 'Healthcare',
        description: 'Telemedicine platform UI for real-time appointments, digital health records, and doctor chat.',
        image: 'digidoc.png',
        tags: 'UX Research,Prototyping,Healthcare,Accessibility',
        figma_url: '#'
      },
      {
        id: 4,
        title: 'Fitness Pro Tracker',
        category: 'Fitness & Mobile',
        description: 'Dashboard-based mobile UI for tracking health metrics, daily workouts, and personalized fitness goals.',
        image: 'fitness.png',
        tags: 'Mobile UI,Data Viz,Gamification,Figma Prototype',
        figma_url: '#'
      },
      {
        id: 5,
        title: 'Meesho Shopping Flow',
        category: 'E-Commerce',
        description: 'Clean retail shopping UI with smart filters, instant checkout, and personalized recommendations.',
        image: 'meesho.png',
        tags: 'Mobile App,User Flow,Information Architecture',
        figma_url: '#'
      }
    ];

    const filtered = category && category !== 'All' 
      ? fallbackProjects.filter(p => p.category === category)
      : fallbackProjects;

    container.innerHTML = '';
    filtered.forEach((p, index) => {
      const tagsList = p.tags ? p.tags.split(',').map(t => `<span class="project-tag">${t.trim()}</span>`).join('') : '';
      const card = document.createElement('div');
      card.className = 'project-card reveal';
      card.style.transitionDelay = `${index * 0.08}s`;
      card.innerHTML = `
        <div class="card-image-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="card-badge">${p.category}</div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${p.title}</h3>
          <p class="card-desc">${p.description}</p>
          <div class="project-tags">${tagsList}</div>
          <div class="card-actions">
            <button class="btn-case-study" onclick="openCaseStudy(${p.id})">
              Case Study
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <a href="${p.figma_url !== '#' ? p.figma_url : 'https://www.figma.com'}" target="_blank" class="btn-figma" title="Open Prototype">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    initScrollReveal();

    const dbBadge = document.getElementById('dbBadge');
    if (dbBadge) {
      dbBadge.innerHTML = `<span style="color:#fbbf24;">●</span> Standalone Mode (Start server for Live DB)`;
    }
  }
}

// Open Case Study Modal
async function openCaseStudy(projectId) {
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="loading-state" style="text-align: center; padding: 40px;">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: var(--text-muted);">Fetching project details...</p>
    </div>
  `;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(`/api/projects/${projectId}`);
    const result = await res.json();
    if (!result.success || !result.data) {
      throw new Error('Project not found in DB');
    }

    const p = result.data;
    const tagsHtml = p.tags ? p.tags.split(',').map(t => `<span class="tag-chip">${t.trim()}</span>`).join('') : '';

    modalBody.innerHTML = `
      <div class="modal-cover">
        <img src="${p.image}" alt="${p.title}">
        <span class="modal-category">${p.category}</span>
      </div>
      <div class="modal-details">
        <h2>${p.title}</h2>
        <p class="modal-subtitle">${p.description}</p>
        
        <div class="modal-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Role</span>
            <span class="meta-value">Lead UI/UX Designer</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${p.category}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Deliverables</span>
            <span class="meta-value">Wireframes, High-Fidelity Prototype</span>
          </div>
        </div>

        <div class="modal-section">
          <h3>Overview & Objective</h3>
          <p>${p.details || p.description}</p>
        </div>

        <div class="modal-section">
          <h3>Skills & Design Tools</h3>
          <div class="tags-container">${tagsHtml}</div>
        </div>

        <div class="modal-cta-row">
          <a href="${p.figma_url !== '#' ? p.figma_url : 'https://www.figma.com'}" target="_blank" class="btn btn-primary">
            <span>Explore in Figma</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
          <a href="#contact" onclick="document.getElementById('projectModal').classList.remove('active'); document.body.style.overflow='auto';" class="btn btn-secondary">
            <span>Discuss This Project</span>
          </a>
        </div>
      </div>
    `;
  } catch (err) {
    const fallbackDetails = {
      1: { title: 'Poster Store', category: 'E-Commerce', image: 'posterstore.png', tags: 'Figma,UI Design,E-Commerce,Grid System', desc: 'E-commerce UI with clean layout, product browsing, and smooth micro-interactions.', details: 'Designed an immersive poster and art discovery storefront. Focused on high-conversion checkout flows, responsive grid systems, and subtle motion design.' },
      2: { title: 'Shopping Website', category: 'E-Commerce', image: 'Shopping.png', tags: 'Figma,Responsive Design,Design System,UX Research', desc: 'Modern responsive web UI with seamless onboarding, cart flow, and product showcases.', details: 'Comprehensive end-to-end user journey for an online fashion brand with custom design tokens, dark & light palettes, and accessible checkout patterns.' },
      3: { title: 'DigiDoc Healthcare', category: 'Healthcare', image: 'digidoc.png', tags: 'UX Research,Prototyping,Healthcare,Accessibility', desc: 'Telemedicine platform UI for real-time appointments, digital health records, and doctor chat.', details: 'Patient-centric mobile & web portal created to reduce appointment booking friction from 6 steps down to 2, adhering to WCAG accessibility standards.' },
      4: { title: 'Fitness Pro Tracker', category: 'Fitness & Mobile', image: 'fitness.png', tags: 'Mobile UI,Data Viz,Gamification,Figma Prototype', desc: 'Dashboard-based mobile UI for tracking health metrics, daily workouts, and personalized fitness goals.', details: 'Gamified workout tracking interface with data visualization widgets, streak counters, and habit-forming notification architecture.' },
      5: { title: 'Meesho Shopping Flow', category: 'E-Commerce', image: 'meesho.png', tags: 'Mobile App,User Flow,Information Architecture', desc: 'Clean retail shopping UI with smart filters, instant checkout, and personalized recommendations.', details: 'Redesigned core search, filter, and cart experience optimized for high-volume catalog browsing and mobile-first micro-interactions.' }
    };

    const p = fallbackDetails[projectId] || fallbackDetails[1];
    const tagsHtml = p.tags ? p.tags.split(',').map(t => `<span class="tag-chip">${t.trim()}</span>`).join('') : '';

    modalBody.innerHTML = `
      <div class="modal-cover">
        <img src="${p.image}" alt="${p.title}">
        <span class="modal-category">${p.category}</span>
      </div>
      <div class="modal-details">
        <h2>${p.title}</h2>
        <p class="modal-subtitle">${p.desc}</p>
        
        <div class="modal-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Role</span>
            <span class="meta-value">Lead UI/UX Designer</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">${p.category}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Deliverables</span>
            <span class="meta-value">Wireframes, High-Fidelity Prototype</span>
          </div>
        </div>

        <div class="modal-section">
          <h3>Overview & Objective</h3>
          <p>${p.details}</p>
        </div>

        <div class="modal-section">
          <h3>Skills & Design Tools</h3>
          <div class="tags-container">${tagsHtml}</div>
        </div>

        <div class="modal-cta-row">
          <a href="https://www.figma.com" target="_blank" class="btn btn-primary">
            <span>Explore in Figma</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
          <a href="#contact" onclick="document.getElementById('projectModal').classList.remove('active'); document.body.style.overflow='auto';" class="btn btn-secondary">
            <span>Discuss This Project</span>
          </a>
        </div>
      </div>
    `;
  }
}

// Load Inquiries List from SQLite DB
async function loadInquiries() {
  const listContainer = document.getElementById('inquiriesList');
  if (!listContainer) return;

  listContainer.innerHTML = `
    <div class="loading-state" style="text-align: center; padding: 30px;">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: var(--text-muted);">Loading inquiries from SQLite database...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/messages');
    const result = await res.json();

    if (!result.success || !result.data || result.data.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-inquiries" style="text-align: center; padding: 30px; color: var(--text-muted);">
          <p>No inquiries in the database yet. Submit the contact form on the website to test real-time insertion!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = '';
    result.data.forEach(m => {
      const item = document.createElement('div');
      item.className = 'inquiry-card';
      const dateStr = new Date(m.created_at).toLocaleString();

      item.innerHTML = `
        <div class="inquiry-header">
          <div>
            <strong>${escapeHtml(m.name)}</strong>
            <span class="inquiry-email">&lt;${escapeHtml(m.email)}&gt;</span>
          </div>
          <span class="inquiry-date">${dateStr}</span>
        </div>
        <div class="inquiry-subject"><strong>Subject:</strong> ${escapeHtml(m.subject || 'General Inquiry')}</div>
        <p class="inquiry-body">${escapeHtml(m.message)}</p>
        <div class="inquiry-actions">
          <button class="btn-delete" onclick="deleteInquiry(${m.id})">Delete</button>
          <a href="mailto:${escapeHtml(m.email)}?subject=Re: ${encodeURIComponent(m.subject || 'Portfolio Inquiry')}" class="btn-reply">Reply via Email</a>
        </div>
      `;
      listContainer.appendChild(item);
    });
  } catch (err) {
    listContainer.innerHTML = `<p class="error-msg" style="color: #f87171;">Error loading inquiries from database.</p>`;
  }
}

// Delete inquiry from DB
async function deleteInquiry(id) {
  if (!confirm('Are you sure you want to delete this message from the database?')) return;
  try {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadInquiries();
      fetchStats();
      fetchHealthCheck(false);
    }
  } catch (err) {
    alert('Failed to delete message.');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
