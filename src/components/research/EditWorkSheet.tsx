/**
 * src/components/research/EditWorkSheet.tsx
 *
 * Author-only "Edit post" sheet for research work AND collaboration posts:
 * title, description, stage, topics, link and (collaboration) roles needed.
 * Saves through research.service.updateResearchWork — the Firestore rules
 * allow only the author to change these content fields.
 */

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { Pencil, Plus, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { TextField } from '@/components/common/TextField';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { updateResearchWork } from '@/services/research.service';
import { formatResearchTag } from '@/utils/researchWork';
import {
  RESEARCH_LIMITS,
  RESEARCH_STAGE_IDS,
  SUGGESTED_COLLAB_ROLES,
  type ResearchStage,
  type ResearchWork,
} from '@/types/research.types';
import { fontFamilies, radius, spacing, typography } from '@/constants';

interface EditWorkSheetProps {
  work: ResearchWork | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: ResearchWork) => void;
}

export const EditWorkSheet: React.FC<EditWorkSheetProps> = ({ work, visible, onClose, onSaved }) => {
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const isCollab = work?.postType === 'collaboration';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<ResearchStage>('Idea');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  // Fill the form each time the sheet opens
  useEffect(() => {
    if (!visible || !work) return;
    setTitle(work.title);
    setDescription(work.description);
    setStage(work.stage);
    setTags(work.tags);
    setTagInput('');
    setRoles(work.lookingFor ?? []);
    setRoleInput('');
    setLink(work.externalUrl ?? '');
  }, [visible, work]);

  const addTo = (list: string[], setList: (v: string[]) => void, raw: string, max: number) => {
    const tag = formatResearchTag(raw).slice(0, RESEARCH_LIMITS.tagMax + 1);
    if (!tag || list.some((t) => t.toLowerCase() === tag.toLowerCase()) || list.length >= max) return;
    setList([...list, tag]);
  };

  const pendingTags = tagInput.trim() ? [...tags, formatResearchTag(tagInput)] : tags;
  const pendingRoles = roleInput.trim() ? [...roles, formatResearchTag(roleInput)] : roles;

  const errors: string[] = [];
  const t = title.trim();
  const d = description.trim();
  const u = link.trim();
  if (t.length < RESEARCH_LIMITS.titleMin) errors.push(`Title needs at least ${RESEARCH_LIMITS.titleMin} characters`);
  if (d.length < RESEARCH_LIMITS.descriptionMin) errors.push(`Description needs at least ${RESEARCH_LIMITS.descriptionMin} characters`);
  if (u && !/^https?:\/\/.+/i.test(u)) errors.push('Link must start with http:// or https://');
  if (isCollab && pendingRoles.length === 0) errors.push('Add at least one role you are looking for');

  const save = async () => {
    if (!work || saving) return;
    if (errors.length) {
      toast.show(errors[0], 'error');
      return;
    }
    setSaving(true);
    const input = {
      title: t,
      description: d,
      tags: pendingTags,
      stage,
      externalUrl: u || null,
      ...(isCollab ? { lookingFor: pendingRoles } : {}),
    };
    try {
      await updateResearchWork(work, input);
      onSaved({
        ...work,
        title: t,
        description: d,
        tags: pendingTags.slice(0, RESEARCH_LIMITS.tagsMax),
        stage,
        externalUrl: u || null,
        lookingFor: isCollab ? pendingRoles.slice(0, RESEARCH_LIMITS.lookingForMax) : work.lookingFor,
      });
      toast.show(isCollab ? 'Collaboration post updated' : 'Research work updated');
      onClose();
    } catch (err) {
      console.error('[EditWorkSheet] Save failed:', err);
      toast.show('Could not save your changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
      borderColor: colors.borderSubtle,
      color: colors.textPrimary,
    },
  ];

  const chipList = (list: string[], setList: (v: string[]) => void, accent: boolean) => (
    <View style={styles.chips}>
      {list.map((tag) => (
        <TouchableOpacity
          key={tag}
          onPress={() => setList(list.filter((x) => x !== tag))}
          style={[
            styles.chip,
            accent
              ? { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }
              : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${tag}`}
        >
          <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.chipText, { color: accent ? colors.primary : colors.textPrimary }]}>{tag}</Text>
          <X size={12} color={accent ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
              <Pencil size={17} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isCollab ? 'Edit collaboration post' : 'Edit research work'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>Title</Text>
            <TextField value={title} onChangeText={setTitle} maxLength={RESEARCH_LIMITS.titleMax} style={inputStyle} />

            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>Stage</Text>
            <View style={styles.chips}>
              {RESEARCH_STAGE_IDS.map((s) => {
                const active = s === stage;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStage(s)}
                    style={[
                      styles.stage,
                      active
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
            <TextField
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={RESEARCH_LIMITS.descriptionMax}
              style={[inputStyle, styles.multiline]}
            />
            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {description.length}/{RESEARCH_LIMITS.descriptionMax}
            </Text>

            {isCollab ? (
              <>
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>Looking for</Text>
                {chipList(roles, setRoles, true)}
                <View style={styles.addRow}>
                  <TextField
                    value={roleInput}
                    onChangeText={setRoleInput}
                    placeholder="Add a role, e.g. ML Engineer"
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={() => {
                      addTo(roles, setRoles, roleInput, RESEARCH_LIMITS.lookingForMax);
                      setRoleInput('');
                    }}
                    style={[inputStyle, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      addTo(roles, setRoles, roleInput, RESEARCH_LIMITS.lookingForMax);
                      setRoleInput('');
                    }}
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add role"
                  >
                    <Plus size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.chips}>
                  {SUGGESTED_COLLAB_ROLES.filter((r) => !roles.some((x) => x.toLowerCase() === r.toLowerCase()))
                    .slice(0, 6)
                    .map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => addTo(roles, setRoles, r, RESEARCH_LIMITS.lookingForMax)}
                        style={[styles.suggest, { borderColor: colors.borderSubtle }]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.suggestText, { color: colors.textSecondary }]}>+ {r}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </>
            ) : null}

            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>Topics</Text>
            {chipList(tags, setTags, false)}
            <View style={styles.addRow}>
              <TextField
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a topic, e.g. Machine Learning"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => {
                  addTo(tags, setTags, tagInput, RESEARCH_LIMITS.tagsMax);
                  setTagInput('');
                }}
                style={[inputStyle, { flex: 1 }]}
              />
              <TouchableOpacity
                onPress={() => {
                  addTo(tags, setTags, tagInput, RESEARCH_LIMITS.tagsMax);
                  setTagInput('');
                }}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Add topic"
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>
              Link <Text style={{ color: colors.textMuted }}>(optional)</Text>
            </Text>
            <TextField
              value={link}
              onChangeText={setLink}
              placeholder="https://…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={RESEARCH_LIMITS.urlMax}
              style={inputStyle}
            />

            {errors.length ? (
              <Text style={[styles.error, { color: colors.error }]}>{errors[0]}</Text>
            ) : null}

            <Button
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={save}
              variant="primary"
              fullWidth
              loading={saving}
              disabled={saving || errors.length > 0}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.md,
    maxHeight: '94%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  iconBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, flex: 1 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  label: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold, marginTop: spacing.sm },
  input: {},
  multiline: {},
  counter: { ...typography.micro, alignSelf: 'flex-end', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: radius.full, borderWidth: 1 },
  chipText: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold },
  stage: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: radius.full, borderWidth: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addBtn: { width: 44, height: 44, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  suggest: { paddingHorizontal: 10, height: 28, justifyContent: 'center', borderRadius: radius.full, borderWidth: 1, borderStyle: 'dashed' },
  suggestText: { ...typography.micro },
  error: { ...typography.caption, marginTop: spacing.sm },
});
