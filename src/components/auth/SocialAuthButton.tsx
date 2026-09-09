import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, Image } from 'react-native';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface SocialAuthButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ onPress, style }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <Image 
          source={require('../../../assets/images/google-icon.png')} 
          style={styles.googleImage}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Continue with Google</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleImage: {
    width: 20,
    height: 20,
  },
  buttonText: {
    ...typography.button,
    color: '#3C4043', // Google's standard dark gray for text
  },
});

