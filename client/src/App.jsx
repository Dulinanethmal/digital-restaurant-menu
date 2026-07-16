import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./Admin"; // Imports your Admin.jsx file
import User from "./User";   // Imports your new User.jsx file

export default function App() {
  return (
    <Router>
      <Routes>
        {/* The home route (/) now loads the Admin page first! */}
        <Route path="/" element={<Admin />} />
        
        {/* You can still keep /admin working as well */}
        <Route path="/admin" element={<Admin />} />
        
        {/* The customer menu is now moved to the /user route */}
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
}