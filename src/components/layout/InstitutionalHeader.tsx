import React from 'react';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { HeaderIconButton, TabHeader } from './TabHeader';

export interface InstitutionalHeaderProps {
  onSearchPress?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Home's branded header — the brand variant of the shared TabHeader, so it has
 * the same height, spacing and divider as every other tab. (The theme toggle
 * lives in Profile → Settings.)
 */
export const InstitutionalHeader: React.FC<InstitutionalHeaderProps> = ({ onSearchPress, title, subtitle }) => {
  const { colors } = useTheme();
  return (
    <TabHeader
      brand
      title={title}
      subtitle={subtitle}
      right={
        onSearchPress ? (
          <HeaderIconButton
            icon={<Search size={18} color={colors.textPrimary} />}
            onPress={onSearchPress}
            label="Search research and people"
          />
        ) : null
      }
    />
  );
};
