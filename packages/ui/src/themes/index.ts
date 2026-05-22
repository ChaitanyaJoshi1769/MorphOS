/**
 * MorphOS Themes
 *
 * Adaptive theme system for MorphOS applications.
 */

export const lightTheme = {
  colors: {
    primary: "#3B82F6",
    secondary: "#10B981",
    accent: "#F59E0B",
    background: "#FFFFFF",
    surface: "#F3F4F6",
    text: "#1F2937",
    border: "#E5E7EB",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
};

export const darkTheme = {
  colors: {
    primary: "#60A5FA",
    secondary: "#34D399",
    accent: "#FBBF24",
    background: "#111827",
    surface: "#1F2937",
    text: "#F3F4F6",
    border: "#374151",
  },
  spacing: lightTheme.spacing,
};

export type Theme = typeof lightTheme;
