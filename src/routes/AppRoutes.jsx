import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Restaurants from '../pages/Restaurants';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Admin from '../pages/Admin';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
