import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Imports your router setup

// Import your global CSS (Make sure this file exists, or remove this line if you only use LandingPage.css)
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);