/**
 * src/components/common/linkIcon.ts
 *
 * One icon per academic / social link, shared by the own-profile tab, the
 * public profile and onboarding so each service always looks the same.
 */

import { ExternalLink, FlaskConical, Github, Globe, GraduationCap, Linkedin, type LucideIcon } from 'lucide-react-native';

const MAP: Record<string, LucideIcon> = {
  googleScholar: GraduationCap,
  researchGate: FlaskConical,
  github: Github,
  linkedin: Linkedin,
  website: Globe,
};

export const linkIconFor = (key: string): LucideIcon => MAP[key] ?? ExternalLink;
