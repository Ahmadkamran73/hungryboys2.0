// src/routes/AppRoutes.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import Restaurants from '../pages/Restaurants';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import MenuPage from '../pages/MenuPage';
import Checkout from '../pages/Checkout';
import Admin from '../pages/Admin'; // Ensure this matches your actual file name
import PrivateRoute from '../components/PrivateRoute'; // Make sure this file exists

function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />


        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/menu/:restaurantId" element={<MenuPage />} />



        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
