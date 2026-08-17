import type { ThemeTokens } from '../types';

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', tokens.bgPrimary);
  root.style.setProperty('--bg-secondary', tokens.bgSecondary);
  root.style.setProperty('--bg-tertiary', tokens.bgTertiary);
  root.style.setProperty('--bg-card', tokens.bgCard);
  root.style.setProperty('--bg-hover', tokens.bgHover);
  
  root.style.setProperty('--text-primary', tokens.textPrimary);
  root.style.setProperty('--text-secondary', tokens.textSecondary);
  root.style.setProperty('--text-muted', tokens.textMuted);
  
  root.style.setProperty('--border-color', tokens.borderColor);
  root.style.setProperty('--border-focus', tokens.borderFocus);
  
  root.style.setProperty('--accent-primary', tokens.accentPrimary);
  root.style.setProperty('--accent-hover', tokens.accentHover);
  root.style.setProperty('--accent-light', tokens.accentLight || `${tokens.accentPrimary}25`);
}

export function clearCustomThemeTokens() {
  const root = document.documentElement;
  const props = [
    '--bg-primary',
    '--bg-secondary',
    '--bg-tertiary',
    '--bg-card',
    '--bg-hover',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--border-color',
    '--border-focus',
    '--accent-primary',
    '--accent-hover',
    '--accent-light',
  ];
  for (const prop of props) {
    root.style.removeProperty(prop);
  }
}

export function calculateContrastRatio(color1Hex: string, color2Hex: string): number {
  const getLuminance = (hex: string) => {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    const transform = (val: number) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
  };

  try {
    const l1 = getLuminance(color1Hex);
    const l2 = getLuminance(color2Hex);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 4.5;
  }
}
