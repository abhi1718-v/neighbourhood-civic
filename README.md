# Neighborhood Civic Issue Reporter

A beginner-friendly full-stack civic reporting MVP built with React, Django REST Framework, and Supabase.

## Features
- Register and log in using Django token authentication
- Report potholes, broken streetlights, garbage, and other civic issues
- Add a description, ward, GPS coordinates, and photo
- Browse, search, and filter reports
- View report details and status history
- Municipal staff can update status and escalate unresolved reports through Django admin
- Supabase Storage for photos (optional); local media storage works without Supabase

## Project structure
- `backend/` Django REST API, models, admin, authentication, and storage integration
- `frontend/` React + Vite interface with Leaflet map
- `.env.example` backend configuration template

## Requirements
- Python 3.10+
- Node.js 18+
- A Supabase project (optional for local development; recommended for hosted database and image storage)

## 1. Backend setup
Open a terminal in `backend/`:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations reports
python manage.py migrate
python manage.py seed_initial_data
python manage.py createsuperuser
python manage.py runserver
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Backend runs at `http://127.0.0.1:8000/`.
Admin dashboard: `http://127.0.0.1:8000/admin/`.

## 2. Frontend setup
Open another terminal in `frontend/`:

```bash
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use `cp .env.example .env`.

Frontend runs at `http://localhost:5173/`.

## 3. Supabase setup (optional)
1. Create a Supabase project.
2. In Project Settings -> API, copy the Project URL and `service_role` key.
3. Create a Storage bucket named `civic-attachments` and set it to **public** so report photos can be displayed by the web app.
4. Put values in `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET=civic-attachments`
5. For Supabase PostgreSQL, copy the connection string from Project Settings -> Database and set `DATABASE_URL` in `backend/.env`. Use the pooler connection string if your network requires it.

**Important:** Never put the Supabase service-role key in the React frontend or commit `.env` files. The backend uses it only for server-side uploads. If Supabase settings are empty, uploaded files are saved locally in `backend/media/`.

## 4. First run
- Register a resident account in the React app.
- Create a report and allow location access, or enter latitude and longitude manually.
- Open Django admin and log in with your superuser to manage wards, categories, reports, and issue updates.
- To make a municipal staff account, create a user in Django admin and set `is_staff = True`. Staff users can update reports through the admin dashboard.

## API overview
- `GET /api/categories/` - list categories
- `GET /api/wards/` - list municipal wards
- `GET /api/reports/` - list reports
- `POST /api/reports/` - create a report (authenticated; multipart form data)
- `GET /api/reports/<id>/` - report detail
- `GET /api/reports/<id>/updates/` - status history
- `POST /api/reports/<id>/update_status/` - staff-only status update
- `POST /api/auth/register/` - register
- `POST /api/auth/login/` - obtain auth token
- `GET /api/auth/me/` - current user

## Notes
- This is a functional academic MVP, not a production municipal deployment.
- Before real public deployment, configure HTTPS, email verification, rate limiting, spam protection, private media access, backups, and an official ward boundary dataset.
- The included ward list is sample data. Replace it with your municipality's official ward list.
