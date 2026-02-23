# Sons of Ibrahim - Website Structure

## Overview
A dark-themed, multilingual (English/Arabic) website dedicated to Abrahamic genealogical history with app distribution and book management.

## Pages & Routes
- **#home** - Homepage with quick navigation
- **#bani-israel** - Bani Israel (Children of Israel) history & tribes
- **#arab-tribes** - Arab tribes genealogy  
- **#dna** - DNA & Genetics research
- **#apps** - Our Applications gallery (dynamically loaded)
- **#books** - Books & Resources (dynamically loaded)
- **#download** - Download official app
- **#api-docs** - Developer API documentation
- **#about** - About us, mission, contact info

## Core Features

### 1. Books Management
- **API**: `GET /books` (paginated), `POST /books`, `DELETE /books/:id`
- **Database**: SQLite with columns: id, author, email, bookTitle, description, filename, originalName, mimetype, size, bookLink, isExternal, created_at
- **Modes**: 
  - Local uploads (files stored in `/uploads`)
  - External links (e.g., Archive.org)
- **Admin Panel**: Upload or add external book links
- **Website Display**: Card view with Details modal

### 2. Applications Management
- **API**: `GET /applications` (paginated), `POST /upload`
- **File Storage**: `/uploads` directory with URL-encoded filenames
- **Admin Panel**: Upload APK/ZIP files with metadata
- **Website Display**: App showcase gallery with Details modal

### 3. Details Modal
- Triggered by "Details" button on any book/app card
- Shows full information in a centered modal dialog
- Closes via Esc key, close button, or clicking backdrop

### 4. Multilingual Support
- English (en) / Arabic (ar)
- Toggle via language switcher in navbar
- Data attributes: `data-en` and `data-ar` on elements

### 5. Responsive Dark Theme
- CSS Variables for consistent theming
- Mobile-friendly navigation with hamburger menu
- Smooth animations and transitions

## File Structure
```
website/
├── server.js           # Express backend, routes, database
├── db.js               # SQLite database initialization
├── sonsofibrahim.html  # Main website (all-in-one file)
├── admin.html          # Admin panel for uploads
├── data/
│   └── apps.db        # SQLite database
└── uploads/           # Uploaded files (APKs, books, etc.)
```

## Key JavaScript Functions

### Router
```javascript
router(page)  // Navigate to page with hash (#page)
```

### Books
```javascript
window.loadBooks()           // Fetch & display books on Books page
window.formatFileSize(bytes) // Convert bytes to KB/MB
window.escapeHtml(text)      // HTML entity escape
```

### Details Modal
```javascript
window.showDetail(type, item) // type: 'book' or 'app'
                              // item: object with title, author, etc.
```

## API Endpoints

### Books
- `GET /books?page=1&limit=100` - List books (paginated)
- `POST /books` - Create book (multipart or JSON)
  - Multipart: file upload
  - JSON: `{bookTitle, author, email, description, bookLink}`
- `DELETE /books/:id` - Delete book

### Applications
- `GET /applications?page=1&limit=100` - List apps (paginated)
- `POST /upload` - Upload app (multipart)
  - Fields: appName, name, description, appFile, apiKey (optional)

## Common Issues & Fixes

1. **Pages not displaying** → Router calls `router(page)` on hash change
2. **Books/Apps empty** → Check API response in Network tab (F12)
3. **Footer overlapping** → Router ensures footer stays visible with relative positioning
4. **Details modal not closing** → Check if `showDetail()` function exists globally
5. **Multilingual text not updating** → Call `setLanguage(lang)` after DOM changes

## Testing Checklist
- [ ] Home page loads
- [ ] Navbar navigation works
- [ ] Language toggle switches EN/AR
- [ ] Books page shows book cards
- [ ] Apps page shows app cards
- [ ] Details buttons open modal
- [ ] Modal closes on Esc/click backdrop
- [ ] About page displays all content
- [ ] Footer visible on all pages
- [ ] Admin panel file upload works
- [ ] Responsive design on mobile (Ctrl+Shift+M)

## Running the Server
```bash
cd C:\Users\beshe\Desktop\website
node server.js
# Opens on http://localhost:3000
```

## Browser Console
Should be **clean** (no errors when navigating pages). All console.logs removed in production version.
