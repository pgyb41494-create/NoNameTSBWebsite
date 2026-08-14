import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Lineup from "./pages/Lineup";
import Blacklist from "./pages/Blacklist";
import Trainers from "./pages/Trainers";
import Wars from "./pages/Wars";
import Docs from "./pages/Docs";

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <Navbar />
        <main className="grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/lineup" element={<Lineup />} />
            <Route path="/blacklist" element={<Blacklist />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/wars" element={<Wars />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
