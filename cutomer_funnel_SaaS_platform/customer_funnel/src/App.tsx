import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MaintenanceGuard } from "./components/MaintenanceGuard";

import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <MaintenanceGuard>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </MaintenanceGuard>
  );
}