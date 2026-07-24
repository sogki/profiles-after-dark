import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SiteClosingPage from "./components/SiteClosingPage.tsx";
import "./index.css";
import { AuthProvider } from "./context/authContext"; // ✅ Import the provider
import { ReactQueryClientProvider } from "./providers/query-provider.tsx";
import { HelmetProvider } from "react-helmet-async";
import { SITE_CLOSED } from "./siteStatus";

// Initialize theme from localStorage on app load
const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      {SITE_CLOSED ? (
        <SiteClosingPage />
      ) : (
        <AuthProvider>
          <ReactQueryClientProvider>
            <App />
          </ReactQueryClientProvider>
        </AuthProvider>
      )}
    </HelmetProvider>
  </StrictMode>
);
