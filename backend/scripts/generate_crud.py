#!/usr/bin/env python3
"""
CRUD Generator Script for NestJS + Drizzle ORM

This script generates complete CRUD modules for entities defined in database/schemas
following the pattern established in the vehicles module.

Usage:
    python scripts/generate_crud.py [--dry-run]

Arguments:
    --dry-run: Show what would be generated without creating files

The script will:
1. Scan database/schemas for table definitions
2. Check which entities don't have corresponding resources
3. Generate DTOs, service, controller, and module files
4. Update app.module.ts with new imports
"""

import os
import re
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import json


class SchemaParser:
    """Parses Drizzle schema files to extract table and column information."""

    def __init__(self, schemas_dir: Path):
        self.schemas_dir = schemas_dir

    def get_all_schemas(self) -> Dict[str, Dict]:
        """Get all schema files and their table definitions."""
        schemas = {}

        for schema_file in self.schemas_dir.glob("*.schema.ts"):
            if schema_file.name == "index.ts":
                continue

            table_name, columns = self.parse_schema_file(schema_file)
            if table_name:
                schemas[table_name] = {
                    'file': schema_file,
                    'columns': columns,
                    'table_name': table_name
                }

        return schemas

    def parse_schema_file(self, file_path: Path) -> Tuple[Optional[str], Dict]:
        """Parse a single schema file to extract table name and columns."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find table export (e.g., "export const vehicles = pgTable(")
        table_match = re.search(r'export const (\w+) = pgTable\(', content)
        if not table_match:
            return None, {}      
        

        table_name = table_match.group(1)

        # Extract column definitions
        columns = self.extract_columns(content)

        return table_name, columns

    def extract_columns(self, content: str) -> Dict:
        """Extract column definitions from schema content."""
        columns = {}

        # Find the pgTable definition block
        table_match = re.search(r'pgTable\(\s*["\']([^"\']+)["\']\s*,\s*\{([\s\S]*?)\},', content, re.DOTALL)
        if not table_match:
            return columns

        table_content = table_match.group(2)

        # Extract individual column definitions
        # Pattern: columnName: type("column_name")[.modifiers...]
        column_pattern = r'(\w+):\s*(.+?)(?=,\s*\w+\s*:|,\s*(?:deleted|createdByName|active|createdAt)\s*:|},\s*\()'
        matches = re.findall(column_pattern, table_content, re.MULTILINE)

        for column_name, column_def in matches:
            # Parse column definition
            is_required = '.notNull()' in column_def
            has_default = '.default(' in column_def

            # Extract type (simplified)
            type_match = re.search(r'(\w+)\("', column_def)
            column_type = type_match.group(1) if type_match else 'unknown'

            columns[column_name] = {
                'type': column_type,
                'required': is_required,
                'has_default': has_default,
                'definition': column_def.strip()
            }

        return columns


class EntityMapper:
    """Maps table names to entity names and file paths."""

    @staticmethod
    def table_to_entity(table_name: str) -> str:
        """Convert table name to entity name (PascalCase)."""
                
        # Default: convert plural to singular PascalCase
        if table_name.endswith('ies'):
            return table_name[:-3].capitalize() + table_name[-3:].title()
        elif table_name.endswith('es'):
            return table_name[:-2].capitalize() + table_name[-2:].title()
        elif table_name.endswith('s'):
            return table_name[:-1].capitalize()
        else:
            return table_name.capitalize()

    @staticmethod
    def table_to_entities_folder(table_name: str) -> str:
        """Convert table name to entities folder name."""
        return table_name


class FileGenerator:
    """Generates CRUD files from templates."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.templates = self.load_templates()

    def load_templates(self) -> Dict[str, str]:
        """Load file templates."""
        return {
            'base_dto': '''import {{ ApiProperty }} from '@nestjs/swagger'            
import {{ IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID }} from 'class-validator'
import {{ BaseGetDto }} from '../../../common/dto/base-get.dto'
{properties_to_import}

export class {Entity}BaseDto extends BaseGetDto {{
{properties}
}}
''',

            'create_dto': '''import {{ {Entity}BaseDto }} from './{entity}.base.dto'            
{properties_to_import}
import {{ IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID }} from 'class-validator'

export class {Entity}CreateDto extends {Entity}BaseDto {{
}}
''',

            'update_dto': '''import {{ PartialType }} from '@nestjs/swagger'
import {{ {Entity}CreateDto }} from './{entity}.post.dto'

export class {Entity}UpdateDto extends PartialType({Entity}CreateDto) {{}}
''',

            'delete_dto': '''import {{ {Entity}BaseDto }} from './{entity}.base.dto'
import {{ IsUUID }} from 'class-validator'

export class {Entity}DeleteDto extends {Entity}BaseDto {{
}}
''',

            'list_dto': '''import {{ BaseListDto }} from '../../../common/dto/base-list.dto'
import {{ {Entity}BaseDto }} from './{entity}.base.dto'

export class {Entity}ListDto extends BaseListDto<{Entity}BaseDto> {{}}
''',

            'service': '''import {{ Injectable }} from '@nestjs/common'
import {{ BaseCrudService }} from '../../common/base-crud.service'
import {{ RequestContextService }} from '../../database/request-context.service'
import {{ {entities} }} from '../../database/schemas'
import {{ {Entity}CreateDto }} from './dto/{entity}.post.dto'
import {{ {Entity}UpdateDto }} from './dto/{entity}.update.dto'

@Injectable()
export class {Entities}Service extends BaseCrudService<typeof {entities}> {{
  constructor(requestContext: RequestContextService) {{
    super(requestContext, {entities}, true) // hasCompanyId = true
  }}

  // Override if needed for custom logic
  async create(data: {Entity}CreateDto) {{
    return super.create(data)
  }}

  async update(id: string, data: Partial<{Entity}UpdateDto>) {{
    return super.update(id, data)
  }}
}}
''',

            'controller': '''import {{ Body, Controller, Delete, Get, Param, Post, Put, UseGuards }} from '@nestjs/common'
import {{ ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery }} from '@nestjs/swagger'
import {{ BaseCrudController }} from '../../common/base-crud.controller'
import {{ {Entities}Service }} from './{entities}.service'
import {{ {entities} }} from '../../database/schemas'
import {{ JwtAuthGuard }} from '../../auth/jwt-auth.guard'
import {{ {Entity}CreateDto }} from './dto/{entity}.post.dto'
import {{ Roles }} from '../../auth/roles.decorator'
import {{ RolesGuard }} from '../../auth/roles.guard'
import {{ {Entity}UpdateDto }} from './dto/{entity}.update.dto'

@ApiTags('{entities}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('{entities}')
export class {Entities}Controller extends BaseCrudController<typeof {entities}> {{
  constructor(protected readonly service: {Entities}Service) {{
    super(service, '{entities}', true)
  }}

  @Post()
  @ApiBody({{ type: {Entity}CreateDto }})
  @ApiOperation({{ summary: `Create {Entity}` }})
  @ApiResponse({{ status: 201, description: `{Entity} created`, type: {Entity}CreateDto }})
  async create(@Body() data: {Entity}CreateDto) {{
    return super.create(data)
  }}

  @Get(':id')
  @ApiOperation({{ summary: `Get {Entity} by ID` }})
  @ApiResponse({{ status: 200, description: `{Entity} retrieved`, type: {Entity}CreateDto }})
  async get(@Param('id') id: string) {{
    return super.get(id)
  }}

  @Get()
  @ApiOperation({{ summary: `List {Entities}` }})
  @ApiResponse({{ status: 200, description: `List of {entities}`, type: [{Entity}CreateDto] }})
  @ApiQuery({{ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' }})
  @ApiQuery({{ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' }})
  @ApiQuery({{ name: 'q', required: false, type: 'string', description: 'Search query' }})
  async list() {{
    return super.list()
  }}

  @Put(':id')
  @ApiBody({{ type: {Entity}UpdateDto }})
  @ApiOperation({{ summary: `Update {Entity}` }})
  @ApiResponse({{ status: 201, description: `{Entity} updated`, type: {Entity}UpdateDto }})
  async update(@Param('id') id: string, @Body() data: {Entity}UpdateDto) {{
    return super.update(id, data)
  }}

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({{ summary: `Delete {Entity}` }})
  @ApiResponse({{ status: 200, description: `{Entity} deleted` }})
  async delete(@Param('id') id: string) {{
    return super.delete(id)
  }}
}}
''',

            'module': '''import {{ Module }} from '@nestjs/common'
import {{ {Entities}Service }} from './{entities}.service'
import {{ {Entities}Controller }} from './{entities}.controller'

@Module({{
  providers: [{Entities}Service],
  controllers: [{Entities}Controller],
}})
export class {Entities}Module {{}}
'''
        }

    def generate_dto_properties(self, columns: Dict) -> str:
        """Generate DTO properties from column definitions."""
        
        """Generate base DTO properties (read-only)."""
        properties = []
        properties_to_import = []

        for col_name, col_info in columns.items():
            prop_name = self.snake_to_camel(col_name)
            prop_type, need_import = self.map_column_definition_to_ts(col_info['definition'])
            if need_import:
                properties_to_import.append(prop_type.replace('[]', ''))  # Remove array brackets for imports

            properties.append(f'''  @ApiProperty()
  {prop_name}!: {prop_type}''')

        return '\n\n'.join(properties), ', '.join(set(properties_to_import))

    def generate_base_dto_properties(self, columns: Dict) -> str:
        properties_to_import = []
        properties = []

        for col_name, col_info in columns.items():
            if col_name in ['id', 'createdAt', 'deleted', 'companyId', 'companyName', 'createdByName']:
                continue

            prop_name = self.snake_to_camel(col_name)
            prop_type, need_import = self.map_column_definition_to_ts(col_info['definition'])
            decorators = []

            if need_import:
                properties_to_import.append(prop_type.replace('[]', ''))  # Remove array brackets for imports

            # Add validation decorators
            if col_info['required']:
                decorators.append('@IsNotEmpty()')
            else:
                decorators.append('@IsOptional()')

            # Add type-specific decorators
            if prop_type == 'string':
                decorators.append('@IsString()')
            elif prop_type in ['number', 'numeric']:
                decorators.append('@IsNumber()')
            elif prop_type == 'boolean':
                decorators.append('@IsBoolean()')
            elif col_name.endswith('_id') or col_name == 'id':
                decorators.append('@IsUUID()')

            # Add ApiProperty
            decorators.insert(0, '@ApiProperty()')

            decorator_str = '\n  '.join(decorators)
            properties.append(f'''  {decorator_str}
  {prop_name}!: {prop_type}''')

        return '\n\n'.join(properties), ', '.join(set(properties_to_import))

    @staticmethod
    def snake_to_camel(snake_str: str) -> str:
        """Convert snake_case to camelCase."""
        components = snake_str.split('_')
        return components[0] + ''.join(x.title() for x in components[1:])

    @staticmethod
    def map_column_definition_to_ts(column_def: str) -> tuple:
        """Map Drizzle column types to TypeScript types."""
        type_mapping = {
            'text': 'string',
            'uuid': 'string',
            'numeric': 'number',
            'integer': 'number',
            'boolean': 'boolean',
            'timestamp': 'Date',
            'date': 'Date',
            'json': 'any',
        }

        type_match = re.search(r'(\w+)\("', column_def)
        column_type = type_match.group(1) if type_match else 'unknown'
        
        if "PGEnum" in column_type:
            column_type = column_type.replace('PGEnum', 'Enum')
            column_type = column_type[0].upper() + column_type[1:]
            return column_type, True
        
        if "json" in column_type.lower():
            # Extract definition inside .$type<>, example items: json("items").$type<OrderItemsItem[]>(),  -> OrderItemsItem[]
            type_definition = re.search(r'json\(".*?"\)\.\$type<([^>]+)>', column_def)
            if type_definition:
                return type_definition.group(1), True
            else:
                return 'any', False


        return type_mapping.get(column_type, 'any'), False

    def generate_file(self, template_name: str, variables: Dict, output_path: Path, dry_run: bool = False) -> bool:
        """Generate a file from template."""
        if template_name not in self.templates:
            print(f"Template {template_name} not found")
            return False

        template = self.templates[template_name]

        # Special handling for DTOs with properties
        if template_name in ['create_dto', 'base_dto'] and 'columns' in variables:
            if template_name == 'base_dto':
                variables['properties'], variables['properties_to_import'] = self.generate_base_dto_properties(variables['columns'])
            else:
                variables['properties'], variables['properties_to_import'] = self.generate_dto_properties(variables['columns'])
            # Remove columns from variables to avoid KeyError
            variables = {k: v for k, v in variables.items() if k != 'columns'}

        # Format template
        try:
            if len(variables['properties_to_import']) > 5:
                variables['properties_to_import'] = f"import {{ { variables['properties_to_import'] } }} from '../../../database/schemas'"
            else:
                variables['properties_to_import'] = ''

            content = template.format(**variables)
        except KeyError as e:
            print(f"Template formatting error for {template_name}: missing variable {e}")
            print(f"Available variables: {list(variables.keys())}")
            return False

        if dry_run:
            print(f"Would create: {output_path}")
            print(f"Content preview:\n{content[:200]}...\n")
            return True

        # Create directory if needed
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created: {output_path}")
        return True


