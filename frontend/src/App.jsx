import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import CategoryPage from './pages/admin/CategoryPage';
import OrdersPage from './pages/admin/OrdersPage';
import TablesPage from './pages/admin/TablesPage';
import ThemeSettingsPage from './pages/admin/ThemeSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/register" element={<RegisterPage />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/menu" element={
        <ProtectedRoute>
          <MenuManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute>
          <CategoryPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/tables" element={
        <ProtectedRoute>
          <TablesPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/theme" element={
        <ProtectedRoute>
          <ThemeSettingsPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;