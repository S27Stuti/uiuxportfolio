# Stuti | Premium UI/UX Portfolio with SQLite Backend

An ultra-modern, dark-luxury portfolio tailored for a UI/UX Designer featuring a complete **Express + SQLite** database backend.

---

## ✨ Features
- **Modern Premium UI/UX**: Designed with dark obsidian aesthetics, ambient glow gradients, frosted glassmorphism, and responsive typography (Plus Jakarta Sans & Poppins).
- **Embedded SQLite Database (`portfolio.db`)**:
  - Automatically created and pre-seeded on first run.
  - Dynamic projects table and contact inquiries table.
- **REST API Endpoints**:
  - `GET /api/projects`: Fetches projects, supports category filtering (`?category=E-Commerce`).
  - `POST /api/contact`: Validates and saves recruiter & client messages directly to the SQLite database.
  - `GET /api/messages`: Allows reviewing all inquiries received via the contact form.
  - `DELETE /api/messages/:id`: Removes inquiries.
  - `GET /api/stats`: Live database status and metrics.
- **Interactive UI Capabilities**:
  - **Filter Tabs**: Instant filtering by category (All, E-Commerce, Healthcare, Fitness & Mobile).
  - **Case Study Modal**: Full project preview with problem statement, design tools, and Figma launch buttons.
  - **Inquiries Manager Modal**: Click the "Inbox (DB)" button in the top navbar to inspect and reply to stored database leads.
  - **Interactive Contact Form**: Real-time feedback, loading spinner, and success notifications.
  - **Graceful Fallback**: Works seamlessly both via `http://localhost:5000` and offline/double-clicking `index.html`.

---

## 🚀 How to Run

1. Open your terminal in this folder:
   ```bash
   cd "c:\Users\91940\Desktop\UIUX portfolio"
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

3. Open your browser:
   ```text
   http://localhost:5000
   ```

