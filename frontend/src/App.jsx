import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import MyBookings from "./pages/MyBookings.jsx";

export default function App() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const fullBleed = pathname === "/" || pathname === "/vehicles";

  return (
    <>
      {pathname === "/" && (
        <Navbar user={user} onLogout={logout} />
      )}

      <main className={fullBleed ? undefined : "container"}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/vehicles" element={<Vehicles />} />

          <Route
            path="/vehicles/:id"
            element={<VehicleDetail />}
          />

          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<p>Page not found.</p>}
          />
        </Routes>
      </main>

      <ChatWidget />
    </>
  );
}