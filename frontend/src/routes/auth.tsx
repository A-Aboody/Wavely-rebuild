import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState();

    // Redirect to home if already authenticated
    if (isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
