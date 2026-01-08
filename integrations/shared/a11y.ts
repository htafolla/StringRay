/**
 * StrRay Accessibility (A11y) Utilities v1.0.0
 *
 * WCAG 2.1 AA compliant accessibility utilities and helpers
 * for building inclusive interfaces across all frameworks.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Accessibility interfaces
export interface AriaProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-pressed"?: boolean | "mixed";
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  "aria-disabled"?: boolean;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-errormessage"?: string;
  "aria-live"?: "off" | "assertive" | "polite";
  "aria-atomic"?: boolean;
  role?: string;
  tabindex?: number;
}

export interface FocusManagementOptions {
  restoreFocus?: boolean;
  initialFocus?: HTMLElement;
  containFocus?: boolean;
}

export interface KeyboardNavigationOptions {
  keyHandlers: Record<string, (event: KeyboardEvent) => void>;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// Core accessibility utilities
export class StrRayAccessibility {
  private focusStack: HTMLElement[] = [];
  private liveRegions = new Map<string, HTMLElement>();

  // ARIA property helpers
  createAriaProps(props: Partial<AriaProps> = {}): AriaProps {
    const ariaProps: AriaProps = {};

    if (props["aria-label"]) ariaProps["aria-label"] = props["aria-label"];
    if (props["aria-labelledby"])
      ariaProps["aria-labelledby"] = props["aria-labelledby"];
    if (props["aria-describedby"])
      ariaProps["aria-describedby"] = props["aria-describedby"];
    if (props["aria-expanded"] !== undefined)
      ariaProps["aria-expanded"] = props["aria-expanded"];
    if (props["aria-selected"] !== undefined)
      ariaProps["aria-selected"] = props["aria-selected"];
    if (props["aria-checked"] !== undefined)
      ariaProps["aria-checked"] = props["aria-checked"];
    if (props["aria-pressed"] !== undefined)
      ariaProps["aria-pressed"] = props["aria-pressed"];
    if (props["aria-current"] !== undefined)
      ariaProps["aria-current"] = props["aria-current"];
    if (props["aria-disabled"] !== undefined)
      ariaProps["aria-disabled"] = props["aria-disabled"];
    if (props["aria-required"] !== undefined)
      ariaProps["aria-required"] = props["aria-required"];
    if (props["aria-invalid"] !== undefined)
      ariaProps["aria-invalid"] = props["aria-invalid"];
    if (props["aria-errormessage"])
      ariaProps["aria-errormessage"] = props["aria-errormessage"];
    if (props["aria-live"]) ariaProps["aria-live"] = props["aria-live"];
    if (props["aria-atomic"] !== undefined)
      ariaProps["aria-atomic"] = props["aria-atomic"];
    if (props.role) ariaProps.role = props.role;
    if (props.tabindex !== undefined) ariaProps.tabindex = props.tabindex;

    return ariaProps;
  }

  // Focus management
  focusElement(element: HTMLElement): void {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  }

  trapFocus(
    container: HTMLElement,
    options: FocusManagementOptions = {},
  ): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = options.initialFocus || focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (event.key === "Escape" && options.restoreFocus) {
        event.preventDefault();
        this.restoreFocus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Focus initial element
    if (firstElement) {
      this.pushFocus(firstElement);
      firstElement.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (options.restoreFocus) {
        this.restoreFocus();
      }
    };
  }

  pushFocus(element: HTMLElement): void {
    this.focusStack.push(element);
  }

  restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(", "));
    return Array.from(elements) as HTMLElement[];
  }

  // Live regions for dynamic content
  createLiveRegion(
    id: string,
    priority: "polite" | "assertive" = "polite",
  ): HTMLElement {
    const region = document.createElement("div");
    region.id = id;
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.style.position = "absolute";
    region.style.left = "-10000px";
    region.style.width = "1px";
    region.style.height = "1px";
    region.style.overflow = "hidden";

    document.body.appendChild(region);
    this.liveRegions.set(id, region);

    return region;
  }

  updateLiveRegion(id: string, message: string): void {
    const region = this.liveRegions.get(id);
    if (region) {
      region.textContent = message;
    }
  }

  removeLiveRegion(id: string): void {
    const region = this.liveRegions.get(id);
    if (region) {
      document.body.removeChild(region);
      this.liveRegions.delete(id);
    }
  }

  // Keyboard navigation
  setupKeyboardNavigation(
    element: HTMLElement,
    options: KeyboardNavigationOptions,
  ): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      const handler = options.keyHandlers[event.key];
      if (handler) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        if (options.stopPropagation) {
          event.stopPropagation();
        }
        handler(event);
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }

  // Color contrast utilities
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  isWCAGCompliant(
    color1: string,
    color2: string,
    level: "AA" | "AAA" = "AA",
  ): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === "AA" ? ratio >= 4.5 : ratio >= 7;
  }

  private getLuminance(color: string): number {
    // Convert hex to RGB and calculate relative luminance
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  }

  // Screen reader announcements
  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.overflow = "hidden";

    document.body.appendChild(announcement);

    // Use setTimeout to ensure screen readers pick up the change
    setTimeout(() => {
      announcement.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, 100);
  }

  // Skip links
  createSkipLink(
    targetId: string,
    text: string = "Skip to main content",
  ): HTMLElement {
    const link = document.createElement("a");
    link.href = `#${targetId}`;
    link.textContent = text;
    link.className =
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded";
    link.style.position = "absolute";
    link.style.left = "-9999px";

    link.addEventListener("focus", () => {
      link.style.left = "1rem";
    });

    link.addEventListener("blur", () => {
      link.style.left = "-9999px";
    });

    return link;
  }
}

// Global accessibility instance
export const strRayA11y = new StrRayAccessibility();

// Common ARIA patterns
export const ariaPatterns = {
  button: (props: {
    pressed?: boolean;
    expanded?: boolean;
    label?: string;
  }) => ({
    role: "button",
    "aria-pressed": props.pressed,
    "aria-expanded": props.expanded,
    "aria-label": props.label,
    tabindex: 0,
  }),

  dialog: (props: { label?: string; describedBy?: string }) => ({
    role: "dialog",
    "aria-labelledby": props.label,
    "aria-describedby": props.describedBy,
    "aria-modal": true,
  }),

  menu: (props: { label?: string }) => ({
    role: "menu",
    "aria-label": props.label,
  }),

  menuitem: (props: { disabled?: boolean; selected?: boolean }) => ({
    role: "menuitem",
    "aria-disabled": props.disabled,
    "aria-selected": props.selected,
  }),

  listbox: (props: { label?: string; multiselectable?: boolean }) => ({
    role: "listbox",
    "aria-label": props.label,
    "aria-multiselectable": props.multiselectable,
  }),

  option: (props: { selected?: boolean; disabled?: boolean }) => ({
    role: "option",
    "aria-selected": props.selected,
    "aria-disabled": props.disabled,
  }),

  tablist: (props: { label?: string }) => ({
    role: "tablist",
    "aria-label": props.label,
  }),

  tab: (props: {
    selected?: boolean;
    disabled?: boolean;
    controls?: string;
  }) => ({
    role: "tab",
    "aria-selected": props.selected,
    "aria-disabled": props.disabled,
    "aria-controls": props.controls,
    tabindex: props.selected ? 0 : -1,
  }),

  tabpanel: (props: { labelledBy?: string }) => ({
    role: "tabpanel",
    "aria-labelledby": props.labelledBy,
  }),
};

// Keyboard navigation patterns
export const keyboardPatterns = {
  arrowNavigation: (
    items: HTMLElement[],
    currentIndex: number,
    direction: "up" | "down" | "left" | "right",
  ) => {
    let newIndex = currentIndex;

    switch (direction) {
      case "up":
      case "left":
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case "down":
      case "right":
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    items[newIndex]?.focus();
    return newIndex;
  },

  homeEndNavigation: (items: HTMLElement[], key: "Home" | "End") => {
    const targetIndex = key === "Home" ? 0 : items.length - 1;
    items[targetIndex]?.focus();
    return targetIndex;
  },

  typeAheadNavigation: (
    items: HTMLElement[],
    typedChar: string,
    currentIndex: number,
  ) => {
    const currentItem = items[currentIndex];
    if (!currentItem?.textContent) return currentIndex;

    // Find next item that starts with the typed character
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (
        items[i].textContent?.toLowerCase().startsWith(typedChar.toLowerCase())
      ) {
        items[i].focus();
        return i;
      }
    }

    // Wrap around to beginning
    for (let i = 0; i < currentIndex; i++) {
      if (
        items[i].textContent?.toLowerCase().startsWith(typedChar.toLowerCase())
      ) {
        items[i].focus();
        return i;
      }
    }

    return currentIndex;
  },
};
