/**
 * Test Template Generator for StrRay Framework
 *
 * Automatically generates test templates for different file types
 * to ensure consistent test coverage and structure.
 */

export interface TestTemplateOptions {
  filePath: string;
  componentName?: string;
  exports?: string[];
  isReact?: boolean;
  isTypeScript?: boolean;
}

/**
 * Generate a test template based on file type and structure
 */
export function generateTestTemplate(options: TestTemplateOptions): string {
  const { filePath, componentName, exports = [], isReact = false, isTypeScript = false } = options;

  const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Unknown';
  const testFileName = `${fileName}.test.${isTypeScript ? 'ts' : 'js'}${isReact ? 'x' : ''}`;

  if (isReact) {
    return generateReactTestTemplate(fileName, componentName || fileName, isTypeScript);
  }

  return generateUnitTestTemplate(fileName, exports, isTypeScript);
}

/**
 * Generate React component test template
 */
function generateReactTestTemplate(fileName: string, componentName: string, isTypeScript: boolean): string {
  const typeAnnotation = isTypeScript ? ': RenderResult' : '';
  const typeImport = isTypeScript ? ', RenderResult' : '';

  return `import { render, screen } from '@testing-library/react';
import { expect, describe, it${typeImport} } from '${isTypeScript ? 'vitest' : 'jest'}';
import { ${componentName} } from './${fileName}';

describe('${componentName}', () => {
  it('should render successfully', () => {
    const { container }${typeAnnotation} = render(<${componentName} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with default props', () => {
    render(<${componentName} />);
    // Add specific assertions based on component behavior
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  // Add more test cases based on component props and behavior
  // it('should handle prop changes', () => {
  //   const { rerender } = render(<${componentName} prop="value" />);
  //   expect(screen.getByText('value')).toBeInTheDocument();
  //
  //   rerender(<${componentName} prop="newValue" />);
  //   expect(screen.getByText('newValue')).toBeInTheDocument();
  // });

  // Add accessibility tests
  it('should be accessible', () => {
    const { container } = render(<${componentName} />);
    expect(container).toBeAccessible();
  });
});
`;
}

/**
 * Generate unit test template for utility functions/classes
 */
function generateUnitTestTemplate(fileName: string, exports: string[], isTypeScript: boolean): string {
  const describeBlocks = exports.map(exportName => {
    if (exportName.match(/^[A-Z]/)) {
      // Class export
      return generateClassTestTemplate(exportName);
    } else {
      // Function export
      return generateFunctionTestTemplate(exportName);
    }
  }).join('\n\n');

  return `import { expect, describe, it } from '${isTypeScript ? 'vitest' : 'jest'}';
${exports.length > 0 ? `import { ${exports.join(', ')} } from './${fileName}';` : `// import functions from './${fileName}'`}

${describeBlocks}

describe('${fileName}', () => {
  // Add general module tests here
  it('should export expected functions', () => {
    ${exports.length > 0 ? exports.map(exp => `expect(typeof ${exp}).toBe('function');`).join('\n    ') : '// Add export tests'}
  });
});
`;
}

/**
 * Generate test template for a class
 */
function generateClassTestTemplate(className: string): string {
  return `describe('${className}', () => {
  let instance: ${className};

  beforeEach(() => {
    // instance = new ${className}();
  });

  it('should create instance successfully', () => {
    // expect(instance).toBeInstanceOf(${className});
    expect(true).toBe(true); // Placeholder test
  });

  // Add method tests
  // it('should have expected methods', () => {
  //   expect(typeof instance.methodName).toBe('function');
  // });

  // Add property tests
  // it('should have expected properties', () => {
  //   expect(instance.propertyName).toBeDefined();
  // });
});`;
}

/**
 * Generate test template for a function
 */
function generateFunctionTestTemplate(functionName: string): string {
  return `describe('${functionName}', () => {
  it('should be a function', () => {
    expect(typeof ${functionName}).toBe('function');
  });

  it('should handle basic input', () => {
    // const result = ${functionName}(/* test input */);
    // expect(result).toBe(/* expected output */);
    expect(true).toBe(true); // Placeholder test
  });

  it('should handle edge cases', () => {
    // Test null, undefined, empty inputs
    // expect(() => ${functionName}(null)).toThrow();
    expect(true).toBe(true); // Placeholder test
  });

  // Add more specific test cases based on function behavior
});`;
}

/**
 * Analyze a source file to extract exports for test generation
 */
export function analyzeSourceFile(filePath: string): { exports: string[], isReact: boolean, isTypeScript: boolean } {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf-8');

    const exports: string[] = [];
    const isReact = /\b(React|jsx?|tsx?)\b/.test(content) || filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

    // Extract named exports
    const exportMatches = content.match(/export\s+(?:const|function|class|let|var)\s+(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach((match: string) => {
        const nameMatch = match.match(/(?:const|function|class|let|var)\s+(\w+)/);
        if (nameMatch && nameMatch[1] && !exports.includes(nameMatch[1])) {
          exports.push(nameMatch[1]);
        }
      });
    }

    // Extract default export if no named exports found
    if (exports.length === 0 && /export\s+default/.test(content)) {
      const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Component';
      exports.push(fileName.charAt(0).toUpperCase() + fileName.slice(1));
    }

    return { exports, isReact, isTypeScript };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return { exports: [], isReact: false, isTypeScript: false };
  }
}