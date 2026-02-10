import { Leaf, Truck, ShieldCheck, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const features = [
    {
      icon: <Truck size={32} className="text-primary-600" />,
      title: "Fast Delivery",
      desc: "Get your plants delivered to your doorstep within 24-48 hours."
    },
    {
      icon: <ShieldCheck size={32} className="text-primary-600" />,
      title: "Quality Guarantee",
      desc: "We ensure all plants are healthy and fresh upon arrival."
    },
    {
      icon: <Leaf size={32} className="text-primary-600" />,
      title: "Eco-Friendly",
      desc: "Our packaging is 100% biodegradable and earth-friendly."
    },
    {
      icon: <Heart size={32} className="text-primary-600" />,
      title: "Plant Care Support",
      desc: "Lifetime support for all your plant parenting queries."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center bg-neutral-bg overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-100/30 rounded-bl-[100px] z-0"></div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-secondary-light/20 rounded-full blur-2xl"></div>

        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="animate-slide-up">
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-800 text-sm font-bold rounded-full mb-6">
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-neutral-text leading-tight mb-6">
              Bring Nature <br />
              <span className="text-primary-600">Into Your Home</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
              Discover our curated collection of indoor and outdoor plants that purify the air and uplift your mood.
            </p>
            <div className="flex gap-4">
              <Button to="/shop" variant="primary">Shop Now</Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in delay-200 hidden md:block">
            {/* Hero Image */}
            <div className="relative z-10 bg-white/30 backdrop-blur-sm rounded-full p-8 border border-white/50 shadow-soft">
              <img
                src="https://images.pexels.com/photos/15176013/pexels-photo-15176013.jpeg"
                alt="Beautiful Plant"
                className="w-full h-auto rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 rounded-3xl bg-neutral-bg border border-gray-100 hover:shadow-hover transition-all duration-300 group">
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-heading mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories (Placeholder for now) */}
      <section className="py-20 bg-neutral-bg">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold font-heading mb-4">Shop by Category</h2>
          <p className="text-gray-600 mb-12">Find the perfect plant for your space.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Real Unsplash Images */}
            {[
              { name: 'Indoor', displayName: 'Indoor Plants', img: 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=1000&auto=format&fit=crop' },
              { name: 'Outdoor', displayName: 'Outdoor Plants', img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop' },
              { name: 'All', displayName: 'Accessories', img: 'https://images.pexels.com/photos/4505162/pexels-photo-4505162.jpeg' }
            ].map((cat, i) => (
              <div
                key={i}
                onClick={() => navigate('/shop', { state: { category: cat.name } })}
                className="group relative overflow-hidden rounded-3xl h-80 cursor-pointer shadow-md"
              >
                <img
                  src={cat.img}
                  alt={cat.displayName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <h3 className="text-3xl font-bold text-white font-heading">{cat.displayName}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}