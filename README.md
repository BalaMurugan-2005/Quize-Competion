# Quizora — Quiz Competition Management System

A production-ready full-stack Quiz Competition Management System.

## Features
- **Secure JWT Authentication**: Role-based access for Participants and Organizers (Admins).
- **Progressive Saved Submissions**: Auto-saves participant progress during live exams.
- **Dynamic Timer System**: Auto-finalizes user assessments when countdown timer expires.
- **Admin Control Center**: Start/End rounds, create/manage MCQ questions, view real-time participant logs.
- **Automatic Scoring & Leaderboard**: Calculates user score checks, sets qualification thresholds.
- **Confetti Celebration Podium**: Displays first, second, and third winners with custom animations.
- **OpenPyXL Excel Exports**: One-click download of all participant records, scores, and answer sheets.

---

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Vite, Axios
- **Backend**: Django, Django REST Framework, PostgreSQL
- **Database**: PostgreSQL (Production) / SQLite (Local development default)

---

## Getting Started

### Local Backend Setup
1. Open terminal in the `backend` directory.
2. Build/activate your virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Perform migrations:
   ```bash
   python manage.py makemigrations quiz
   python manage.py migrate
   ```
5. Create a Superuser/Admin account:
   ```bash
   python manage.py createsuperuser
   ```
6. Seed the base rounds in your database:
   Run the django shell:
   ```bash
   python manage.py shell
   ```
   Execute the following seeding commands:
   ```python
   from quiz.models import Round
   Round.objects.get_or_create(id=1, name="Round 1")
   Round.objects.get_or_create(id=2, name="Round 2")
   Round.objects.get_or_create(id=3, name="Final Round")
   exit()
   ```
7. Start development server:
   ```bash
   python manage.py runserver
   ```

### Local Frontend Setup
1. Open terminal in the `frontend` directory.
2. Install npm modules:
   ```bash
   npm install
   ```
3. Boot the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access client in browser at `http://localhost:5173`.

---

## Production Deployment

### Backend Deployment (Render)
1. Register/Login on [Render.com](https://render.com).
2. Create a new **PostgreSQL database instance** and copy the Connection URL string.
3. Launch a new **Web Service** pointing to your Github backend repository folder.
4. Set settings config values:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
5. Configure environment variables (`Environment` tab):
   - `SECRET_KEY`: A secure random password string
   - `DEBUG`: `False`
   - `DATABASE_URL`: Connection string of Render PostgreSQL instance
   - `ALLOWED_HOSTS`: Your Render hostname string, `localhost`
   - `CORS_ALLOWED_ORIGINS`: Vercel frontend app URL

### Frontend Deployment (Vercel)
1. Add your repository on [Vercel](https://vercel.com).
2. Set directory root to the `frontend` folder.
3. Configure settings variable:
   - `VITE_API_URL`: Your rendered backend API url prefix (e.g. `https://your-backend.onrender.com/api/`)
4. Deploy. Vercel automatically reads `vercel.json` for single-page client routes support.
