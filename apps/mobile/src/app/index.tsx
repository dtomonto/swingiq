import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: check auth state, redirect to /auth/login if not logged in
  return <Redirect href="/(tabs)/dashboard" />;
}
