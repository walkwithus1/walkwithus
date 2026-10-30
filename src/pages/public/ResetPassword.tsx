import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button, { LinkButton } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { Alert } from '../../components/ui/Card';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify if there is an active session (from password recovery link)
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected password update error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-canvas py-12">
      <div className="container-narrow max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-ink">
          Choose a new password
        </h1>
        <p className="mt-2 text-center text-sm text-ink-muted">
          Enter your new password below to secure and restore access to your account.
        </p>

        {error && <Alert tone="stop" className="mt-6">{error}</Alert>}

        {hasRecoverySession === false && !success && (
          <div className="mt-6 rounded-card border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              <span>Session Required</span>
            </div>
            <p>
              No active recovery session was detected. If your reset link has expired, please request a new link.
            </p>
            <div className="pt-1">
              <LinkButton to="/forgot-password" size="sm" variant="secondary">
                Request New Reset Link
              </LinkButton>
            </div>
          </div>
        )}

        {success ? (
          <div className="mt-6 rounded-card border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Password Updated</h2>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                Your password has been securely updated. You can now continue with your updated credentials.
              </p>
            </div>
            <div className="pt-2">
              <Button
                size="md"
                block
                onClick={() => navigate('/my-requests', { replace: true })}
              >
                Continue to Account
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <Field label="New Password" required>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  autoComplete="new-password"
                  autoFocus
                />
              )}
            </Field>

            <Field label="Confirm New Password" required>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              )}
            </Field>

            <Button
              type="submit"
              size="lg"
              block
              loading={loading}
              loadingLabel="Updating password…"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Update Password</span>
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
