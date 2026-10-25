import React from 'react';
import { InstitutionalHeader, InstitutionalHeaderProps } from '../layout/InstitutionalHeader';

export interface HomeHeaderProps extends InstitutionalHeaderProps {}

export const HomeHeader: React.FC<HomeHeaderProps> = (props) => {
  return <InstitutionalHeader {...props} />;
};
