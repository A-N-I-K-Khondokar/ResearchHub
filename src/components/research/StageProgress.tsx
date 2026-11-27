/**
 * src/components/research/StageProgress.tsx
 *
 * Segmented progress bar for a post's research stage. Owners get an
 * "Update" link that reveals a one-tap stage picker.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { RESEARCH_STAGE_IDS, type ResearchStage } from '@/types/research.types';
import { fontFamilies, radius, spacing, typography } from '@/constants';

const SHORT: Record<ResearchStage, string> = {
  Idea: 'Idea',
  'Literature Review': 'Lit. Review',
  Experiment: 'Experiment',
  Writing: 'Writing',
};

interface StageProgressProps {
  stage: ResearchStage;
  editable?: boolean;
  busy?: boolean;
  onChange?: (stage: ResearchStage) => void;
}

export const StageProgress: React.FC<StageProgressProps> = ({ stage, editable, busy, onChange }) => {
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const current = Math.max(0, RESEARCH_STAGE_IDS.indexOf(stage));

  return (
    <View accessibilityLabel={`Research stage: ${stage}, step ${current + 1} of ${RESEARCH_STAGE_IDS.length}`}>
      <View style={styles.headRow}>
        <Text style={[styles.head, { color: colors.textSecondary }]}>
          Stage <Text style={{ color: colors.textPrimary, fontFamily: fontFamilies.sansSemiBold }}>{stage}</Text>
          <Text style={{ color: colors.textMuted }}>  ·  {current + 1}/{RESEARCH_STAGE_IDS.length}</Text>
        </Text>
        {editable ? (
          <TouchableOpacity onPress={() => setPicking((v) => !v)} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.update, { color: colors.primary }]}>{picking ? 'Done' : 'Update'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.bar}>
        {RESEARCH_STAGE_IDS.map((s, i) => (
          <View
            key={s}
            style={[styles.segment, { backgroundColor: i <= current ? colors.primary : colors.surfaceSubtle }]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {RESEARCH_STAGE_IDS.map((s, i) => (
          <Text
            key={s}
            numberOfLines={1}
            style={[
              styles.label,
              { color: i === current ? colors.primary : colors.textMuted },
              i === current && { fontFamily: fontFamilies.sansSemiBold },
            ]}
          >
            {SHORT[s]}
          </Text>
        ))}
      </View>

      {editable && picking ? (
        <View style={styles.picker}>
          {RESEARCH_STAGE_IDS.map((s) => {
            const active = s === stage;
            return (
              <TouchableOpacity
                key={s}
                disabled={busy || active}
                onPress={() => onChange?.(s)}
                style={[
                  styles.pill,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                {active ? <Check size={13} color="#FFFFFF" /> : null}
                <Text style={[styles.pillText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  head: { ...typography.bodySmall },
  update: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  bar: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: radius.full },
  labels: { flexDirection: 'row', gap: 4, marginTop: 6 },
  label: { ...typography.micro, flex: 1, textAlign: 'center' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: { ...typography.caption, fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
});
