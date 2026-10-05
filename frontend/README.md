# DriveEasy Frontend (React + Vite)

```bash
npm install
cp .env.example .env     # set VITE_API_URL
npm run dev              # http://localhost:5173
```

Vehicle pages fall back to mock data in `src/data/mockVehicles.js` when the
FastAPI backend is not running.

## Backend endpoints this frontend expects
| Method | Path | Notes |
|---|---|---|
| POST | /auth/register | `{ name, email, password }` |
| POST | /auth/login | `{ email, password }` -> `{ access_token, user }` |
| GET | /vehicles, /vehicles/{id} | |
| POST | /bookings | `{ vehicleId, startDate, endDate }` |
| GET | /bookings/me | each item: `id, vehicleName, startDate, endDate, totalPrice` |
| DELETE | /bookings/{id} | |
| POST | /chat | `{ message, history }` -> `{ reply }` |
