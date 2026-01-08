/**
 * StrRay Internationalization (i18n) System v1.0.0
 *
 * Unified internationalization support across React, Vue, Angular, and Svelte
 * with framework-agnostic message loading and formatting.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// i18n interfaces
export interface TranslationMessages {
  [key: string]: string | TranslationMessages;
}

export interface I18nConfig {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, TranslationMessages>;
  dateTimeFormats?: Record<string, any>;
  numberFormats?: Record<string, any>;
}

export interface I18nInstance {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, TranslationMessages>;
  t: (key: string, params?: Record<string, any>) => string;
  tc: (key: string, count: number, params?: Record<string, any>) => string;
  te: (key: string) => boolean;
  tm: (key: string) => TranslationMessages | string;
  setLocale: (locale: string) => void;
  mergeMessages: (locale: string, messages: TranslationMessages) => void;
}

// Default StrRay messages
export const defaultStrRayMessages: Record<string, TranslationMessages> = {
  en: {
    strray: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      export: "Export",
      import: "Import",
      validation: {
        required: "This field is required",
        email: "Please enter a valid email",
        minLength: "Minimum length is {min}",
        maxLength: "Maximum length is {max}",
        pattern: "Invalid format",
      },
      agents: {
        enforcer: "Code Quality Enforcer",
        architect: "System Architect",
        orchestrator: "Task Orchestrator",
        "bug-triage-specialist": "Bug Triage Specialist",
        "code-reviewer": "Code Reviewer",
        "security-auditor": "Security Auditor",
        refactorer: "Code Refactorer",
        "test-architect": "Test Architect",
      },
      codex: {
        rules: "Codex Rules",
        violations: "Rule Violations",
        compliance: "Compliance Score",
        suggestions: "Suggestions",
      },
    },
  },
  es: {
    strray: {
      loading: "Cargando...",
      error: "Ocurrió un error",
      success: "Éxito",
      cancel: "Cancelar",
      confirm: "Confirmar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      export: "Exportar",
      import: "Importar",
      validation: {
        required: "Este campo es obligatorio",
        email: "Por favor ingrese un email válido",
        minLength: "La longitud mínima es {min}",
        maxLength: "La longitud máxima es {max}",
        pattern: "Formato inválido",
      },
      agents: {
        enforcer: "Ejecutor de Calidad de Código",
        architect: "Arquitecto de Sistema",
        orchestrator: "Orquestador de Tareas",
        "bug-triage-specialist": "Especialista en Clasificación de Bugs",
        "code-reviewer": "Revisor de Código",
        "security-auditor": "Auditor de Seguridad",
        refactorer: "Refactorizador de Código",
        "test-architect": "Arquitecto de Pruebas",
      },
      codex: {
        rules: "Reglas del Codex",
        violations: "Violaciones de Reglas",
        compliance: "Puntuación de Cumplimiento",
        suggestions: "Sugerencias",
      },
    },
  },
  fr: {
    strray: {
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      success: "Succès",
      cancel: "Annuler",
      confirm: "Confirmer",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      create: "Créer",
      search: "Rechercher",
      filter: "Filtrer",
      sort: "Trier",
      export: "Exporter",
      import: "Importer",
      validation: {
        required: "Ce champ est obligatoire",
        email: "Veuillez saisir un email valide",
        minLength: "La longueur minimale est {min}",
        maxLength: "La longueur maximale est {max}",
        pattern: "Format invalide",
      },
      agents: {
        enforcer: "Exécuteur de Qualité de Code",
        architect: "Architecte Système",
        orchestrator: "Orchestrateur de Tâches",
        "bug-triage-specialist": "Spécialiste en Tri des Bugs",
        "code-reviewer": "Relecteur de Code",
        "security-auditor": "Auditeur de Sécurité",
        refactorer: "Refactorisateur de Code",
        "test-architect": "Architecte de Tests",
      },
      codex: {
        rules: "Règles du Codex",
        violations: "Violations de Règles",
        compliance: "Score de Conformité",
        suggestions: "Suggestions",
      },
    },
  },
};

// Core i18n implementation
export class StrRayI18n implements I18nInstance {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, TranslationMessages>;

  constructor(config: I18nConfig) {
    this.locale = config.locale;
    this.fallbackLocale = config.fallbackLocale;
    this.messages = { ...defaultStrRayMessages, ...config.messages };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private interpolate(
    message: string,
    params: Record<string, any> = {},
  ): string {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  t(key: string, params?: Record<string, any>): string {
    let message = this.getNestedValue(this.messages[this.locale], key);

    if (message === undefined && this.locale !== this.fallbackLocale) {
      message = this.getNestedValue(this.messages[this.fallbackLocale], key);
    }

    if (typeof message !== "string") {
      console.warn(`[StrRay i18n] Missing translation for key: ${key}`);
      return key;
    }

    return this.interpolate(message, params);
  }

  tc(key: string, count: number, params?: Record<string, any>): string {
    // Handle pluralization (simple implementation)
    const singularKey = key;
    const pluralKey = `${key}_plural`;

    let message: string;
    if (count === 1) {
      message = this.t(singularKey, params);
    } else {
      message = this.t(pluralKey, params) || this.t(singularKey, params);
    }

    return message.replace("{count}", String(count));
  }

  te(key: string): boolean {
    const message = this.getNestedValue(this.messages[this.locale], key);
    return (
      message !== undefined ||
      (this.locale !== this.fallbackLocale &&
        this.getNestedValue(this.messages[this.fallbackLocale], key) !==
          undefined)
    );
  }

  tm(key: string): TranslationMessages | string {
    let messages = this.getNestedValue(this.messages[this.locale], key);

    if (messages === undefined && this.locale !== this.fallbackLocale) {
      messages = this.getNestedValue(this.messages[this.fallbackLocale], key);
    }

    return messages || {};
  }

  setLocale(locale: string): void {
    if (this.messages[locale]) {
      this.locale = locale;
    } else {
      console.warn(`[StrRay i18n] Locale '${locale}' not available`);
    }
  }

  mergeMessages(locale: string, messages: TranslationMessages): void {
    if (!this.messages[locale]) {
      this.messages[locale] = {};
    }
    this.messages[locale] = this.deepMerge(this.messages[locale], messages);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    Object.keys(source).forEach((key) => {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  }
}

// Factory function
export function createStrRayI18n(config: Partial<I18nConfig> = {}): StrRayI18n {
  const defaultConfig: I18nConfig = {
    locale: "en",
    fallbackLocale: "en",
    messages: defaultStrRayMessages,
  };

  return new StrRayI18n({ ...defaultConfig, ...config });
}

// Global i18n instance
export const strRayI18n = createStrRayI18n();

// Date/time formatting utilities
export const formatDate = (
  date: Date,
  locale: string = strRayI18n.locale,
  options?: Intl.DateTimeFormatOptions,
): string => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatNumber = (
  number: number,
  locale: string = strRayI18n.locale,
  options?: Intl.NumberFormatOptions,
): string => {
  return new Intl.NumberFormat(locale, options).format(number);
};

export const formatRelativeTime = (
  date: Date,
  locale: string = strRayI18n.locale,
): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInMinutes < 1) return rtf.format(0, "second");
  if (diffInMinutes < 60) return rtf.format(-diffInMinutes, "minute");
  if (diffInHours < 24) return rtf.format(-diffInHours, "hour");
  return rtf.format(-diffInDays, "day");
};
