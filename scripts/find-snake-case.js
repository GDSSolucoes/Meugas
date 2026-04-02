import fs from 'fs';
import path from 'path';

const snakeCaseRegex = /\b([a-z][a-z0-9]*_[a-z0-9_]+)\b/g;

function findSnakeCaseInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    let match;

    while ((match = snakeCaseRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      matches.push({
        word: match[1],
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index) + 1
      });
    }

    if (matches.length > 0) {
      console.log(`📍 ${filePath}:`);
      matches.forEach(({ word, line, column }) => {
        console.log(`  🔸 Line ${line}:${column} - "${word}" (snake_case)`);
      });
      console.log('');
    }
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        walkDirectory(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.jsx') || item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
        findSnakeCaseInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
  }
}

console.log('🔍 Procurando por snake_case no frontend...\n');
walkDirectory('functions');
console.log('✅ Varredura concluída!');