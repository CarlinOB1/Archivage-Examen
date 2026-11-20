import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const isCompact = width < 600;
  const isTablet = width >= 768;

  return {
    width,
    height,
    isSmall,
    isCompact,
    isTablet,
    horizontalPadding: isSmall ? 12 : isTablet ? 24 : 16,
    contentMaxWidth: isTablet ? 960 : 800,
  };
}
