import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import Register from '../Register';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';
import { supabase } from '../../../lib/supabase';
import * as authHook from '../../../hooks/useAuth';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Page', () => {
    it('renders form fields, submit button, and navigation links', () => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
    });

    it('validates required fields before submitting', async () => {
      const mockSignIn = vi.fn();
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/please fill in both fields/i)).toBeInTheDocument();
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('submits credentials and navigates on success', async () => {
      const mockSignIn = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Secret1234!' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Secret1234!');
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('displays error alert on invalid credentials', async () => {
      const mockSignIn = vi.fn().mockRejectedValue(new Error('Invalid login credentials'));
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'badpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  describe('Register Page', () => {
    it('validates password minimum length and confirmation match', async () => {
      const mockSignUp = vi.fn();
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      );

      // Short password
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(await screen.findByText(/your password must be at least 8 characters/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();

      // Mismatched passwords
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'validPassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'differentPassword456' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('redirects to /my-requests when session is created immediately', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ sessionCreated: true });
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'validPassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'validPassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('jane@example.com', 'validPassword123', 'Jane Doe');
        expect(mockNavigate).toHaveBeenCalledWith('/my-requests', { replace: true });
      });
    });

    it('shows confirmation instructions when email verification is required', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ sessionCreated: false });
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        session: null,
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
        roleError: null,
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'safePassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'safePassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(await screen.findByText(/check your email for the confirmation link/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('ForgotPassword Page', () => {
    it('sends reset link and shows confirmation alert', async () => {
      const mockReset = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockImplementation(mockReset as any);

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/account email/i), { target: { value: 'user@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send password reset link/i }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith('user@example.com', {
          redirectTo: expect.stringContaining('/reset-password'),
        });
      });

      expect(await screen.findByText(/reset link sent/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });

    it('handles reset request errors gracefully', async () => {
      vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      } as any);

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/account email/i), { target: { value: 'user@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send password reset link/i }));

      expect(await screen.findByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });

  describe('ResetPassword Page', () => {
    it('updates password and provides navigation to account', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'u-1' } } },
      } as any);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase.auth, 'updateUser').mockImplementation(mockUpdate as any);

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'BrandNewPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'BrandNewPass123' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ password: 'BrandNewPass123' });
      });

      expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /continue to account/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/my-requests', { replace: true });
    });
  });
});
