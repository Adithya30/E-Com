import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Leaf } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // REPLACE THIS WITH YOUR ACTUAL ADMIN EMAIL
  const ADMIN_EMAIL = "admin@greennest.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      // Superuser Check
      if (data.user.email === ADMIN_EMAIL) {
        navigate('/admin');
      } else {
        navigate('/'); // Regular users go to Home
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 bg-primary-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=2070&auto=format&fit=crop"
            alt="Plant"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="relative z-10 text-white p-12 max-w-lg">
          <Leaf size={64} className="text-secondary mb-8" />
          <h1 className="text-5xl font-bold font-heading mb-6">Welcome Back</h1>
          <p className="text-xl text-primary-100 leading-relaxed">
            Continue your journey to a greener home. Sign in to access your saved plants and order history.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-bg">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-10 lg:hidden">
            <Leaf size={48} className="text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold font-heading text-primary-900">Kerala Kissan Kendra</h2>
          </div>

          <h2 className="text-3xl font-bold mb-2 font-heading text-gray-800">Sign In</h2>
          <p className="text-gray-500 mb-8">Enter your details to access your account.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">Password</label>
                {/* <a href="#" className="text-sm text-primary-600 hover:text-primary-800">Forgot password?</a> */}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full !rounded-lg !bg-green-600 hover:!bg-green-700 !text-white shadow-lg shadow-green-600/30"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-primary-600 font-bold hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}