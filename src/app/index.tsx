import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root Entry Point for CSE Research Hub
 * 
 * Standard production application entry that directs users to the
 * Splash / Authentication experience:
 * Splash -> Auth (Login/Signup) -> Onboarding -> Main Tab Shell (Home Feed)
 */
export default function Index() {
  return <Redirect href="/(auth)/splash" />;
}