class AppModuleUpdater:
    """Updates app.module.ts with new module imports."""

    def __init__(self, app_module_path: Path):
        self.app_module_path = app_module_path

    def add_module_import(self, module_name: str, entities_folder: str, dry_run: bool = False) -> bool:
        """Add module import and registration to app.module.ts."""
        with open(self.app_module_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Add import statement
        import_statement = f"import {{ {module_name} }} from './resources/{entities_folder}/{entities_folder}.module'"

        if import_statement in content:
            print(f"{module_name} already imported in app.module.ts")
            return False        

        # Find the last import statement
        import_lines = []
        in_imports = False
        for line in content.split('\n'):
            if line.startswith('import '):
                in_imports = True
                import_lines.append(line)
            elif in_imports and line.strip() == '':
                continue
            elif in_imports and not line.startswith('import '):
                # End of imports
                break

        # Insert new import before the last import
        if import_lines:
            last_import = import_lines[-1]
            new_content = content.replace(last_import, f"{last_import}\n{import_statement}")
        else:
            # Fallback: add at the beginning
            new_content = import_statement + '\n\n' + content

        # Add to imports array
        # Find the imports array
        imports_match = re.search(r'imports:\s*\[([^\]]+)\]', new_content, re.DOTALL)
        if imports_match:
            imports_content = imports_match.group(1)
            # Add new module at the end
            new_imports = imports_content.rstrip() + f',\n    {module_name}'
            new_content = new_content.replace(imports_content, new_imports)

        if dry_run:
            print(f"Would update: {self.app_module_path}")
            print("Import statement:", import_statement)
            return True

        with open(self.app_module_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Updated: {self.app_module_path}")
        return True


def main():
    parser = argparse.ArgumentParser(description='Generate CRUD modules for NestJS entities')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be generated without creating files')
    args = parser.parse_args()

    # Setup paths
    backend_dir = Path(__file__).parent.parent
    schemas_dir = backend_dir / 'src' / 'database' / 'schemas'
    resources_dir = backend_dir / 'src' / 'resources'
    app_module_path = backend_dir / 'src' / 'app.module.ts'

    print("CRUD Generator for NestJS + Drizzle ORM")
    print(f"Backend directory: {backend_dir}")
    print(f"Dry run: {args.dry_run}")
    print()

    # Parse schemas
    parser = SchemaParser(schemas_dir)
    schemas = parser.get_all_schemas()

    print(f"Found {len(schemas)} schema files:")
    for table_name in schemas.keys():
        print(f"  - {table_name}")
    print()

    # Check existing resources
    existing_resources = set()
    if resources_dir.exists():
        for item in resources_dir.iterdir():
            if item.is_dir():
                existing_resources.add(item.name)

    print(f"Existing resources: {sorted(existing_resources)}")
    print()

    # Determine which entities to generate
    mapper = EntityMapper()
    to_generate = []

    for table_name, schema_info in schemas.items():
        entities_folder = mapper.table_to_entities_folder(table_name)
        if entities_folder not in existing_resources:
            entity_name = mapper.table_to_entity(table_name)
            to_generate.append({
                'table_name': table_name,
                'entity': entity_name,
                'entities': entities_folder,
                'schema': schema_info
            })

    if not to_generate:
        print("No new entities to generate. All schemas already have corresponding resources.")
        return

    print(f"Will generate CRUD for {len(to_generate)} entities:")
    for item in to_generate:
        print(f"  - {item['table_name']} -> {item['entity']} ({item['entities']})")
    print()

    # Generate files
    generator = FileGenerator(backend_dir)
    updater = AppModuleUpdater(app_module_path)

    for item in to_generate:
        table_name = item['table_name']
        entity = item['entity']
        entities = item['entities']
        columns = item['schema']['columns']

        variables = {
            'Entity': entity,
            'Entities': entity + 's',  # Service/Controller class name
            'entity': entity.lower(),
            'entities': entities,
            'columns': columns
        }

        # Handle special plural forms for class names
        if entities == 'people':
            variables['Entities'] = 'People'
        elif entity.endswith('y'):
            variables['Entities'] = entity[:-1] + 'ies'  # Category -> Categories
        elif entity.endswith(('s', 'sh', 'ch', 'x', 'z')):
            variables['Entities'] = entity + 'es'  # Process -> Processes
        else:
            variables['Entities'] = entity + 's'  # Product -> Products, Employee -> Employees

        entity_dir = resources_dir / entities
        dto_dir = entity_dir / 'dto'

        # Generate DTOs
        generator.generate_file('base_dto', variables, dto_dir / f'{entity.lower()}.base.dto.ts', args.dry_run)
        generator.generate_file('create_dto', variables, dto_dir / f'{entity.lower()}.post.dto.ts', args.dry_run)
        generator.generate_file('update_dto', variables, dto_dir / f'{entity.lower()}.update.dto.ts', args.dry_run)
        generator.generate_file('delete_dto', variables, dto_dir / f'{entity.lower()}.delete.dto.ts', args.dry_run)
        generator.generate_file('list_dto', variables, dto_dir / f'{entity.lower()}.list.dto.ts', args.dry_run)

        # Generate service
        generator.generate_file('service', variables, entity_dir / f'{entities}.service.ts', args.dry_run)

        # Generate controller
        generator.generate_file('controller', variables, entity_dir / f'{entities}.controller.ts', args.dry_run)

        # Generate module
        generator.generate_file('module', variables, entity_dir / f'{entities}.module.ts', args.dry_run)

        # Update app.module.ts
        updater.add_module_import(f'{variables["Entities"]}Module', entities, args.dry_run)

    if not args.dry_run:
        print("\nGeneration complete!")
        print("Next steps:")
        print("1. Run 'npm run lint' to check for any linting issues")
        print("2. Run 'npm run test' to ensure tests pass")
        print("3. Test the new endpoints with your API client")
        print("4. Review generated DTOs and adjust validation rules if needed")
    else:
        print("\nDry run complete. Use without --dry-run to actually generate files.")


if __name__ == '__main__':
    main()