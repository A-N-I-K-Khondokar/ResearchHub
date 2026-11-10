import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root Entry Point for CSE Research Hub
 * 
 * Directs users to the initial Authentication experience:
 * Login -> Auth (Signup/Verify) -> Account Setup -> Main Tab Shell (Home Feed)
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
