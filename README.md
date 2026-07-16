# Campus Connect Platform

Campus Connect is a robust, full-stack college platform designed to keep students updated on campus events, career opportunities, and personalized AI-driven recommendations. It features real-time notifications via WebSockets, Google OAuth integration, role-based access controls, and a hybrid recommendation engine.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Custom flows and dashboard access for `Students`, `Society Admins`, and `College Admins`.
*   **AI-Powered Recommendations:** Custom hybrid recommendation engine blending content-based TF-IDF vector math and collaborative filtering with OpenAI GPT model APIs to suggest matching events and internships.
*   **Real-time Synchronization:** Dynamic attendees counts, application reviews, and real-time push alerts via WebSockets (`Socket.io`).
*   **Bookmarks & Tracking:** Saved events/internships and student job application progress dashboards.
*   **DevOps Ready:** Fully containerized setup with multi-stage Docker build files and Compose configurations.

---

## 🛠️ Technology Stack

*   **Frontend:** React, Redux Toolkit, React Query, Axios, Lucide Icons, Vanilla CSS
*   **Backend:** Express, Mongoose, Socket.io, Node-cron, Passport (Google OAuth)
*   **Database:** MongoDB
*   **Caching & Optimization:** In-memory `NodeCache` with custom TTL limits
*   **Deployment:** Docker, Nginx, GitHub Actions CI

---

## 🏗️ Architecture

```
campus-connect/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Passport, Socket setups
│   │   ├── controllers/     # Business logic routes controllers
│   │   ├── middleware/      # Guards, RBAC, Validation schemas, Errors
│   │   ├── models/          # User, Event, Internship, Notification schemas
│   │   ├── routes/          # API Route maps
│   │   ├── services/        # AI Recommendations, Vector math, Sockets handlers
│   │   └── utils/           # JWT, Cron schedulers
│   ├── server.js            # Entry Point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Route guards
│   │   ├── hooks/           # WebSockets useSocket hook
│   │   ├── pages/           # Home, Login, Profile, AdminPanel, EventDetail, Careers
│   │   ├── services/        # Axios API wrapper configs
│   │   └── store/           # Redux state slices
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🔧 Local Setup

### Prereqs
*   Node.js v18+
*   MongoDB running locally on port 27017

### 1. Backend Config
1.  Navigate to `backend` directory.
2.  Create a `.env` file based on `.env.example`:
    ```env
    PORT=5000
    NODE_ENV=development
    MONGODB_URI=mongodb://localhost:27017/campus-connect
    JWT_ACCESS_SECRET=your_jwt_access_secret_key
    JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
    OPENAI_API_KEY=your_openai_api_key
    CLIENT_URL=http://localhost:5173
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run in development:
    ```bash
    npm run dev
    ```

### 2. Frontend Config
1.  Navigate to `frontend` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run Vite development server:
    ```bash
    npm run dev
    ```

---

## 🐳 Docker Deployment

To build and run all services (Frontend, Backend, MongoDB) inside containers:

```bash
# In the project root:
docker-compose up --build
```
The application will be accessible at:
*   **Frontend Web App:** [http://localhost](http://localhost) (mapped on port 80)
*   **Backend Server API:** [http://localhost:5000](http://localhost:5000)
