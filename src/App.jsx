import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ShopProvider } from './context/ShopContext';
import { ToastProvider } from './context/ToastContext';
import Register from './pages/Register';
// Import your real pages
import AdminDashboard from './pages/AdminDashboard';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Home from './pages/Home';

export default function App() {
  return (
    <ShopProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/track" element={<OrderTracking />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ShopProvider>
  );
}