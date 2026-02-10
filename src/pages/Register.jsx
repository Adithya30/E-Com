import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Phone, Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Basic Validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // 2. Sign Up with Extra Data (Metadata)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      alert("Registration Successful! You can now log in.");
      navigate('/login');

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Right Side - Form (Swapped for Register) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-bg order-2 lg:order-1 h-full min-h-screen">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-10 lg:hidden">
            <Leaf size={48} className="text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold font-heading text-primary-900">Kerala Kissan Kendra</h2>
          </div>

          <h2 className="text-3xl font-bold mb-2 font-heading text-gray-800">Create Account</h2>
          <p className="text-gray-500 mb-8">Join our community of plant lovers.</p>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                name="password"
                type="password"
                placeholder="Password (Min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full !rounded-lg mt-4"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Left Side - Image (Order 2 on Mobile, but hidden) */}
      <div className="hidden lg:flex w-1/2 bg-secondary-light relative items-center justify-center overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?q=80&w=2070&auto=format&fit=crop"
            alt="Nature"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <div className="relative z-10 text-white p-12 max-w-lg">
          <Leaf size={64} className="text-primary-800 mb-8" />
          <h1 className="text-5xl font-bold font-heading mb-6 text-primary-900">Join the Movement</h1>
          <p className="text-xl text-primary-900 font-medium leading-relaxed">
            Be part of a community that cares about nature. Get exclusive access to rare plants and gardening tips.
          </p>
        </div>
      </div>
    </div>
  );
}