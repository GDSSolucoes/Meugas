import fs from 'fs';
import path from 'path';

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertSnakeCaseInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Regex para encontrar snake_case (palavras com underscore)
    const snakeCaseRegex = /\b([a-z][a-z0-9]*_[a-z0-9_]+)\b/g;

    content = content.replace(snakeCaseRegex, (match) => {
      const camelCase = snakeToCamel(match);
      console.log(`  🔄 ${match} → ${camelCase}`);
      return camelCase;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} - convertido`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let convertedCount = 0;

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        convertedCount += walkDirectory(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.jsx') || item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
        if (convertSnakeCaseInFile(fullPath)) {
          convertedCount++;
        }
      }
    }

    return convertedCount;
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
    return 0;
  }
}

console.log('🔄 Convertendo snake_case para camelCase no frontend...\n');
const convertedFiles = walkDirectory('functions');
console.log(`\n✅ Conversão concluída! ${convertedFiles} arquivo(s) modificado(s).`);