/**
 * Utility functions for handling filename-based schema type encoding
 * Format: $name.$schemaType.md
 */

export interface ParsedFilename {
  name: string;
  schemaType: string;
  fullPath: string;
}

/**
 * Parse a filename to extract name and schema type
 * @param filename - The filename to parse (e.g., "customer-service.simple-agent.md")
 * @returns Parsed filename components or null if invalid format
 */
export function parseFilename(filename: string): ParsedFilename | null {
  // Remove directory path if present and get just the filename
  const baseName = filename.split('/').pop() || filename;
  
  // Check if it ends with .md
  if (!baseName.endsWith('.md')) {
    return null;
  }
  
  // Remove .md extension
  const nameWithoutMd = baseName.slice(0, -3);
  
  // Split by dots to get parts
  const parts = nameWithoutMd.split('.');
  
  // Must have at least 2 parts: name and schemaType
  if (parts.length < 2) {
    return null;
  }
  
  // Last part is schema type, everything else is the name
  const schemaType = parts[parts.length - 1];
  const name = parts.slice(0, -1).join('.');
  
  if (!name || !schemaType) {
    return null;
  }
  
  return {
    name,
    schemaType,
    fullPath: filename,
  };
}

/**
 * Build a filename from name and schema type
 * @param name - The file name
 * @param schemaType - The schema type
 * @returns The constructed filename
 */
export function buildFilename(name: string, schemaType: string): string {
  return `${name}.${schemaType}.md`;
}

/**
 * Extract display name from filename
 * @param filename - The filename (e.g., "customer-service.simple-agent.md")
 * @returns The display name (e.g., "customer-service") or the original filename if parsing fails
 */
export function getDisplayName(filename: string): string {
  const parsed = parseFilename(filename);
  return parsed ? parsed.name : filename.replace('.md', '');
}

/**
 * Extract schema type from filename
 * @param filename - The filename (e.g., "customer-service.simple-agent.md")
 * @returns The schema type (e.g., "simple-agent") or null if parsing fails
 */
export function getSchemaType(filename: string): string | null {
  const parsed = parseFilename(filename);
  return parsed ? parsed.schemaType : null;
}

/**
 * Validate filename format
 * @param filename - The filename to validate
 * @returns True if the filename follows the correct format
 */
export function isValidFilenameFormat(filename: string): boolean {
  return parseFilename(filename) !== null;
}