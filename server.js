const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'portfolio.db');
const db = new DatabaseSync(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT,
    image TEXT NOT NULL,
    tags TEXT NOT NULL,
    figma_url TEXT,
    live_url TEXT,
    featured INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'unread'
  );
`);

// Seed Default Projects if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM projects');
const { count } = countStmt.get();

if (count === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (title, category, description, details, image, tags, figma_url, live_url, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProjects = [
    {
      title: 'Poster Store',
      category: 'E-Commerce',
      description: 'E-commerce UI with clean layout, product browsing, and smooth micro-interactions.',
      details: 'Designed an immersive poster and art discovery storefront. Focused on high-conversion checkout flows, responsive grid systems, and subtle motion design.',
      image: 'posterstore.png',
      tags: 'Figma,UI Design,E-Commerce,Grid System',
      figma_url: '#',
      live_url: '#',
      featured: 1
    },
    {
      title: 'Shopping Website',
      category: 'E-Commerce',
      description: 'Modern responsive web UI with seamless onboarding, cart flow, and product showcases.',
      details: 'Comprehensive end-to-end user journey for an online fashion brand with custom design tokens, dark & light palettes, and accessible checkout patterns.',
      image: 'Shopping.png',
      tags: 'Figma,Responsive Design,Design System,UX Research',
      figma_url: '#',
      live_url: '#',
      featured: 1
    },
    {
      title: 'DigiDoc Healthcare',
      category: 'Healthcare',
      description: 'Telemedicine platform UI for real-time appointments, digital health records, and doctor chat.',
      details: 'Patient-centric mobile & web portal created to reduce appointment booking friction from 6 steps down to 2, adhering to WCAG accessibility standards.',
      image: 'digidoc.png',
      tags: 'UX Research,Prototyping,Healthcare,Accessibility',
      figma_url: '#',
      live_url: '#',
      featured: 1
    },
    {
      title: 'Fitness Pro Tracker',
      category: 'Fitness & Mobile',
      description: 'Dashboard-based mobile UI for tracking health metrics, daily workouts, and personalized fitness goals.',
      details: 'Gamified workout tracking interface with data visualization widgets, streak counters, and habit-forming notification architecture.',
      image: 'fitness.png',
      tags: 'Mobile UI,Data Viz,Gamification,Figma Prototype',
      figma_url: '#',
      live_url: '#',
      featured: 1
    },
    {
      title: 'Meesho Shopping Flow',
      category: 'E-Commerce',
      description: 'Clean retail shopping UI with smart filters, instant checkout, and personalized recommendations.',
      details: 'Redesigned core search, filter, and cart experience optimized for high-volume catalog browsing and mobile-first micro-interactions.',
      image: 'meesho.png',
      tags: 'Mobile App,User Flow,Information Architecture',
      figma_url: '#',
      live_url: '#',
      featured: 1
    }
  ];

  for (const p of initialProjects) {
    insertProject.run(
      p.title,
      p.category,
      p.description,
      p.details,
      p.image,
      p.tags,
      p.figma_url,
      p.live_url,
      p.featured
    );
  }
  console.log('Seeded initial projects successfully.');
}

// ================= API ROUTES ================= //

// GET /api/projects - fetch all or filter by category
app.get('/api/projects', (req, res) => {
  try {
    const { category } = req.query;
    let projects;
    if (category && category !== 'All') {
      const stmt = db.prepare('SELECT * FROM projects WHERE category = ? ORDER BY id DESC');
      projects = stmt.all(category);
    } else {
      const stmt = db.prepare('SELECT * FROM projects ORDER BY id DESC');
      projects = stmt.all();
    }
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id - single project details
app.get('/api/projects/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/contact - submit new message into database
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), email.trim(), (subject || 'General Inquiry').trim(), message.trim());

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been saved in the database.',
      id: info.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/messages - view received inquiries (for Stuti to check inbox/leads)
app.get('/api/messages', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM messages ORDER BY id DESC');
    const messages = stmt.all();
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/messages/:id - delete message
app.delete('/api/messages/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/health - comprehensive frontend & backend & DB health check
app.get('/api/health', (req, res) => {
  try {
    const dbPing = db.prepare('SELECT 1 as ping').get();
    const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const messageCount = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;

    res.json({
      status: 'healthy',
      service: 'UI/UX Portfolio API',
      database: {
        healthy: dbPing && dbPing.ping === 1,
        engine: 'SQLite (portfolio.db)',
        projectsCount: projectCount,
        messagesCount: messageCount
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/stats - live metrics
app.get('/api/stats', (req, res) => {
  try {
    const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const messageCount = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
    res.json({
      success: true,
      data: {
        projects: projectCount,
        inquiries: messageCount,
        database: 'SQLite (Active & Connected)'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend for all unmatched routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Server running at http://0.0.0.0:${PORT}`);
  console.log(`📦 Database connected: SQLite (${dbPath})`);
});
