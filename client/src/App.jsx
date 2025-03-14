// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import TicketAdd from "./pages/TicketAdd";
import TicketDetail from "./pages/TicketDetail";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import DeviceManagement from "./pages/DeviceManagement";
import Operations from "./pages/Operations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/add" element={<TicketAdd />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/deviceManagement" element={<DeviceManagement />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
          {/* Toast notification container */}
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
