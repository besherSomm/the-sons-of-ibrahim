# Sons of Ibrahim - Upload Backend (local)

This folder contains a minimal Express backend to accept application uploads from the website and store metadata in a local SQLite database.

Quick start (Windows):

1. Open a terminal in this directory (where `package.json` is located).
2. Install dependencies:

```powershell
npm install
```

3. Copy `.env.example` to `.env` and set your API key:

```powershell
copy .env.example .env
```

Edit `.env`:
```
UPLOAD_API_KEY=your-secret-key-here
PORT=3000
```

4. Start the server:

```powershell
npm start
```

5. The website form (in `sonsofibrahim.html`) posts to `http://localhost:3000/upload` by default.

6. **Admin Panel**: Open `http://localhost:3000/admin.html` to view, search, paginate, and manage uploaded applications.

## Usage

### Upload an Application via Admin Panel

1. Open `http://localhost:3000/admin.html` in your browser.
2. Fill out the **Upload New Application** form at the top:
   - **Your name** — Name of the developer/uploader
   - **Your email** — Contact email
   - **Application name** — Name of the app
   - **Short description** — Brief description of the app
   - **API key** — Enter the API key from your `.env` file (e.g., `admin-secret-2026`)
   - **File** — Select an `.apk`, `.zip`, `.aab`, or `.jar` file
3. Click **Upload** and watch the progress bar
4. Once successful, the new app appears in the table below and on the website

### View and Download Applications on Website

1. Open `http://localhost:3000/sonsofibrahim.html` in your browser.
2. Click **"Our Applications"** in the navigation menu.
3. Browse the uploaded applications gallery with:
   - App icon and developer name
   - File size, type, and upload date
   - Description
4. Click the **Download** button to download any application.

### Manage Applications in Admin Panel

**Search & Filter:**
- Use the search box to filter by app name, description, email, or developer name.
- Results update instantly.

**Pagination:**
- Navigate through pages using the **< Prev**, page numbers, and **Next >** buttons.
- Each page shows 10 applications by default.

**Delete Applications:**
- Click the **trash icon** in the Actions column to delete an app.
- The file is automatically removed from storage.

**View Details:**
- Each row shows: ID, App Name, Uploader, Email, File info, Size, Upload Date, and Actions.

### API Usage (for integrations)

**Upload a file:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "x-api-key: admin-secret-2026" \
  -F "name=Developer Name" \
  -F "email=dev@example.com" \
  -F "appName=MyApp" \
  -F "description=My test app" \
  -F "appFile=@/path/to/app.apk"
```

**Get applications (with pagination and search):**
```bash
curl "http://localhost:3000/applications?page=1&limit=20&search=MyApp"
```

**Delete an application:**
```bash
curl -X DELETE http://localhost:3000/applications/1
```

**Download a file:**
```
GET http://localhost:3000/uploads/{filename}
```

Notes:
- Uploaded files are stored in the `uploads/` folder.
- Metadata is stored in `data/apps.db` (SQLite).
- The frontend upload form includes an optional "API key" field. If you set `UPLOAD_API_KEY` in `.env`, submissions must include the correct key.

API Endpoints:

- `POST /upload` — Upload a file (supports multipart/form-data, requires `apiKey` header or form field if API key is enabled).
- `GET /applications?page=1&limit=20&search=query` — List applications with pagination and search.
- `DELETE /applications/:id` — Remove an application and delete the file.
- `GET /uploads/*` — Static file serving for direct download.

API key (optional):
- To restrict uploads, set the `UPLOAD_API_KEY` environment variable in `.env`.
- The frontend will post the value from the "API key" field as either a header `x-api-key` or form field `apiKey`.
- If a key is configured and no key (or wrong key) is provided, the upload is rejected with a 401 error.

Docker:
1. Build the image:

```powershell
docker build -t sonsibrahim-apps .
```

2. Run container (persist uploads/data):

```powershell
docker run -p 3000:3000 -v %cd%/uploads:/app/uploads -v %cd%/data:/app/data -e UPLOAD_API_KEY="yourkey" sonsibrahim-apps
```

Production Notes:
- Use a reverse proxy (NGINX, IIS) in front for HTTPS and load balancing.
- Consider a managed DB (PostgreSQL, MySQL) for scalability.
- Add authentication/rate-limiting for the admin panel.
- Scan uploaded files for malware (ClamAV or similar).
- Use object storage (S3, Blob) instead of local filesystem for cloud deployments.

