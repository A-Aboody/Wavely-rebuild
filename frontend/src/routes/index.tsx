import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Wave rising effect
      const heroHeight = window.innerHeight;
      const scrollProgress = Math.min(window.scrollY / (heroHeight * 0.7), 1);
      const riseAmount = scrollProgress * -150;
      setWaveOffset(riseAmount);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden">
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl animate-fade-in-up">
          {/* Eyebrow */}
          <div className="inline-block px-5 py-2 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-600 mb-6 uppercase tracking-wider">
            Find Your Wavelength
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight text-gray-900">
            Life's moments deserve
            <br />
            <span className="text-blue-500">to be remembered.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-normal">
            The movie that moved you. The restaurant where everything just clicked. That game you couldn't put down.
            Wavely is where you capture it all—not just to remember, but to understand what makes you, you.
          </p>

          {/* Rotating Feature Text */}
          <div className="h-20 flex items-center justify-center my-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight animate-text-cycle-1">
                Remember everything
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight animate-text-cycle-2">
                Find your people
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight animate-text-cycle-3">
                Share your wavelength
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mt-12 flex-wrap">
            <Link to="/auth/register">
              <button className="px-9 py-4 rounded-full text-lg font-semibold bg-blue-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300">
                Start Your Journey
              </button>
            </Link>
            <button
              onClick={scrollToFeatures}
              className="px-9 py-4 rounded-full text-lg font-semibold bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50 hover:-translate-y-1 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-400"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Animated Waves */}
        <div
          className="absolute left-0 bottom-0 w-full h-full z-0 transition-transform duration-75 ease-out pointer-events-none"
          style={{ transform: `translateY(${waveOffset}px)` }}
        >
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
          <div className="wave wave-4"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-white py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-gray-900">
              Your life, your way
            </h2>
            <p className="text-xl text-gray-600 font-normal">
              Capture the moments that matter to you
            </p>
          </div>

          {/* Features Grid */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            <FeatureCard
              image="/figmaImages/Rest_Test.jpg"
              text="That perfect meal you can't stop thinking about"
            />
            <FeatureCard
              image="/figmaImages/Mov_Test.jpg"
              text="Movies and shows that stayed with you"
            />
            <FeatureCard
              image="/figmaImages/Game_Test.png"
              text="Games that became your escape"
            />
            <FeatureCard
              image="/figmaImages/Loc_Test.jpg"
              text="Places where memories were made"
            />
            <FeatureCard
              image="/figmaImages/Friend_Test.jpg"
              text="Connect with people on your wavelength"
            />
            <FeatureCard
              image="/figmaImages/Journey_Test.jpg"
              text="Look back and see how far you've come"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-6 my-20 md:mx-12 md:my-24 p-16 md:p-24 bg-blue-500 rounded-[32px] shadow-2xl shadow-blue-500/25 overflow-hidden">
        {/* Floating Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 animate-float-reverse"></div>

        {/* CTA Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
            Find people who get it
          </h2>
          <p className="text-lg md:text-xl text-white/95 leading-relaxed mb-10 font-normal">
            When you find someone on your wavelength, everything just clicks. They recommend the perfect show.
            They know that hidden spot. They understand why that song matters. Wavely helps you discover those connections
            and build a community around the things you actually care about.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth/login">
              <button className="px-10 py-4 text-lg rounded-full font-semibold bg-white text-blue-500 shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300">
                Log In
              </button>
            </Link>
            <Link to="/auth/register">
              <button className="px-10 py-4 text-lg rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Spacing */}
      <div className="h-24"></div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ image, text }: { image: string; text: string }) {
  return (
    <div className="break-inside-avoid group cursor-pointer">
      <div className="rounded-3xl overflow-hidden bg-white shadow-lg shadow-black/8 hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-2 transition-all duration-300">
        <div className="overflow-hidden">
          <img
            src={image}
            alt={text}
            className="w-full block transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          <p className="text-lg font-bold text-center text-gray-900 tracking-tight">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
