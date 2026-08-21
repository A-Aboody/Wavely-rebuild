import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

const features = [
  {
    image: '/figmaImages/Mov_Test.jpg',
    title: 'Rate and review',
    description: 'Log your thoughts on movies, restaurants, games, and more.',
  },
  {
    image: '/figmaImages/Porshce.jpg',
    title: 'Build your profile',
    description: 'Your ratings and reviews create a personal taste profile over time.',
  },
  {
    image: '/figmaImages/Friend_Test.jpg',
    title: 'Find your people',
    description: 'Connect with others who share your interests and preferences.',
  },
  {
    image: '/figmaImages/Game_Test.png',
    title: 'Discover new favorites',
    description: 'Get recommendations based on what you and your community enjoy.',
  },
  {
    image: '/figmaImages/Journey_Test.jpg',
    title: 'Tell your story',
    description: 'Each review captures a moment worth remembering.',
  },
  {
    image: '/figmaImages/Rest_Test.jpg',
    title: 'Share what matters',
    description: 'Post your experiences and see what resonates with others.',
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/Wavely-Logo.png" alt="Wavely" className="h-8 w-auto" />
            <span className="text-xl font-black text-primary tracking-tight">Wavely</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/register">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Track the experiences that shape you
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Rate movies, restaurants, games, and places you visit. Share with people who care about
          the same things.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth/register">Get started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth/login">Log in</Link>
          </Button>
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* Features with Images */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything you need to capture what matters
          </h2>
          <p className="mt-3 text-muted-foreground">
            A simple toolkit for recording, sharing, and discovering experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-border"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ready to start?</h2>
          <p className="mt-3 text-muted-foreground">
            Join Wavely and begin building a record of the things you love.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth/register">Get started</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/auth/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Wavely. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
