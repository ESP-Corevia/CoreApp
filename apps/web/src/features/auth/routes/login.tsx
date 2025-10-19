import { useState } from 'react';

import SignInForm from '@/features/auth/components/sign-in-form';
import SignUpForm from '@/features/auth/components/sign-up-form';

export default function Login() {
  const [showSignIn, setShowSignIn] = useState(true);
  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
