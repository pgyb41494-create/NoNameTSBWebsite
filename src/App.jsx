import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { LoginGate } from "./components/LoginGate";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Blacklist from "./pages/Blacklist";
import Trainers from "./pages/Trainers";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="shell">
          <Navbar />
          <main className="grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/blacklist"
                element={
                  <LoginGate>
                    <Blacklist />
                  </LoginGate>
                }
              />
              <Route
                path="/trainers"
                element={
                  <LoginGate>
                    <Trainers />
                  </LoginGate>
                }
              />
              <Route
                path="/report"
                element={
                  <LoginGate>
                    <Report />
                  </LoginGate>
                }
              />
              <Route path="/wars" element={<Navigate to="/" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
