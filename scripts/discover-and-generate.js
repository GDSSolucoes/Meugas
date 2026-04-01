#!/usr/bin/env node

/**
 * Entity Discovery and Auto-Generation Script
 * 
 * Discovers available entities from backend resources folder and generates
 * TypeScript entity classes for those missing in the frontend.
 * 
 * Usage:
 *   node discover-and-generate.js              # List available/missing entities
 *   node discover-and-generate.js --generate   # Auto-generate all missing entities
 *   node discover-and-generate.js --status     # Show generation status
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_RESOURCES_PATH = path.join(__dirname, '../../backend/src/resources');
const FRONTEND_ENTITIES_PATH = path.join(__dirname, '../src/entities');

/**
 * Get list of entity folders in backend resources
 */
function getBackendEntities() {
  if (!fs.existsSync(BACKEND_RESOURCES_PATH)) {
    console.error(`❌ Backend resources path not found: ${BACKEND_RESOURCES_PATH}`);
    process.exit(1);
  }

  const items = fs.readdirSync(BACKEND_RESOURCES_PATH);
  const entities = items
    .filter(item => {
      const fullPath = path.join(BACKEND_RESOURCES_PATH, item);
      return fs.statSync(fullPath).isDirectory() && item !== 'node_modules';
    })
    .map(folder => {
      // Convert plural folder name to singular entity name
      // e.g., "persons" -> "Person", "products" -> "Product"
      let name = folder.replace(/s$/, ''); // Remove trailing 's'
      return name.charAt(0).toUpperCase() + name.slice(1);
    })
    .sort();

  return entities;
}

/**
 * Get list of already generated entity files
 */
function getGeneratedEntities() {
  if (!fs.existsSync(FRONTEND_ENTITIES_PATH)) {
    return [];
  }

  const files = fs.readdirSync(FRONTEND_ENTITIES_PATH);
  const entities = files
    .filter(file => file.endsWith('.ts') && file !== 'BaseEntity.ts')
    .map(file => file.replace('.ts', ''));

  return entities;
}

/**
 * Compare and get missing entities
 */
function getMissingEntities() {
  const backend = getBackendEntities();
  const frontend = getGeneratedEntities();

  const missing = backend.filter(entity => !frontend.includes(entity));
  return missing;
}

/**
 * Display status report
 */
function showStatus() {
  const backend = getBackendEntities();
  const frontend = getGeneratedEntities();
  const missing = getMissingEntities();

  console.log('\n📊 Entity Generation Status Report\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(`\n📦 Backend (${backend.length} entities found):`);
  backend.forEach((entity, idx) => {
    const status = frontend.includes(entity) ? '✅' : '❌';
    console.log(`  ${status} ${idx + 1}. ${entity}`);
  });

  console.log(`\n✅ Generated in Frontend (${frontend.length} entities):`);
  frontend.forEach((entity, idx) => {
    console.log(`  ${idx + 1}. ${entity}`);
  });

  if (missing.length > 0) {
    console.log(`\n⏳ Missing (${missing.length} entities):`);
    missing.forEach((entity, idx) => {
      console.log(`  ${idx + 1}. ${entity}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missing.length > 0) {
    console.log(`💡 Run: node discover-and-generate.js --generate`);
    console.log(`   To automatically generate ${missing.length} missing entit${missing.length > 1 ? 'ies' : 'y'}\n`);
  } else {
    console.log('🎉 All entities are up-to-date!\n');
  }
}

/**
 * Generate all missing entities
 */
function generateMissing() {
  const missing = getMissingEntities();

  if (missing.length === 0) {
    console.log('\n✅ All entities already generated!\n');
    return;
  }

  console.log(`\n🚀 Generating ${missing.length} missing entit${missing.length > 1 ? 'ies' : 'y'}...\n`);

  let successCount = 0;
  let failedCount = 0;
  const failed = [];

  missing.forEach((entity, idx) => {
    process.stdout.write(`[${idx + 1}/${missing.length}] ${entity}... `);

    try {
      execSync(`node "${path.join(__dirname, 'generate-entity.js')}" ${entity}`, {
        stdio: 'pipe',
        timeout: 10000
      });
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      failedCount++;
      failed.push(entity);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Generated: ${successCount}`);
  if (failedCount > 0) {
    console.log(`❌ Failed: ${failedCount}`);
    console.log('   Failed entities:');
    failed.forEach(entity => console.log(`     - ${entity}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Next steps:');
  console.log('  1. Review generated files in: frontend/src/entities/');
  console.log('  2. Update imports in components');
  console.log('  3. Run: npm run typecheck\n');
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Entity Discovery and Auto-Generation Script

Usage:
  node discover-and-generate.js              List available and missing entities
  node discover-and-generate.js --status     Show detailed generation status
  node discover-and-generate.js --generate   Generate all missing entities
  node discover-and-generate.js --help       Show this help message

Examples:
  # Check what needs to be generated
  node discover-and-generate.js

  # Auto-generate everything
  node discover-and-generate.js --generate
`);
}

/**
 * Main execution
 */
function main() {
  const arg = process.argv[2];

  switch (arg) {
    case '--help':
    case '-h':
      showHelp();
      break;
    case '--status':
      showStatus();
      break;
    case '--generate':
      generateMissing();
      break;
    default:
      showStatus();
  }
}

main();
