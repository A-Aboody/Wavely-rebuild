# Wavely Authentication System Guide

## Overview

The Wavely authentication system is a production-grade, secure authentication implementation using JWT tokens, refresh token rotation, and persistent state management.

## Tech Stack

- **React** with TypeScript
- **Tanstack Router** for routing
- **Zustand** for state management (with persist middleware)
- **Axios** for HTTP requests with interceptors
- **JWT** for authentication
- **Tailwind CSS** for styling

## Security Features

✓ **JWT Access & Refresh Tokens**: Short-lived access tokens (15min) with long-lived refresh tokens (7 days)
✓ **Automatic Token Refresh**: Interceptor automatically refreshes expired access tokens
✓ **Secure Storage**: Tokens stored in Zustand with localStorage persistence
✓ **Protected Routes**: Route guards prevent unauthorized access
✓ **CSRF Protection**: Token-based authentication prevents CSRF attacks
✓ **Password Security**: Passwords hashed with bcrypt (10 rounds)
✓ **Redis Token Storage**: Refresh tokens stored in Redis with TTL

## File Structure

```
frontend/src/
├── api/
│   └── auth.api.ts              # Auth API client
├── components/
│   ├── AuthForm.tsx             # Login/Register form component
│   ├── AuthPage.tsx             # Auth page with animations
│   ├── Navbar.tsx               # Navigation with auth state
│   └── ProtectedRoute.tsx       # Route protection component
├── hooks/
│   └── useAuth.ts               # Auth hooks
├── lib/
│   └── apiClient.ts             # Axios instance with interceptors
├── routes/
│   ├── __root.tsx               # Root layout
│   ├── auth.tsx                 # Auth layout route
│   ├── auth.login.tsx           # Login route
│   ├── auth.register.tsx        # Register route
│   └── dashboard.tsx            # Example protected route
└── stores/
    └── authStore.ts             # Zustand auth store
```

## API Endpoints

### Backend (NestJS)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user (requires auth)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (requires auth)

## Usage Examples

### 1. Login/Register

Users can access the auth pages at:
- `/auth/login` - Login page
- `/auth/register` - Registration page

The `AuthPage` component handles both modes with smooth animations.

### 2. Protecting Routes

**Method 1: Using `beforeLoad` in route definition**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: DashboardPage,
});
```

**Method 2: Using `ProtectedRoute` component**

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

### 3. Using Auth Hooks

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Accessing Auth Store

```tsx
import { useAuthStore } from '../stores/authStore';

function MyComponent() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // ... component logic
}
```

### 5. Making Authenticated API Calls

The `apiClient` automatically includes the access token in requests:

```tsx
import apiClient from '../lib/apiClient';

// The Authorization header is automatically added
const response = await apiClient.get('/api/protected-resource');
```

## Authentication Flow

### Registration Flow

1. User fills out registration form
2. Frontend validates input (username format, password length)
3. API call to `/auth/register`
4. Backend validates and creates user
5. Backend returns `{ user, accessToken, refreshToken }`
6. Frontend stores tokens in Zustand store
7. User redirected to home/dashboard

### Login Flow

1. User fills out login form
2. API call to `/auth/login` with email & password
3. Backend validates credentials
4. Backend returns `{ user, accessToken, refreshToken }`
5. Frontend stores tokens in Zustand store
6. User redirected to home/dashboard

### Token Refresh Flow

1. API request returns 401 Unauthorized
2. Interceptor catches the error
3. If refresh token exists, call `/auth/refresh`
4. Backend validates refresh token from Redis
5. Backend returns new access token
6. Interceptor updates stored access token
7. Original request retried with new token
8. If refresh fails, user logged out and redirected to login

### Logout Flow

1. User clicks logout
2. API call to `/auth/logout`
3. Backend deletes refresh token from Redis
4. Frontend clears Zustand store
5. User redirected to login page

## Data Types

### User

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}
```

### Login DTO

```typescript
interface LoginDto {
  email: string;
  password: string;
}
```

### Register DTO

```typescript
interface RegisterDto {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}
```

### Auth Response

