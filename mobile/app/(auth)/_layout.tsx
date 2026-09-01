/**
 * Layout for the authentication screens.
 *
 * If a logged-in user somehow lands here, send them to Home.
 * There is no reason to show a login form to someone already
 * logged in.
 */

import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}