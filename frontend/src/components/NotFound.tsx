import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <p className="text-7xl font-semibold text-muted-foreground">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/home">Browse feed</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
