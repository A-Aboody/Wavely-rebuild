import { createRootRoute, Outlet, useMatches, useRouterState } from '@tanstack/react-router';
import { Sidebar } from '../components/Sidebar';
import { NotFound } from '../components/NotFound';
import { useAuthStore } from '../stores/authStore';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const matches = useMatches();
  const routerState = useRouterState();
  const { isAuthenticated } = useAuthStore();

  // Get the current pathname from the last match (the actual current route)
  const currentPath = matches[matches.length - 1]?.pathname || '/';

  const isAuthRoute = currentPath.startsWith('/auth');
  const isLandingPage = currentPath === '/';
  const isNotFound = routerState.status === 'notFound';

  // Show sidebar for authenticated users on non-auth routes (but not landing page)
  const showSidebar = isAuthenticated && !isAuthRoute && !isNotFound && !isLandingPage;

  return (
    <div className="min-h-screen">
      {showSidebar && <Sidebar />}
      <div
        className="min-h-screen transition-all duration-300"
        style={{
          marginLeft: showSidebar ? 'var(--sidebar-width, 256px)' : '0',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
