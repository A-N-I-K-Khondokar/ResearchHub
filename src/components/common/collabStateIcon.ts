/**
 * src/components/common/collabStateIcon.ts
 *
 * Icon for a collaboration call-to-action, so a disabled "You're on the
 * team" button never shows the "add person" glyph.
 */

import { CheckCircle2, Clock, Settings2, UserCheck, UserPlus, XCircle, type LucideIcon } from 'lucide-react-native';
import type { CollaborateState } from '@/hooks/useCollaborate';

const MAP: Record<CollaborateState, LucideIcon> = {
  own: Settings2,
  member: UserCheck,
  declined: XCircle,
  pending: Clock,
  closed: CheckCircle2,
  open: UserPlus,
};

export const collabStateIcon = (state?: CollaborateState): LucideIcon => (state ? MAP[state] : UserPlus);
