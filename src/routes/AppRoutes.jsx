// src/routes/AppRoutes.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import Restaurants from '../pages/Restaurants';
import MartItems from '../pages/MartItems';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import MenuPage from '../pages/MenuPage';
import Checkout from '../pages/Checkout';
import Admin from '../pages/Admin';
import SuperAdmin from '../pages/SuperAdmin';
import CampusAdmin from '../pages/CampusAdmin';
import Unauthorized from '../pages/Unauthorized';
import Demo from '../pages/Demo';
import ProtectedRoute from '../components/ProtectedRoute';
import CampusProtectedRoute from '../components/CampusProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

function AppRoutes() {
  const { user, userData, loading } = useAuth();

  // Show loading text while auth is being determined
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
        <div className="text-center">
          <LoadingSpinner message="Loading App..." />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/mart-items" element={<MartItems />} />
        <Route path="/menu/:restaurantId" element={<MenuPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/demo" element={<Demo />} />

        {/* Protected Routes */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="superAdmin">
              <SuperAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/:universityId/:campusId"
          element={
            <CampusProtectedRoute>
              <CampusAdmin />
            </CampusProtectedRoute>
          }
        />

        {/* Legacy admin route - redirect based on role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              {userData?.role === "superAdmin" ? (
                <Navigate to="/super-admin" replace />
              ) : userData?.role === "campusAdmin" ? (
                <Navigate to={`/admin/${userData.universityId}/${userData.campusId}`} replace />
              ) : (
                <Navigate to="/home" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Unauthorized page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
