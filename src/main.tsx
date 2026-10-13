import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css"; // Ensure this matches the exact name of your CSS file!

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);