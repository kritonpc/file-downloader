import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Include this if you want to use CSS

// Create root element for React 18+
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
