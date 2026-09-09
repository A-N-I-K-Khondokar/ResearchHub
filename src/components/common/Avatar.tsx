import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { radius, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  badge?: boolean;
  badgeColor?: string;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { dimension: number; fontSize: number; radius: number }> = {
  xs: { dimension: 24, fontSize: 10, radius: radius.full },
  sm: { dimension: 32, fontSize: 12, radius: radius.full },
  md: { dimension: 44, fontSize: 16, radius: radius.full },
  lg: { dimension: 64, fontSize: 22, radius: radius.full },
  xl: { dimension: 88, fontSize: 30, radius: radius.full },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  badge = false,
  badgeColor,
  style,
}) => {
  const { colors } = useTheme();
  const { dimension, fontSize, radius: borderRadius } = sizeMap[size];
  const [hasError, setHasError] = React.useState(false);

  const effectiveBadgeColor = badgeColor || colors.success;

  const imageSource = React.useMemo(() => {
    if (!uri || hasError) return null;
    if (typeof uri === 'string') {
      return { uri };
    }
    return uri;
  }, [uri, hasError]);

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius,
      backgroundColor: colors.surfaceSubtle,
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.image, { width: dimension, height: dimension, borderRadius, backgroundColor: colors.surfaceSubtle }]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius,
              backgroundColor: colors.primaryLight,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize, color: colors.primaryDark }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {badge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: effectiveBadgeColor,
              width: Math.max(8, dimension * 0.25),
              height: Math.max(8, dimension * 0.25),
              borderRadius: radius.full,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    ...typography.buttonSmall,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
  },
});
