import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import "./styles/global.css";
import "./styles/tokens.css";

import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);