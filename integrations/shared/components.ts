/**
 * StrRay Cross-Framework Component Library v1.0.0
 *
 * Framework-agnostic UI components that work across React, Vue, Angular, and Svelte
 * with unified theming, accessibility, and performance optimizations.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Core component interfaces
export interface ComponentProps {
  className?: string;
  style?: Record<string, any>;
  children?: any;
  id?: string;
  'data-testid'?: string;
}

export interface StrRayComponent {
  name: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  render: (props: ComponentProps) => any;
  theme?: ComponentTheme;
}

// Unified theme system
export interface ComponentTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      light: number;
      regular: number;
      medium: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      loose: number;
    };
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// Default StrRay theme
export const defaultStrRayTheme: ComponentTheme = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      loose: 1.75
    }
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

// Base component styles (CSS-in-JS approach)
export const createComponentStyles = (theme: ComponentTheme = defaultStrRayTheme) => ({
  // Button styles
  button: {
    base: `
      font-family: ${theme.typography.fontFamily};
      font-size: ${theme.typography.fontSize.md};
      font-weight: ${theme.typography.fontWeight.medium};
      line-height: ${theme.typography.lineHeight.normal};
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      border-radius: ${theme.borderRadius.md};
      border: 1px solid transparent;
      cursor: pointer;
      transition: all ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${theme.spacing.sm};
      text-decoration: none;
      user-select: none;
    `,
    variants: {
      primary: `
        background-color: ${theme.colors.primary};
        color: white;
        border-color: ${theme.colors.primary};
        &:hover {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
        }
        &:focus {
          outline: 2px solid ${theme.colors.primary};
          outline-offset: 2px;
        }
      `,
      secondary: `
        background-color: ${theme.colors.secondary};
        color: white;
        border-color: ${theme.colors.secondary};
        &:hover {
          background-color: #475569;
          border-color: #475569;
        }
      `,
      outline: `
        background-color: transparent;
        color: ${theme.colors.primary};
        border-color: ${theme.colors.primary};
        &:hover {
          background-color: ${theme.colors.primary};
          color: white;
        }
      `,
      ghost: `
        background-color: transparent;
        color: ${theme.colors.text};
        border-color: transparent;
        &:hover {
          background-color: ${theme.colors.surface};
        }
      `
    },
    sizes: {
      sm: `
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.typography.fontSize.sm};
      `,
      md: `
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.typography.fontSize.md};
      `,
      lg: `
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        font-size: ${theme.typography.fontSize.lg};
      `
    }
  },

  // Card styles
  card: {
    base: `
      background-color: ${theme.colors.background};
      border-radius: ${theme.borderRadius.lg};
      box-shadow: ${theme.shadows.md};
      padding: ${theme.spacing.lg};
      border: 1px solid #e2e8f0;
    `,
    variants: {
      elevated: `
        box-shadow: ${theme.shadows.lg};
      `,
      outlined: `
        box-shadow: none;
        border: 2px solid #e2e8f0;
      `,
      filled: `
        background-color: ${theme.colors.surface};
      `
    }
  },

  // Input styles
  input: {
    base: `
      font-family: ${theme.typography.fontFamily};
      font-size: ${theme.typography.fontSize.md};
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      border: 1px solid #d1d5db;
      border-radius: ${theme.borderRadius.md};
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      transition: border-color ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut},
                  box-shadow ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut};
      width: 100%;
      &:focus {
        outline: none;
        border-color: ${theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
      &::placeholder {
        color: #9ca3af;
      }
    `,
    states: {
      error: `
        border-color: ${theme.colors.error};
        &:focus {
          border-color: ${theme.colors.error};
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `,
      disabled: `
        background-color: #f9fafb;
        color: #9ca3af;
        cursor: not-allowed;
      `
    }
  },

  // Loading spinner
  spinner: {
    base: `
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid ${theme.colors.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `,
    '@keyframes spin': `
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    `
  }
});

// Framework-agnostic component registry
export class ComponentRegistry {
  private components = new Map<string, Map<string, StrRayComponent>>();
  private themes = new Map<string, ComponentTheme>();

  registerComponent(framework: string, component: StrRayComponent): void {
    if (!this.components.has(framework)) {
      this.components.set(framework, new Map());
    }
    this.components.get(framework)!.set(component.name, component);
  }

  getComponent(framework: string, name: string): StrRayComponent | undefined {
    return this.components.get(framework)?.get(name);
  }

  registerTheme(name: string, theme: ComponentTheme): void {
    this.themes.set(name, theme);
  }

  getTheme(name: string): ComponentTheme | undefined {
    return this.themes.get(name);
  }

  getAllThemes(): Map<string, ComponentTheme> {
    return this.themes;
  }
}

// Global component registry instance
export const componentRegistry = new ComponentRegistry();

// Initialize default theme
componentRegistry.registerTheme('default', defaultStrRayTheme);

// Utility functions for cross-framework development
export const createComponentId = (prefix: string = 'strray') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const mergeThemes = (baseTheme: ComponentTheme, overrides: Partial<ComponentTheme>): ComponentTheme => {
  return {
    ...baseTheme,
    ...overrides,
    colors: { ...baseTheme.colors, ...overrides.colors },
    spacing: { ...baseTheme.spacing, ...overrides.spacing },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
      fontSize: { ...baseTheme.typography.fontSize, ...overrides.typography?.fontSize },
      fontWeight: { ...baseTheme.typography.fontWeight, ...overrides.typography?.fontWeight },
      lineHeight: { ...baseTheme.typography.lineHeight, ...overrides.typography?.lineHeight }
    },
    borderRadius: { ...baseTheme.borderRadius, ...overrides.borderRadius },
    shadows: { ...baseTheme.shadows, ...overrides.shadows },
    animations: {
      ...baseTheme.animations,
      ...overrides.animations,
      duration: { ...baseTheme.animations.duration, ...overrides.animations?.duration },
      easing: { ...baseTheme.animations.easing, ...overrides.animations?.easing }
    }
  };
};

export const createResponsiveStyles = (breakpoints: Record<string, any>) => {
  // Framework-specific responsive utilities would be implemented here
  return breakpoints;
};

// Accessibility utilities
export const createAriaProps = (props: Record<string, any>) => {
  const ariaProps: Record<string, any> = {};

  if (props.label) ariaProps['aria-label'] = props.label;
  if (props.describedBy) ariaProps['aria-describedby'] = props.describedBy;
  if (props.expanded !== undefined) ariaProps['aria-expanded'] = props.expanded;
  if (props.disabled) ariaProps['aria-disabled'] = true;
  if (props.required) ariaProps['aria-required'] = true;
  if (props.invalid) ariaProps['aria-invalid'] = true;

  return ariaProps;
};

// Performance utilities
export const createOptimizedComponent = (component: StrRayComponent) => {
  // Add performance optimizations like memoization, lazy loading, etc.
  return {
    ...component,
    optimized: true
  };
};