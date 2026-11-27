/**
 * src/components/common/TopicIcon.tsx
 *
 * Subject icon for a research topic, from the taxonomy's `iconName`
 * (src/data/topics.ts). Unknown topics fall back to the generic Hash.
 */

import React from 'react';
import {
  Bot,
  Brain,
  Code,
  Cpu,
  Database,
  Eye,
  Hash,
  Languages,
  Network,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { TOPIC_TAXONOMY } from '@/utils/search';
import { tagMatchKey } from '@/utils/researchWork';
import { ICON_STROKE } from '@/constants/icons';

const ICONS: Record<string, LucideIcon> = {
  Bot,
  Brain,
  Code,
  Cpu,
  Database,
  Eye,
  Languages,
  Network,
  Shield,
  Users,
};

const byName = new Map(TOPIC_TAXONOMY.map((t) => [tagMatchKey(t.name), t.iconName] as const));

/** Resolve the icon component for a topic by `iconName` or by topic name. */
export function topicIconFor(topic: { iconName?: string; name?: string }): LucideIcon {
  const key = topic.iconName ?? (topic.name ? byName.get(tagMatchKey(topic.name)) : undefined);
  return (key && ICONS[key]) || Hash;
}

export const TopicIcon: React.FC<{
  iconName?: string;
  name?: string;
  size?: number;
  color: string;
}> = ({ iconName, name, size = 16, color }) => {
  const Icon = topicIconFor({ iconName, name });
  return <Icon size={size} color={color} strokeWidth={ICON_STROKE.regular} />;
};
