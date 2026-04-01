#!/usr/bin/env node

/**
 * Entity Generator Script
 *
 * Generates TypeScript Entity classes for the frontend based on backend DTO and Schema files.
 * Usage: node generate-entity.js Product
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse DTO file to extract property definitions
 */
function parseDtoFile(entityName) {
  const dtoPath = path.join(
    __dirname,
    `../../backend/src/resources/${entityName.toLowerCase()}s/dto/${entityName.toLowerCase()}.base.dto.ts`
  );

  if (!fs.existsSync(dtoPath)) {
    console.log(`DTO file not found: ${dtoPath}`);
    return [];
  }

  const content = fs.readFileSync(dtoPath, 'utf-8');
  const properties = [];

  // Split into lines and process each line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and lines starting with @
    if (!line || line.startsWith('@') || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }
    
    // Look for property declarations like: propertyName!: type or propertyName?: type
    const match = line.match(/(\w+)([?!]?):\s*(.+)/);
    if (match) {
      const [, propName, optional, typeStr] = match;
      
      // Skip if it's not a valid property (check for common keywords)
      if (['class', 'export', 'import', 'const', 'let', 'var', 'function', 'extends', 'implements'].includes(propName)) {
        continue;
      }
      
      let type = typeStr.trim().split('|')[0].trim();
      
      properties.push({
        name: propName,
        type: type,
        required: optional !== '?',
      });
    }
  }

  return properties;
}

/**
 * Parse Schema file to extract Enums and Interfaces
 */
function parseSchemaFile(entityName) {
  const schemaPath = path.join(
    __dirname,
    `../../backend/src/database/schemas/${entityName.toLowerCase()}.schema.ts`
  );

  const enums = new Map();
  const interfaces = new Map();

  if (!fs.existsSync(schemaPath)) {
    return { enums, interfaces };
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');

  // Extract Enums
  const enumRegex = /export\s+enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(content)) !== null) {
    const [, enumName, enumBody] = enumMatch;
    const values = enumBody
      .split(',')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => {
        const match = line.match(/(\w+)\s*=\s*"([^"]+)"/);
        return match ? `${match[1]} = "${match[2]}"` : line;
      });
    enums.set(enumName, values);
  }

  // Extract Type definitions (interfaces and types)
  const typeRegex = /export\s+type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
  let typeMatch;
  while ((typeMatch = typeRegex.exec(content)) !== null) {
    const [, typeName, typeBody] = typeMatch;
    interfaces.set(typeName, typeBody.trim());
  }

  return { enums, interfaces };
}

/**
 * Generate TypeScript property code
 */
function generateProperties(properties) {
  if (properties.length === 0) {
    return '  // No properties defined yet';
  }

  return properties
    .map(prop => {
      const required = prop.required ? '' : '?';
      return `  ${prop.name}${required}: ${prop.type};`;
    })
    .join('\n');
}

/**
 * Generate TypeScript enum code
 */
function generateEnums(enums) {
  if (enums.size === 0) return '';

  let code = '';
  enums.forEach((values, enumName) => {
    code += `\nexport enum ${enumName} {\n`;
    values.forEach(value => {
      code += `  ${value},\n`;
    });
    code += '}\n';
  });

  return code;
}

/**
 * Generate TypeScript interface/type code
 */
function generateInterfaces(interfaces) {
  if (interfaces.size === 0) return '';

  let code = '';
  interfaces.forEach((body, interfaceName) => {
    code += `\nexport interface ${interfaceName} {\n`;
    const lines = body.split(';').map(line => line.trim()).filter(line => line);
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        code += `  ${trimmedLine};\n`;
      }
    });
    code += '}\n';
  });

  return code;
}

/**
 * Generate complete TypeScript entity class
 */
function generateEntityClass(entityName, properties, enums, interfaces) {
  const className = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const baseProperties = generateProperties(properties);
  const enumCode = generateEnums(enums);
  const interfaceCode = generateInterfaces(interfaces);

  return `import { BaseEntity } from './BaseEntity';

${enumCode}${interfaceCode}
/**
 * ${className} Entity
 *
 * Represents a ${className} record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class ${className} extends BaseEntity {
${baseProperties}

  /**
   * Static method to filter ${className} records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<${className}[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new ${className}
   *
   * @param data Object with ${className} properties
   * @returns Promise<${className}>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a ${className}
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<${className}>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a ${className}
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a ${className} by ID
   *
   * @param id The entity ID
   * @returns Promise<${className} | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
`;
}

/**
 * Main generation function
 */
function generateEntity(entityName) {
  try {
    // Parse DTO
    const properties = parseDtoFile(entityName);

    // Parse Schema for enums and interfaces
    const { enums, interfaces } = parseSchemaFile(entityName);

    // Generate entity class code
    const code = generateEntityClass(entityName, properties, enums, interfaces);

    // Determine output path
    const outputPath = path.join(__dirname, `../src/entities/${entityName}.ts`);
    const outputDir = path.dirname(outputPath);

    // Create directory if needed
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(outputPath, code, 'utf-8');

    console.log(`✅ ${entityName}`);
    return true;
  } catch (error) {
    console.error(`❌ ${entityName}: ${error.message}`);
    return false;
  }
}

// Main execution
const entityName = process.argv[2];

if (!entityName) {
  console.error('❌ Usage: node generate-entity.js <EntityName>');
  console.error('Example: node generate-entity.js Product');
  process.exit(1);
}

generateEntity(entityName);