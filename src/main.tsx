import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/authContext"; // ✅ Import the provider
import { ReactQueryClientProvider } from "./providers/query-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ReactQueryClientProvider>
        <App />
      </ReactQueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
