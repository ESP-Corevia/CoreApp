import { useState } from 'react';

import Loader from '@/components/loader';
import SignInForm from '@/features/auth/components/sign-in-form';
import SignUpForm from '@/features/auth/components/sign-up-form';
import { useGuestOnly } from '@/hooks/use-require-auth';

export default function Login() {
  const [showSignIn, setShowSignIn] = useState(true);
  const { isLoading } = useGuestOnly();

  if (isLoading) {
    return <Loader open />;
  }
  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
