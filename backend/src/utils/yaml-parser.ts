/**
 * Simple YAML parser for frontmatter
 * Handles basic YAML structures commonly found in template frontmatter
 */

export function parseSimpleYaml(yamlText: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlText.split('\n');
  let currentKey = '';
  let currentObject: Record<string, any> = result;
  const objectStack: Array<{ key: string; obj: Record<string, any> }> = [];

  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Handle object properties
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Check if this starts a nested object
      if (!value || value === '') {
        // This is a nested object
        const newObject = {};
        currentObject[key] = newObject;
        objectStack.push({ key, obj: currentObject });
        currentObject = newObject;
        currentKey = key;
        continue;
      }

      // Parse the value
      currentObject[key] = parseValue(value);
    } else if (line.startsWith('-')) {
      // Handle array items (simple implementation)
      let value = line.substring(1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (!Array.isArray(currentObject[currentKey])) {
        currentObject[currentKey] = [];
      }
      (currentObject[currentKey] as any[]).push(parseValue(value));
    } else {
      // Check if we need to pop back to parent object
      const indentLevel = getIndentLevel(line);
      if (indentLevel === 0 && objectStack.length > 0) {
        // Pop back to root level
        while (objectStack.length > 0) {
          const parent = objectStack.pop()!;
          currentObject = parent.obj;
        }
      }
    }
  }

  return result;
}

function parseValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Convert boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // Convert numbers
  if (!isNaN(Number(value)) && value !== '' && !isNaN(parseFloat(value))) {
    return Number(value);
  }

  // Handle arrays (simple bracket notation)
  if (value.startsWith('[') && value.endsWith(']')) {
    const arrayContent = value.slice(1, -1);
    if (!arrayContent.trim()) return [];
    
    return arrayContent.split(',').map(item => {
      const trimmed = item.trim();
      return parseValue(trimmed);
    });
  }

  // Return as string
  return value;
}

function getIndentLevel(line: string): number {
  let indent = 0;
  for (const char of line) {
    if (char === ' ') {
      indent++;
    } else if (char === '\t') {
      indent += 2; // Treat tab as 2 spaces
    } else {
      break;
    }
  }
  return indent;
}

/**
 * Parse markdown file with YAML frontmatter
 */
export function parseMarkdownWithFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      content: content
    };
  }
  
  const frontmatterText = match[1];
  const markdownContent = match[2];
  
  try {
    const frontmatter = parseSimpleYaml(frontmatterText);
    return {
      frontmatter,
      content: markdownContent
    };
  } catch (error) {
    console.warn('Failed to parse YAML frontmatter:', error);
    return {
      frontmatter: {},
      content: markdownContent
    };
  }
}