import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import LoginPage from './pages/admin/LoginPage';
import RestaurantInquiryPage from './pages/public/RestaurantInquiryPage';
import DashboardPage from './pages/admin/DashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import CategoryPage from './pages/admin/CategoryPage';
import OrdersPage from './pages/admin/OrdersPage';
import TablesPage from './pages/admin/TablesPage';
import ThemeSettingsPage from './pages/admin/ThemeSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import SuperAdminLayout from './pages/superAdmin/SuperAdminLayout';
import SuperAdminDashboardPage from './pages/superAdmin/SuperAdminDashboardPage';
import SuperAdminUsersPage from './pages/superAdmin/SuperAdminUsersPage';
import SuperAdminCreateUserPage from './pages/superAdmin/SuperAdminCreateUserPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      {/* Any unmatched URL (e.g. the removed /admin/register) lands on login */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      {/* Public — restaurant owners interested in a QR menu panel */}
      <Route path="/restaurant-inquiry" element={<RestaurantInquiryPage />} />

      {/* Platform Super Admin area — requires the super_admin role */}
      <Route
        path="/super-admin"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout>
              <SuperAdminDashboardPage />
            </SuperAdminLayout>
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout>
              <SuperAdminUsersPage />
            </SuperAdminLayout>
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/users/create"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout>
              <SuperAdminCreateUserPage />
            </SuperAdminLayout>
          </SuperAdminRoute>
        }
      />
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