import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import User from "./User";
import Login from "./Login";
import LandingPage from "./LandingPage";
import Register from "./Register";
import First from "./First"; 
import OwnerLogin from "./OwnerLogin"; 
import StaffLogin from "./StaffLogin"; // <-- Added StaffLogin import

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        
        {/* Selection and verification flow */}
        <Route path="/first" element={<First />} />
        <Route path="/owner-login" element={<OwnerLogin />} />
        
        {/* NEW: Staff Login Route */}
        <Route path="/staff-login" element={<StaffLogin />} />
        
        {/* Dashboards */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
}