```typescript
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

## Validation Rules

### Username
- 3-20 characters
- Only letters, numbers, and underscores
- Regex: `/^[a-zA-Z0-9_]{3,20}$/`

### Password
- Minimum 6 characters
- No maximum length (will be hashed)

### Email
- Valid email format
- Must be unique

## Error Handling

The auth system handles various error scenarios:

### Frontend Errors

```tsx
try {
  await authApi.login(credentials);
} catch (err: any) {
  // Error message extracted from response
  const errorMessage = err.response?.data?.message || 'Login failed';
  // Display error to user
}
```

### Common Backend Errors

- `401 Unauthorized` - Invalid credentials or token
- `409 Conflict` - Email or username already exists
- `400 Bad Request` - Invalid input format

## Security Best Practices

### Implemented

✓ **Password Hashing**: Bcrypt with 10 rounds
✓ **Token Expiration**: Access tokens expire in 15 minutes
✓ **Refresh Token Rotation**: New access token on each refresh
✓ **HTTP-Only Storage**: While not true HTTP-only cookies, tokens are stored in memory/localStorage
✓ **Input Validation**: Both frontend and backend validation
✓ **CORS Configuration**: Configure in backend for production
✓ **Rate Limiting**: Should be added to backend endpoints

### Recommendations for Production

1. **Enable HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Store secrets in environment variables
3. **CORS**: Configure allowed origins properly
4. **Rate Limiting**: Add rate limiting to auth endpoints
5. **Logging**: Log authentication attempts for security monitoring
6. **2FA**: Consider adding two-factor authentication
7. **Password Requirements**: Enforce stronger password requirements
8. **Account Lockout**: Implement account lockout after failed attempts
9. **Email Verification**: Add email verification flow
10. **Security Headers**: Add security headers (CSP, X-Frame-Options, etc.)

## Customization

### Styling

The auth components use Tailwind CSS. Customize by modifying:
- `AuthPage.tsx` - Main auth page layout and animations
- `AuthForm.tsx` - Form styling
- `Navbar.tsx` - Navigation styling

### Branding

Update branding elements:
- Logo icon in `AuthPage.tsx` and `Navbar.tsx`
- Color scheme in Tailwind classes
- App name "Wavely" throughout components

### Token Expiration

Backend configuration in `.env`:
```env
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## Testing

### Manual Testing Checklist

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong credentials
- [ ] Access protected route when logged out
- [ ] Access protected route when logged in
- [ ] Token refresh on 401
- [ ] Logout functionality
- [ ] Persistent login (refresh page)
- [ ] Duplicate email registration
- [ ] Duplicate username registration
- [ ] Invalid username format
- [ ] Short password validation

### Example Test Flow

```bash
# Start backend
cd backend
npm run start:dev

# Start frontend
cd frontend
npm run dev

# Test in browser
# 1. Go to http://localhost:5173/auth/register
# 2. Register new user
# 3. Verify redirect to home
# 4. Check localStorage for tokens
# 5. Go to /dashboard
# 6. Verify access granted
# 7. Logout
# 8. Try to access /dashboard
# 9. Verify redirect to login
```

## Troubleshooting

### Issue: "Invalid credentials" on correct password

**Solution**: Check that bcrypt is properly installed and the password is being hashed during registration.

### Issue: Token refresh loop

**Solution**: Ensure refresh token endpoint doesn't require JWT auth guard, only refresh token guard.

### Issue: User logged out after page refresh

**Solution**: Check Zustand persist middleware is configured correctly in `authStore.ts`.

### Issue: CORS errors

**Solution**: Configure CORS in backend to allow frontend origin.

### Issue: 401 errors on all requests

**Solution**: Verify axios interceptor is adding Authorization header correctly.

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (.env)

```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Performance Optimizations

1. **Token Refresh**: Only refreshes when needed (on 401)
2. **Persistent Storage**: Reduces unnecessary API calls
3. **Automatic Token Injection**: No manual token management needed
4. **Optimistic UI**: Forms show loading states
5. **Lazy Route Loading**: Routes loaded on demand

## Support

For issues or questions:
- Check this documentation first
- Review the code comments
- Check browser console for errors
- Verify backend logs for auth errors
