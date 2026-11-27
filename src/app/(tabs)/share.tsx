import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabHeader } from '@/components/layout/TabHeader';
import {
  PenLine,
  AlignLeft,
  Hash,
  Plus,
  X,
  Layers,
  Link2,
  Lightbulb,
  BookOpen,
  FlaskConical,
  PenTool,
} from 'lucide-react-native';
import { spacing, radius, fontFamilies, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { TextField, FieldFrame } from '@/components/common/TextField';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { SuccessModal } from '@/components/feedback/SuccessModal';
import { useAuth } from '@/context/AuthContext';
import { createResearchWork } from '@/services/research.service';
import { formatResearchTag } from '@/utils/researchWork';
import { RESEARCH_LIMITS, type ResearchStage, type ResearchPostType, SUGGESTED_COLLAB_ROLES } from '@/types/research.types';
import { useLocalSearchParams } from 'expo-router';
import { CurrentWorkCard } from '@/components/cards/CurrentWorkCard';
import { Users, Eye, Send, ChevronDown, ChevronUp, Check, CheckCircle2, Circle, Save, Star } from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { useToast } from '@/context/ToastContext';
import { tagMatchKey } from '@/utils/researchWork';
import { confirmAction } from '@/utils/dialogs';

/** Description limit in the form (the rules allow up to 5000). */
const DESC_MAX = 2000;

/** Roles that usually fit a topic — suggested first when that topic is chosen. */
const ROLE_HINTS: Record<string, string[]> = {
  machinelearning: ['#MLEngineer', '#DataAnnotation', '#Statistician'],
  datascience: ['#Statistician', '#MLEngineer', '#DataAnnotation'],
  computervision: ['#MLEngineer', '#DataAnnotation'],
  banglanlp: ['#DataAnnotation', '#MLEngineer', '#Linguist'],
  nlp: ['#DataAnnotation', '#MLEngineer', '#Linguist'],
  iot: ['#HardwareEngineer', '#EmbeddedDeveloper'],
  hci: ['#UIUXDesigner', '#UserResearcher', '#FrontendDeveloper'],
  softwareengineering: ['#BackendDeveloper', '#FrontendDeveloper'],
  distributedsystems: ['#BackendDeveloper', '#DevOpsEngineer'],
  cybersecurity: ['#SecurityAnalyst', '#BackendDeveloper'],
  bioinformatics: ['#Statistician', '#MLEngineer', '#Biologist'],
};

// Common CSE Suggested Tags
const SUGGESTED_TAGS = [
  '#MachineLearning',
  '#DataScience',
  '#Cybersecurity',
  '#IoT',
  '#BanglaNLP',
  '#ComputerVision',
  '#DistributedSystems',
  '#HCI',
  '#SoftwareEngineering',
  '#Bioinformatics',
];


// Project progression stages with minimalist line-art vector icons
const RESEARCH_STAGES: { id: ResearchStage; label: string; icon: typeof Lightbulb }[] = [
  { id: 'Idea', label: 'Idea', icon: Lightbulb },
  { id: 'Literature Review', label: 'Literature Review', icon: BookOpen },
  { id: 'Experiment', label: 'Experiment', icon: FlaskConical },
  { id: 'Writing', label: 'Writing', icon: PenTool },
];

export default function ShareTab() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const authorName = userProfile?.displayName || 'CSE Researcher';
  const params = useLocalSearchParams<{ mode?: string }>();

  // One page, two kinds of post: share current work OR find collaborators
  const [postType, setPostType] = useState<ResearchPostType>(
    params.mode === 'collaboration' ? 'collaboration' : 'work',
  );
  useEffect(() => {
    if (params.mode === 'collaboration' || params.mode === 'work') setPostType(params.mode);
  }, [params.mode]);
  const isCollab = postType === 'collaboration';

  // "Looking for" roles (collaboration posts)
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [roleError, setRoleError] = useState('');

  const addRole = (raw: string) => {
    const role = formatResearchTag(raw);
    if (!role) return;
    setLookingFor((prev) =>
      prev.some((r) => r.toLowerCase() === role.toLowerCase()) || prev.length >= RESEARCH_LIMITS.lookingForMax
        ? prev
        : [...prev, role],
    );
    setRoleInput('');
    setRoleError('');
  };

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<ResearchStage>('Idea');
  const [showPreview, setShowPreview] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [touched, setTouched] = useState<{ title?: boolean; desc?: boolean; url?: boolean }>({});
  const toast = useToast();

  // Scroll-to-first-error: y positions of the form card and its fields
  const scrollRef = useRef<ScrollView>(null);
  const cardY = useRef(0);
  const fieldY = useRef<Record<string, number>>({});
  const trackField = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    fieldY.current[key] = e.nativeEvent.layout.y;
  };
  const scrollToField = (key: string) => {
    const y = cardY.current + (fieldY.current[key] ?? 0) - spacing.md;
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };
  const [externalUrl, setExternalUrl] = useState('');

  // UI / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Add Tag Logic (handles Enter, Comma, or Add Button)
  const handleAddTag = (rawText?: string) => {
    const textToAdd = rawText !== undefined ? rawText : customTag;
    if (!textToAdd.trim()) return;

    // Split by comma in case user typed "NLP, Vision"
    const tokens = textToAdd
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let updated = [...selectedTags];
    tokens.forEach((token) => {
      // Strip existing # or leading symbols and format into clean camel/alphanumeric tag
      const cleaned = token.replace(/^[#\s]+/, '').trim();
      if (!cleaned) return;
      const formatted = `#${cleaned.replace(/\s+/g, '')}`;

      // Avoid duplicates (case-insensitive)
      if (!updated.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
        updated.push(formatted);
      }
    });

    setSelectedTags(updated);
    setCustomTag('');
  };

  // Comma-listener in input
  const handleTagInputChange = (text: string) => {
    if (text.includes(',')) {
      handleAddTag(text);
    } else {
      setCustomTag(text);
    }
  };

  // Click-to-add from suggested list
  const handleSuggestedTagClick = (tag: string) => {
    if (!selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  // Tag Deletion
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Field validators (used live after a field is touched, and on submit)
  const titleProblem = (v: string) => {
    const t = v.trim();
    if (!t) return 'Please enter a title.';
    if (t.length < RESEARCH_LIMITS.titleMin) return `Title must be at least ${RESEARCH_LIMITS.titleMin} characters.`;
    return '';
  };
  const descProblem = (v: string) => {
    const d = v.trim();
    if (!d) return isCollab ? 'Describe the project and the help you need.' : 'Please add a short summary of your work.';
    if (d.length < RESEARCH_LIMITS.descriptionMin)
      return `${RESEARCH_LIMITS.descriptionMin - d.length} more character${RESEARCH_LIMITS.descriptionMin - d.length === 1 ? '' : 's'} needed.`;
    return '';
  };
  const urlProblem = (v: string) => {
    const u = v.trim();
    return u && (!/^https?:\/\/.+/i.test(u) || u.length > RESEARCH_LIMITS.urlMax)
      ? 'Link must start with http:// or https://'
      : '';
  };

  // Suggested topics: my research interests first, then common CSE topics
  const suggestedTags = useMemo(() => {
    const mine = (userProfile?.researchInterests ?? []).map(formatResearchTag).filter(Boolean);
    const seen = new Set<string>();
    return [...mine, ...SUGGESTED_TAGS].filter((t) => {
      const k = tagMatchKey(t);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [userProfile?.researchInterests]);
  const myTagKeys = useMemo(
    () => new Set((userProfile?.researchInterests ?? []).map(tagMatchKey)),
    [userProfile?.researchInterests],
  );

  // Suggested roles: ones that fit the chosen topics first
  const suggestedRoles = useMemo(() => {
    const fromTopics = selectedTags.flatMap((t) => ROLE_HINTS[tagMatchKey(t)] ?? []);
    const seen = new Set<string>();
    return [...fromTopics, ...SUGGESTED_COLLAB_ROLES].filter((r) => {
      const k = r.toLowerCase();
      if (seen.has(k) || lookingFor.some((x) => x.toLowerCase() === k)) return false;
      seen.add(k);
      return true;
    });
  }, [selectedTags, lookingFor]);

  // Readiness checklist
  const checklist = [
    { label: 'Title', done: !titleProblem(title) },
    { label: 'Description', done: !descProblem(description) },
    ...(isCollab ? [{ label: 'Roles', done: lookingFor.length > 0 || Boolean(roleInput.trim()) }] : []),
    { label: 'Topics', done: selectedTags.length > 0, optional: true },
  ];
  const hasContent = Boolean(title.trim() || description.trim() || selectedTags.length || lookingFor.length || externalUrl.trim());

  const handleClear = async () => {
    if (!hasContent) return;
    const ok = await confirmAction({
      title: 'Clear this form?',
      message: 'Everything you have typed will be removed.',
      confirmLabel: 'Clear',
      cancelLabel: 'Keep',
      destructive: true,
      icon: 'warning',
    });
    if (ok) handleModalClose();
  };

  // Form Validation & Firestore Submission
  const handleSubmit = async (asDraft = false) => {
    if (isSubmitting || isSavingDraft) return;
    setSubmitError('');
    let isValid = true;

    // Include any unfinished tag still typed in the input (computed locally so
    // the submission does not depend on a pending state update).
    const pendingTags = customTag
      .split(',')
      .map((t) => formatResearchTag(t))
      .filter(Boolean);
    const tags = [...selectedTags];
    pendingTags.forEach((tag) => {
      if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
    });
    if (pendingTags.length > 0) {
      setSelectedTags(tags);
      setCustomTag('');
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedUrl = externalUrl.trim();
    const tErr = titleProblem(title);
    const dErr = descProblem(description);
    const uErr = urlProblem(externalUrl);
    setTitleError(tErr);
    setDescError(dErr);
    setUrlError(uErr);
    setTouched({ title: true, desc: true, url: true });
    if (tErr || dErr || uErr) isValid = false;

    if (tags.length > RESEARCH_LIMITS.tagsMax) {
      setSubmitError(`Please use at most ${RESEARCH_LIMITS.tagsMax} tags.`);
      isValid = false;
    } else if (tags.some((t) => t.length > RESEARCH_LIMITS.tagMax)) {
      setSubmitError(`Each tag must be ${RESEARCH_LIMITS.tagMax} characters or less.`);
      isValid = false;
    }

    let roles = lookingFor;
    if (isCollab) {
      const pendingRole = formatResearchTag(roleInput);
      if (pendingRole && !roles.some((r) => r.toLowerCase() === pendingRole.toLowerCase())) {
        roles = [...roles, pendingRole].slice(0, RESEARCH_LIMITS.lookingForMax);
        setLookingFor(roles);
        setRoleInput('');
      }
      if (roles.length === 0) {
        setRoleError('Add at least one skill or role you are looking for.');
        isValid = false;
      }
    }

    if (!isValid) {
      // Take the user to the first problem
      const first = tErr ? 'title' : dErr ? 'desc' : isCollab && roles.length === 0 ? 'roles' : uErr ? 'url' : null;
      if (first) scrollToField(first);
      return;
    }

    if (!userProfile || userProfile.approvalStatus !== 'approved') {
      setSubmitError('Only approved researchers can share work. Please sign in again.');
      return;
    }

    // Confirm before publishing (the in-app popup from DialogContext)
    const ok = asDraft || await confirmAction({
      title: isCollab ? 'Post collaboration request?' : 'Post this update?',
      message: isCollab
        ? `"${trimmedTitle}" will be visible to all approved CSE researchers, who can apply as ${roles.slice(0, 3).join(', ')}${roles.length > 3 ? '…' : ''}.`
        : `"${trimmedTitle}" will be visible to all approved CSE researchers in the feed.`,
      confirmLabel: 'Post',
      cancelLabel: 'Keep editing',
      icon: 'info',
    });
    if (!ok) return;

    if (asDraft) setIsSavingDraft(true);
    else setIsSubmitting(true);
    try {
      await createResearchWork(userProfile, {
        title: trimmedTitle,
        description: trimmedDesc,
        tags,
        stage: selectedStage,
        externalUrl: trimmedUrl || null,
        postType,
        lookingFor: isCollab ? roles : undefined,
        status: asDraft ? 'draft' : 'published',
      });
      if (asDraft) {
        toast.show('Draft saved — find it on your Profile under Currently Working On');
        handleModalClose();
      } else {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      console.error('[Share] Publish failed:', err);
      setSubmitError(
        err?.code === 'permission-denied'
          ? 'Permission denied. Your account may no longer be approved, or your profile changed — please try again.'
          : 'Could not publish your update. Check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Reset Form Fields
    setTitle('');
    setDescription('');
    setCustomTag('');
    setSelectedTags([]);
    setSelectedStage('Idea');
    setTouched({});
    setShowPreview(false);
    setExternalUrl('');
    setTitleError('');
    setDescError('');
    setUrlError('');
    setSubmitError('');
    setLookingFor([]);
    setRoleInput('');
    setRoleError('');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabHeader
        title="Share"
        subtitle={isCollab ? 'Find collaborators for your project' : 'Post an update on your current research'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: spacing.md }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post type toggle: Share Work | Find Collaborators */}
          <View
            style={[styles.segment, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
            accessibilityRole="tablist"
          >
            {([
              { key: 'work', label: 'Share Work', icon: PenLine },
              { key: 'collaboration', label: 'Find Collaborators', icon: Users },
            ] as const).map((opt) => {
              const active = postType === opt.key;
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.85}
                  onPress={() => setPostType(opt.key)}
                  style={[styles.segmentOption, active && { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Icon size={15} strokeWidth={2} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.segmentText, { color: active ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.segmentHint, { color: colors.textSecondary }]}>
            {isCollab
              ? "Describe your project and the skills you need. Researchers apply for a role; you accept them onto your team."
              : 'Share what you are currently researching with the CSE community.'}
          </Text>

          {/* Structural Divider */}
          <View
            style={[styles.headerDivider, { backgroundColor: colors.borderSubtle }]}
          />

          {/* Card Container for Form */}
          <View
            onLayout={(e) => {
              cardY.current = e.nativeEvent.layout.y;
            }}
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                shadowOpacity: isDark ? 0 : 0.04,
                elevation: isDark ? 0 : 1,
              },
            ]}
          >
            {/* Field: Research Title */}
            <View style={styles.fieldBlock} onLayout={trackField('title')}>
              <View style={styles.labelRow}>
                <PenLine size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  {isCollab ? 'Project Title' : 'Research Title'}
                </Text>
              </View>
              <TextField
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (touched.title || titleError) setTitleError(titleProblem(val));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, title: true }));
                  if (title.length) setTitleError(titleProblem(title));
                }}
                placeholder={isCollab ? 'e.g., Building a Bangla handwriting OCR dataset' : 'e.g., Optimizing Transformers for Bengali Dialects'}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: titleError ? colors.error : colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
                maxLength={RESEARCH_LIMITS.titleMax}
              />
              <View style={styles.charCountRow}>
                {titleError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{titleError}</Text>
                ) : (
                  <View />
                )}
                <Text
                  style={[
                    styles.charCount,
                    { color: title.length > RESEARCH_LIMITS.titleMax * 0.9 ? colors.warning : colors.textSecondary },
                  ]}
                >
                  {title.length}/{RESEARCH_LIMITS.titleMax}
                </Text>
              </View>
            </View>

            {/* Field: Abstract / Description */}
            <View style={styles.fieldBlock} onLayout={trackField('desc')}>
              <View style={styles.labelRow}>
                <AlignLeft size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  {isCollab ? 'Project & Help Needed' : 'Abstract / Update Summary'}
                </Text>
              </View>
              <TextField
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (touched.desc || descError) setDescError(descProblem(val));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, desc: true }));
                  if (description.length) setDescError(descProblem(description));
                }}
                placeholder={isCollab
                  ? 'What is the project, what is done so far, and what would a collaborator work on?'
                  : 'Briefly describe your methodology, recent findings, benchmarks, or peer collaboration goals...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: descError ? colors.error : colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
                maxLength={DESC_MAX}
              />
              <View style={styles.charCountRow}>
                {descError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{descError}</Text>
                ) : (
                  <View />
                )}
                <Text
                  style={[
                    styles.charCount,
                    {
                      color:
                        description.trim().length > 0 && description.trim().length < RESEARCH_LIMITS.descriptionMin
                          ? colors.textMuted
                          : description.length > DESC_MAX * 0.9
                            ? colors.warning
                            : colors.textSecondary,
                    },
                  ]}
                >
                  {description.trim().length > 0 && description.trim().length < RESEARCH_LIMITS.descriptionMin
                    ? `min ${RESEARCH_LIMITS.descriptionMin} · `
                    : ''}
                  {description.length}/{DESC_MAX}
                </Text>
              </View>
            </View>

            {/* Field: Looking For (collaboration posts only) */}
            {isCollab ? (
              <View style={styles.fieldBlock} onLayout={trackField('roles')}>
                <View style={styles.labelRow}>
                  <Users size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Looking For <Text style={styles.optionalText}>({lookingFor.length}/{RESEARCH_LIMITS.lookingForMax})</Text>
                  </Text>
                </View>
                <FieldFrame
                  style={[
                    styles.input,
                    styles.roleInputRow,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                      borderColor: roleError ? colors.error : colors.borderSubtle,
                    },
                  ]}
                >
                  <TextInput
                    value={roleInput}
                    onChangeText={(text) => {
                      if (text.includes(',')) text.split(',').forEach(addRole);
                      else setRoleInput(text);
                    }}
                    onSubmitEditing={() => addRole(roleInput)}
                    placeholder="Add a skill or role (e.g. ML Engineer)"
                    placeholderTextColor={colors.textMuted}
                    autoCorrect={false}
                    returnKeyType="done"
                    style={[styles.roleTextInput, { color: colors.textPrimary }]}
                  />
                  {roleInput.trim() ? (
                    <TouchableOpacity
                      onPress={() => addRole(roleInput)}
                      hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
                      style={[styles.tagAddBtn, { backgroundColor: colors.primary }]}
                      accessibilityRole="button"
                      accessibilityLabel="Add role"
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={ICON_STROKE.emphasis} />
                    </TouchableOpacity>
                  ) : null}
                </FieldFrame>
                {roleError ? <Text style={[styles.errorText, { color: colors.error }]}>{roleError}</Text> : null}
                {lookingFor.length > 0 ? (
                  <View style={styles.tagsContainer}>
                    {lookingFor.map((role) => (
                      <TouchableOpacity
                        key={role}
                        activeOpacity={0.75}
                        onPress={() => setLookingFor((prev) => prev.filter((r) => r !== role))}
                        style={[styles.tagPill, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove role ${role}`}
                      >
                        <Text style={[styles.tagPillText, { color: colors.primary }]} numberOfLines={1}>
                          {role}
                        </Text>
                        <View style={styles.tagCloseIconWrapper}>
                          <X size={11} strokeWidth={ICON_STROKE.emphasis} color={colors.primary} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                <View style={styles.tagsContainer}>
                  {suggestedRoles.slice(0, 8).map((role) => (
                    <TouchableOpacity
                      key={role}
                      activeOpacity={0.75}
                      onPress={() => addRole(role)}
                      style={[styles.suggestedPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add role ${role}`}
                    >
                      <Text style={[styles.suggestedPillText, { color: colors.textSecondary }]} numberOfLines={1}>
                        + {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Field: Hybrid Research Areas (Custom Tag Input + Clickable Suggestions) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Hash size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Research Areas <Text style={styles.optionalText}>(Custom & Suggested)</Text>
                </Text>
              </View>

              {/* Tag Input Box with Add Action */}
              <FieldFrame
                style={[
                  styles.tagInputContainer,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <TextInput
                  value={customTag}
                  onChangeText={handleTagInputChange}
                  onSubmitEditing={() => handleAddTag()}
                  placeholder="Type a topic and press enter (e.g. NLP, Vision)"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[styles.tagTextInput, { color: colors.textPrimary }]}
                />
                {customTag.trim().length > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAddTag()}
                    hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
                    style={[styles.tagAddBtn, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom tag"
                  >
                    <Plus size={14} strokeWidth={ICON_STROKE.emphasis} color={colors.textInverse} />
                  </TouchableOpacity>
                ) : null}
              </FieldFrame>

              {/* Selected Tags Display with Deletion */}
              {selectedTags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {selectedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.75}
                      onPress={() => handleRemoveTag(tag)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove tag ${tag}`}
                      accessibilityHint="Double tap to remove"
                    >
                      <Text
                        style={[styles.tagPillText, { color: colors.textPrimary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {tag}
                      </Text>
                      <View style={styles.tagCloseIconWrapper}>
                        <X size={11} strokeWidth={ICON_STROKE.emphasis} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {/* Suggested Tags Horizontal Scroll Section */}
              <View style={styles.suggestedSection}>
                <Text style={[styles.suggestedLabel, { color: colors.textSecondary }]}>
                  Suggested
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestedScrollContent}
                >
                  {suggestedTags.map((tag) => {
                    const isAlreadySelected = selectedTags.some(
                      (t) => t.toLowerCase() === tag.toLowerCase()
                    );
                    return (
                      <TouchableOpacity
                        key={tag}
                        activeOpacity={0.7}
                        onPress={() => handleSuggestedTagClick(tag)}
                        style={[
                          styles.suggestedPill,
                          {
                            backgroundColor: isAlreadySelected
                              ? (isDark ? colors.surfaceSubtle : colors.surface)
                              : (isDark ? colors.surfaceSubtle : colors.background),
                            borderColor: isAlreadySelected
                              ? colors.primary
                              : colors.borderSubtle,
                            opacity: isAlreadySelected ? 0.65 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Suggested tag: ${tag}${isAlreadySelected ? ', added' : ''}`}
                      >
                        {isAlreadySelected ? (
                          <Check size={13} color={colors.primary} />
                        ) : myTagKeys.has(tagMatchKey(tag)) ? (
                          <Star size={12} color={colors.primary} fill={colors.primary} />
                        ) : (
                          <Plus size={13} color={colors.textMuted} />
                        )}
                        <Text
                          style={[
                            styles.suggestedPillText,
                            {
                              color: isAlreadySelected
                                ? colors.primary
                                : colors.textSecondary,
                              fontFamily: isAlreadySelected
                                ? fontFamilies.sansSemiBold
                                : fontFamilies.sansRegular,
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Field: Current Stage Selector with Clean Centered Vector Icons */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Layers size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Current Stage
                </Text>
              </View>
              <View style={styles.stagesGrid}>
                {RESEARCH_STAGES.map((stage) => {
                  const isSelected = selectedStage === stage.id;
                  const IconComponent = stage.icon;
                  return (
                    <TouchableOpacity
                      key={stage.id}
                      activeOpacity={0.75}
                      onPress={() => setSelectedStage(stage.id)}
                      style={[
                        styles.stagePill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? colors.surfaceSubtle
                            : colors.background,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Stage: ${stage.label}`}
                    >
                      <View style={styles.stageIconWrapper}>
                        <IconComponent
                          size={14}
                          strokeWidth={ICON_STROKE.regular}
                          color={isSelected ? colors.textInverse : colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stagePillText,
                          {
                            color: isSelected ? colors.textInverse : colors.textSecondary,
                            fontFamily: isSelected
                              ? fontFamilies.sansSemiBold
                              : fontFamilies.sansMedium,
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {stage.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field: External Link (Optional) */}
            <View style={[styles.fieldBlock, { marginBottom: spacing.md }]} onLayout={trackField('url')}>
              <View style={styles.labelRow}>
                <Link2 size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  External Link <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
              </View>
              <TextField
                value={externalUrl}
                onChangeText={(text) => {
                  setExternalUrl(text);
                  if (touched.url || urlError) setUrlError(urlProblem(text));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, url: true }));
                  setUrlError(urlProblem(externalUrl));
                }}
                placeholder="e.g., https://github.com/lab/repo or DOI"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: urlError ? colors.error : colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
              />
              {urlError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{urlError}</Text>
              ) : null}
            </View>

            {submitError ? (
              <Text
                style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}
                accessibilityLiveRegion="polite"
              >
                {submitError}
              </Text>
            ) : null}

            {/* Preview (collapsible) — exactly how the post will look in the feed */}
            <TouchableOpacity
              onPress={() => setShowPreview((v) => !v)}
              style={[styles.previewToggle, { borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityState={{ expanded: showPreview }}
            >
              <Eye size={15} strokeWidth={ICON_STROKE.regular} color={colors.textSecondary} />
              <Text style={[styles.fieldLabel, { color: colors.textPrimary, flex: 1 }]}>Preview</Text>
              {showPreview ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
            </TouchableOpacity>
            {showPreview ? (
              <View pointerEvents="none" style={styles.previewBody}>
                <CurrentWorkCard
                  work={{
                    id: 'preview',
                    userId: userProfile?.uid ?? '',
                    authorName,
                    title: title.trim() || 'Your title',
                    description: description.trim() || 'Your description will appear here.',
                    topics: selectedTags,
                    stage: selectedStage,
                    postType,
                    lookingFor: isCollab ? lookingFor : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                  authorName={authorName}
                  authorBatch="CSE"
                  authorRole={userProfile?.designation}
                  authorAvatar={userProfile?.photoURL}
                  onCollaboratePress={isCollab ? () => {} : undefined}
                />
              </View>
            ) : null}

            {/* Readiness checklist */}
            <View style={styles.checklist} accessibilityLabel="Post checklist">
              {checklist.map((c) => (
                <View key={c.label} style={styles.checkItem}>
                  {c.done ? (
                    <CheckCircle2 size={14} color={colors.success} />
                  ) : (
                    <Circle size={14} color={colors.textMuted} />
                  )}
                  <Text style={[styles.checkText, { color: c.done ? colors.textPrimary : colors.textMuted }]}>
                    {c.label}
                    {'optional' in c && c.optional ? ' (optional)' : ''}
                  </Text>
                </View>
              ))}
            </View>

            {/* Actions — Clear · Save draft · Post (compact; Post asks for confirmation) */}
            <View style={[styles.submitRow, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                onPress={handleClear}
                disabled={!hasContent || isSubmitting || isSavingDraft}
                hitSlop={8}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear form"
              >
                <Text style={[styles.clearText, { color: hasContent ? colors.textSecondary : colors.textMuted }]}>Clear</Text>
              </TouchableOpacity>
              <View style={styles.submitActions}>
                <Button
                  label="Save draft"
                  onPress={() => handleSubmit(true)}
                  variant="outline"
                  size="sm"
                  loading={isSavingDraft}
                  disabled={isSubmitting || isSavingDraft}
                  icon={<Save size={14} color={colors.primary} />}
                  style={styles.submitButton}
                />
                <Button
                  label={isCollab ? 'Post request' : 'Post update'}
                  onPress={() => handleSubmit(false)}
                  variant="primary"
                  size="sm"
                  loading={isSubmitting}
                  disabled={isSubmitting || isSavingDraft}
                  icon={<Send size={14} color="#FFFFFF" />}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern Confirmation Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title={isCollab ? 'Collaboration Request Posted' : 'Research Update Shared'}
        message={isCollab
          ? 'Your project is now in the feed with a "Looking for collaborators" badge. Researchers can apply for the roles you listed — you will see applications in Notifications.'
          : 'Your current work has been posted to the CSE departmental feed. Peers and faculty can now review and connect.'}
        buttonText="Back to Feed"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  submitActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  submitButton: { paddingHorizontal: spacing.md },
  clearBtn: { height: spacing.compactButtonHeight, justifyContent: 'center', paddingHorizontal: spacing.sm },
  clearText: { ...typography.buttonSmall },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  previewBody: { marginTop: spacing.sm },
  checklist: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkText: { fontSize: 12, fontFamily: fontFamilies.sansMedium },
  safeArea: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.button,
    padding: 4,
    marginTop: spacing.md,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 8,
  },
  segmentText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    flexShrink: 1,
  },
  segmentHint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.sansRegular,
    marginTop: spacing.sm,
  },
  roleInputRow: { flexDirection: 'row', alignItems: 'center' },
  roleTextInput: { flex: 1, minHeight: 46, ...typography.body },
  previewSection: {
    marginTop: spacing.lg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Bottom padding to provide clean clearance above classic bottom tab bar
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 32,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identityTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
  },
  headerDivider: {
    height: 1,
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
  },
  formCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold, letterSpacing: 0.1 },
  optionalText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    fontWeight: '400',
    opacity: 0.7,
  },
  input: {},
  textArea: {},
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 4,
  },
  tagInputContainer: { flexDirection: 'row', alignItems: 'center' },
  tagTextInput: { flex: 1, paddingVertical: 10, ...typography.body },
  tagAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagPillText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
  },
  tagCloseIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedSection: {
    marginTop: 12,
  },
  suggestedLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  suggestedScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  suggestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  suggestedPillText: {
    fontSize: 13,
    flexShrink: 1,
  },
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  stageIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagePillText: {
    fontSize: 13,
    flexShrink: 1,
  },
});
