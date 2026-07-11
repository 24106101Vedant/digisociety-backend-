# DigiSociety Backend API

Node.js + Express REST API with SQLite storage (pure-JS `sql.js` — no native build tools required).

## Quick Start

```bash
# 1. Go into the backend folder
cd backend

# 2. Install dependencies (first time only)
npm install

# 3. Start the server  (auto-seeds admin user on first run)
node server.js
```

Server runs on **http://localhost:4000**

---

## Default Admin Account

| Field    | Value                          |
|----------|-------------------------------|
| Email    | kirtane.vedant1@gmail.com     |
| Password | Vedu@2004                     |
| Role     | admin                         |

---

## API Endpoints

### Auth
| Method | Path                        | Auth required | Description              |
|--------|-----------------------------|---------------|--------------------------|
| POST   | /api/auth/login             | No            | Login, returns JWT token |
| GET    | /api/auth/me                | Yes           | Get current user profile |
| POST   | /api/auth/logout            | Yes           | Logout (stateless)       |
| POST   | /api/auth/forgot-password   | No            | Request password reset   |

### Admin (requires admin JWT)
| Method | Path                     | Description              |
|--------|--------------------------|--------------------------|
| GET    | /api/admin/dashboard     | Stats + recent logins    |
| GET    | /api/admin/users         | List all users           |
| POST   | /api/admin/users         | Create a new user        |
| PUT    | /api/admin/users/:id     | Update user details      |
| DELETE | /api/admin/users/:id     | Deactivate a user        |
| GET    | /api/admin/login-logs    | Recent login attempts    |

### Health
| Method | Path         | Description    |
|--------|--------------|----------------|
| GET    | /api/health  | Server status  |

---

## Login Request Example

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "kirtane.vedant1@gmail.com",
  "password": "Vedu@2004"
}
```

**Response:**
```json
{
  "success": true,
  "token": "<JWT>",
  "user": {
    "id": 1,
    "email": "kirtane.vedant1@gmail.com",
    "full_name": "Vedant Kirtane",
    "role": "admin"
  }
}
```

Use the returned `token` in subsequent requests:
```
Authorization: Bearer <JWT>
```

---

## Project Structure

```
backend/
├── server.js          ← Express app entry point
├── .env               ← Port, JWT secret, DB path
├── package.json
├── db/
│   └── database.js    ← sql.js wrapper (open/save SQLite)
├── middleware/
│   └── auth.js        ← JWT verification middleware
├── routes/
│   ├── auth.js        ← /api/auth/*
│   └── admin.js       ← /api/admin/*
├── scripts/
│   └── seed.js        ← Manual seed script (optional)
└── data/
    └── digisociety.db ← SQLite file (auto-created)
```
