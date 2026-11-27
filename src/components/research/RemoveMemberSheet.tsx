/**
 * src/components/research/RemoveMemberSheet.tsx
 *
 * Author-only "Remove from team" step, shown INSIDE the Manage post sheet
 * (no second modal). A short reason is required; the member receives it as
 * a notification. Errors are shown inline, inside the form.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, Info } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { REMOVAL_MESSAGE, validateRemovalMessage } from '@/utils/collab';
import type { CollabRequest } from '@/types/collab.types';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { fontFamilies, radius, spacing, tabularNums, typography } from '@/constants';

/** Short chip label → full message inserted into the field. */
const QUICK_REASONS: { label: string; text: string }[] = [
  { label: 'Scope changed', text: 'The project scope changed and this role is no longer needed. Thank you for your help.' },
  { label: 'Team complete', text: 'The team is now complete for this phase. Thank you for your time and interest.' },
  { label: 'Schedules', text: "We couldn't coordinate our schedules. Thank you, and good luck with your research." },
];

export const RemoveMemberPanel: React.FC<{
  request: CollabRequest;
  busy: boolean;
  /** Inline error from the last attempt (e.g. permission denied). */
  error: string | null;
  onCancel: () => void;
  onConfirm: (message: string) => void;
}> = ({ request, busy, error, onCancel, onConfirm }) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setMessage('');
    setTouched(false);
  }, [request.id]);

  const firstName = request.applicant.displayName.split(' ')[0];
  const validation = validateRemovalMessage(message);
  const showValidation = touched && Boolean(validation);
  const length = message.trim().length;

  return (
    <View style={styles.wrap}>
      {/* Who */}
      <View style={[styles.member, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
        <Avatar name={request.applicant.displayName} uri={request.applicant.photoURL} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {request.applicant.displayName}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {request.role}
          </Text>
        </View>
      </View>

      {/* Why */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Message to {firstName}</Text>
        <TextField
          value={message}
          onChangeText={(t) => {
            setMessage(t);
            if (!touched && t.trim().length >= REMOVAL_MESSAGE.min) setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          multiline
          maxLength={REMOVAL_MESSAGE.max}
          placeholder={`Briefly explain why, so ${firstName} understands.`}
          style={[styles.input, showValidation ? { borderColor: colors.error } : null]}
          accessibilityLabel={`Message to ${firstName}`}
        />
        <View style={styles.helpRow}>
          <Text style={[styles.meta, { color: showValidation ? colors.error : colors.textMuted, flex: 1 }]}>
            {showValidation ? validation : `Required · ${firstName} will see this in Notifications.`}
          </Text>
          <Text style={[styles.meta, tabularNums, { color: colors.textMuted }]}>
            {length}/{REMOVAL_MESSAGE.max}
          </Text>
        </View>
      </View>

      {/* Quick reasons */}
      <View style={styles.chips}>
        {QUICK_REASONS.map((r) => {
          const active = message.trim() === r.text;
          return (
            <TouchableOpacity
              key={r.label}
              onPress={() => {
                setMessage(r.text);
                setTouched(true);
              }}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }
                  : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Use reason: ${r.label}`}
            >
              <Text
                maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                style={[styles.chipText, { color: active ? colors.primary : colors.textSecondary }]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* What happens */}
      <View style={[styles.note, { backgroundColor: colors.surfaceSubtle }]}>
        <Info size={14} color={colors.textSecondary} />
        <Text style={[styles.meta, { color: colors.textSecondary, flex: 1 }]}>
          {firstName} leaves the team list. Your connection stays, and they can apply again later.
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
          <AlertCircle size={15} color={colors.error} />
          <Text style={[styles.meta, { color: colors.error, flex: 1 }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" size="sm" onPress={onCancel} disabled={busy} style={styles.actionBtn} />
        <Button
          label="Remove member"
          variant="destructive"
          size="sm"
          loading={busy}
          disabled={busy || Boolean(validation)}
          onPress={() => {
            setTouched(true);
            if (!validation) onConfirm(message.trim());
          }}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  name: { ...typography.titleSmall },
  meta: { ...typography.caption },
  field: { gap: 6 },
  label: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold },
  input: { minHeight: 104 },
  helpRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  chipText: { ...typography.buttonSmall },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, padding: 12, borderRadius: radius.md },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, height: spacing.secondaryButtonHeight },
});
