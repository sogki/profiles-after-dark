import { buildSmoothGradient, getFlairAnimationClass, hexToRgbCss, parseFlairGradient } from '@/lib/flairName';

interface FlairNameTextProps {
  name: string;
  animation?: string | null;
  gradientJson?: string | null;
  className?: string;
}

export default function FlairNameText({
  name,
  animation = 'none',
  gradientJson,
  className = '',
}: FlairNameTextProps) {
  const { colors, rainbowMode } = parseFlairGradient(gradientJson);
  const [mainColor, accentColor, secondaryColor = accentColor] = colors;
  const animationClass = getFlairAnimationClass(animation);
  const hasCustomGradient = Boolean(gradientJson && gradientJson.trim().length > 0);
  const shouldUseDefaultRainbow = animation === 'rainbow' && rainbowMode !== 'custom';
  const gradientStyle =
    animation === 'none' && !hasCustomGradient && !shouldUseDefaultRainbow
      ? {
          // Let caller classes (e.g. text-white) control default text color.
          lineHeight: 1.2,
          overflow: 'visible',
          paddingTop: '0.06em',
          paddingBottom: '0.08em',
        }
      : {
          backgroundImage: shouldUseDefaultRainbow
            ? undefined
            : buildSmoothGradient(colors),
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          lineHeight: 1.2,
          overflow: 'visible',
          paddingTop: '0.06em',
          paddingBottom: '0.08em',
          backgroundSize:
            animation === 'gradient'
              ? '240% auto'
              : animation === 'scroll' || animation === 'rainbow'
                ? '200% auto'
                : '180% auto',
          ['--flair-main' as string]: mainColor,
          ['--flair-accent' as string]: accentColor,
          ['--flair-secondary' as string]: secondaryColor,
          ['--flair-main-rgb' as string]: hexToRgbCss(mainColor),
          ['--flair-accent-rgb' as string]: hexToRgbCss(accentColor),
          ['--flair-secondary-rgb' as string]: hexToRgbCss(secondaryColor),
        };

  return (
    <span className={`inline-block ${animationClass} ${className}`.trim()} style={gradientStyle}>
      {name}
    </span>
  );
}
