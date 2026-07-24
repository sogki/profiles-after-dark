import { Route, Routes } from "react-router-dom";
import DiscordBotDashboardPage from "./pages/DiscordBotDashboardPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboards/discord-bot" element={<DiscordBotDashboardPage />} />
    </Routes>
  );
}
