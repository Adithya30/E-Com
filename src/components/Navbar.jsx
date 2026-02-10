import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Leaf, LogOut, User, Menu, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './ui/Button';

export default function Navbar() {
  const { cartItems } = useShop();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // REPLACE THIS WITH YOUR ACTUAL ADMIN EMAIL
  const ADMIN_EMAIL = "admin@greennest.com";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    // { name: 'Track Order', path: '/track' }, // Moved to conditional
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 ${scrolled ? 'py-3' : 'py-4'
      }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">

        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 text-2xl font-bold font-heading text-primary-800"
        >
          <Leaf className="text-primary-600" /> Kerala Kissan Kendra
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-sm font-bold text-gray-700 hover:text-primary-700 tracking-wide transition-colors duration-300"
            >
              {link.name}
            </Link>
          ))}

          {/* Conditional Link for Logged In Users */}
          {user && (
            <Link
              to="/track"
              className="text-sm font-bold text-gray-700 hover:text-primary-700 tracking-wide transition-colors duration-300"
            >
              Track Order
            </Link>
          )}

          {/* USER SECTION */}
          {user ? (
            <div className="flex items-center gap-4">
              {/* Show Admin Button ONLY if Superuser */}
              {user.email === ADMIN_EMAIL && (
                <Link to="/admin" className="text-xs bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-bold border border-primary-200">
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-2 text-primary-900 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-200/50 shadow-sm">
                <User size={16} className="text-primary-600" />
                <span className="text-sm font-bold">{user.email.split('@')[0]}</span>
              </div>

              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-primary-700 transition-colors">
                Log In
              </Link>
              <Button to="/register" variant="primary" className="!bg-green-600 hover:!bg-green-700 !text-white !px-6 !py-2 !text-sm !font-bold shadow-lg shadow-green-600/30">
                Sign Up
              </Button>
            </div>
          )}

          {/* Cart Icon */}
          <Link to="/checkout" className="relative group text-gray-700 hover:text-primary-700 transition">
            <div className="p-2 bg-gray-100 group-hover:bg-primary-50 rounded-full transition-colors">
              <ShoppingCart size={20} />
            </div>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold text-white rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-primary-800"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg p-6 flex flex-col gap-4 animate-slide-up border-t border-primary-100">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-lg font-medium text-primary-800 py-2 border-b border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div className="mt-4 flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-primary-800 mb-2">
                  <User size={18} />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full justify-center">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-center font-bold text-primary-800 py-2" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Button to="/register" variant="primary" className="w-full justify-center" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Button>
              </>
            )}
            <Link to="/checkout" className="flex items-center gap-2 text-primary-800 py-2 font-medium" onClick={() => setIsMenuOpen(false)}>
              <ShoppingCart size={20} /> Cart ({cartItems.length})
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}