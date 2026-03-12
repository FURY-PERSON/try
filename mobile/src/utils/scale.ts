import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const isTablet = Platform.isPad || width >= 600;

const TABLET_SCALE = 1.4;

/** Scale a numeric value on tablets, return as-is on phones */
export const s = (value: number): number =>
  isTablet ? Math.round(value * TABLET_SCALE) : value;
