import { Redirect } from 'expo-router';

// Unknown links (old deep links, a web host serving the app under a sub-path) land on Home.
export default function NotFound() {
  return <Redirect href="/" />;
}
