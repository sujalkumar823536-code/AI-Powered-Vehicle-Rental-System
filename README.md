# DriveEasy: AI-Powered Vehicle Rental System

A full-stack vehicle rental platform where customers can browse cars and bikes, book them online, or simply chat with an AI assistant that recommends a vehicle, answers rental-policy questions and books it for them.

## Features

- **Browse vehicles**: cars and bikes with price per day, seats, fuel type and details page
- **Authentication**: register / login with JWT
- **Bookings**: book a vehicle for a date range, with date and availability checks, and view them under *My bookings*
- **AI rental assistant**
  - Answers rental-policy questions using RAG (policies are retrieved from a vector store)
  - Recommends vehicles from the live inventory with prices
  - Books a vehicle for the logged-in customer through LLM tool calling, after the customer confirms vehicle, dates and total price
- **Safe by design**: the booking is made by the backend, not the model. The user identity comes from the JWT, and every booking goes through the same validation as the normal booking flow

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Auth | JWT (python-jose), bcrypt |
| AI | LangChain, LLM API, vector database for RAG |
| Deployment | Render / AWS |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/routes/          # auth, vehicles, bookings, chat
│   │   ├── ai/                  # LLM, prompts, vector store, rag_chain (tool calling)
│   │   ├── core/                # config, database, security (JWT)
│   │   ├── services/            # booking logic shared by the API and the assistant
│   │   └── schemas/             # Pydantic models
│   └── requirements.txt
├── frontend/
│   ├── src/                     # pages, components (Navbar, ChatWidget), AuthContext
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A MongoDB database (local or Atlas)
- An API key for your LLM provider

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env` (see `.env.example`):

```env
MONGODB_URL=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
LLM_API_KEY=your-llm-api-key
```

Run the server:

```bash
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000` and interactive docs are at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## How the AI Booking Works

1. The customer chats, for example: "I need a car for 3 days starting tomorrow."
2. The assistant recommends vehicles from the live inventory and collects the vehicle and dates.
3. It summarises vehicle, dates and total price, and asks the customer to confirm.
4. After a clear "yes", the model calls the `create_booking` tool.
5. The backend validates the request (dates, availability, clashes) and saves the booking for the authenticated user.
6. If the customer isn't logged in, the assistant asks them to log in first.

## Roadmap

- Payment integration
- Email confirmation for bookings
- Admin dashboard for managing vehicles
- Deployment on Render / AWS

## Author

**Sujal Kumar**: final-year B.Tech CSE student, KIIT
