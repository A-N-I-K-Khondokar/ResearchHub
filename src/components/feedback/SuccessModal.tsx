import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing } from '@/constants';
import { Button } from '../common/Button';

export interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'Continue',
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: isDark
              ? 'rgba(0, 4, 10, 0.75)'
              : 'rgba(7, 15, 30, 0.6)',
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              shadowColor: '#071A3E',
              shadowOpacity: isDark ? 0 : 0.08,
              elevation: isDark ? 0 : 6,
            },
          ]}
        >
          {/* Success Icon */}
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.secondaryLight },
            ]}
          >
            <Check
              size={32}
              color={colors.secondary}
              strokeWidth={3}
            />
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Body Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Action Button */}
          <Button
            label={buttonText}
            onPress={onClose}
            fullWidth
            size="lg"
            style={styles.actionButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});
