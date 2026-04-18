import { useState } from 'react';
import Loader from '@/components/loader';
import SignInForm from '@/features/auth/components/sign-in-form';
import SignUpForm from '@/features/auth/components/sign-up-form';
import { useGuestOnly } from '@/hooks/use-guest-only';

export default function Login() {
  const [showSignIn, setShowSignIn] = useState(true);
  const { isLoading } = useGuestOnly();

  if (isLoading) return <Loader />;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      {showSignIn ? (
        <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
      ) : (
        <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
      )}
    </div>
  );
}
