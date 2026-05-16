import { Redirect } from 'expo-router';

// Password reset is now handled in forgot-password.tsx as a multi-step flow
export default function ResetPasswordRedirect() {
  return <Redirect href="/auth/forgot-password" />;
}
