#!/usr/bin/env python3
"""
CRUD Generator Script for NestJS + Drizzle ORM

This script generates or regenerates complete CRUD modules for entities 
defined in database/schemas following the pattern established in the vehicles module.

Usage:
    # Interactive mode - choose entity and components
    python scripts/generate_crud.py
    
    # Generate all new entities
    python scripts/generate_crud.py --no-interactive
    
    # Regenerate specific entity with all components
    python scripts/generate_crud.py --entity products --regenerate
    
    # Generate only DTOs and Service for an entity
    python scripts/generate_crud.py --entity orders --only-dto --only-service --regenerate
    
    # Dry run to see what would be generated
    python scripts/generate_crud.py --entity products --dry-run

Features:
    - Generate CRUD for new entities automatically
    - Regenerate existing entities (with --regenerate flag)
    - Choose specific components: DTO, Service, Controller
    - Interactive mode for entity and component selection
    - Dry run mode to preview changes
    - Automatic app.module.ts updates

The script will:
    1. Scan database/schemas for table definitions
    2. Allow selection of specific entity or regenerate all new ones
    3. Generate selected components (DTOs, service, controller, and module files)
    4. Update app.module.ts with new imports when needed
"""

import os
import re
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import json
from collections import defaultdict


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
        column_pattern = r'(\w+):\s*([\s\S]+?)(?=,\s*\w+\s*:|,\s*(?:deleted|createdByName|active|createdAt)\s*:|},\s*\()'
        matches = re.findall(column_pattern, table_content, re.MULTILINE)

        for column_name, column_def in matches:
            # Parse column definition
            if column_name in ['id', 'createdAt', 'deleted', 'active', 'createdByName']:
                continue
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


class ComplexTypeExtractor:
    """Extrai tipos complexos (export type) do arquivo de schema."""

    def __init__(self, schema_file_path: Path):
        self.schema_file_path = schema_file_path
        self.complex_types = {}

    def extract_all_types(self) -> Dict[str, Dict]:
        """Extrai todos os export type do schema."""
        with open(self.schema_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Padrão: export type TypeName = { ... };
        type_pattern = r'export type (\w+) = \{([^}]+)\};'
        matches = re.finditer(type_pattern, content, re.MULTILINE | re.DOTALL)

        for match in matches:
            type_name = match.group(1)
            type_body = match.group(2)
            properties = self._parse_type_properties(type_body)
            self.complex_types[type_name] = {
                'name': type_name,
                'properties': properties,
                'body': type_body
            }

        return self.complex_types

    def _parse_type_properties(self, type_body: str) -> Dict:
        """Extrai propriedades de um tipo."""
        properties = {}

        # Padrão: propertyName?: type;
        prop_pattern = r'(\w+)\?: ([^;]+);'
        matches = re.finditer(prop_pattern, type_body)

        for match in matches:
            prop_name = match.group(1)
            prop_type = match.group(2).strip()
            properties[prop_name] = {
                'name': prop_name,
                'type': prop_type,
                'required': False  # TypeScript usa ? = opcional
            }

        return properties


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
import {{ IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsArray, ValidateNested }} from 'class-validator'
import {{ Type }} from "class-transformer";
import {{ BaseCreateDto }} from "../../../common/dto/base-create.dto";
{properties_to_import}

export class {Entity}BaseDto extends BaseCreateDto {{
{properties}
}}
''',

            'create_dto': '''import {{ {Entity}BaseDto }} from './{entity}.base.dto'            
{properties_to_import}

export class {Entity}CreateDto extends {Entity}BaseDto {{
}}
''',

            'update_dto': '''import {{ PartialType }} from '@nestjs/swagger'
import {{ {Entity}CreateDto }} from './{entity}.post.dto'

export class {Entity}UpdateDto extends PartialType({Entity}CreateDto) {{}}
''',

            'delete_dto': '''import {{ {Entity}BaseDto }} from './{entity}.base.dto'

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

            'controller': '''import {{ Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards }} from "@nestjs/common"
import {{ ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery }} from '@nestjs/swagger'
import {{ BaseCrudController }} from '../../common/base-crud.controller'
import {{ {Entities}Service }} from './{entities}.service'
import {{ {entities} }} from '../../database/schemas'
import {{ JwtAuthGuard }} from '../../auth/jwt-auth.guard'
import {{ {Entity}CreateDto }} from './dto/{entity}.post.dto'
import {{ Roles }} from '../../auth/roles.decorator'
import {{ RolesGuard }} from '../../auth/roles.guard'
import {{ {Entity}UpdateDto }} from './dto/{entity}.update.dto'
import {{ CurrentUser }} from "../../auth/current-user.decorator"

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
  async create(@Body() data: {Entity}CreateDto, @CurrentUser() user?: any) {{
    return super.create(data, user)
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
  @ApiQuery({{ name: 'sort', required: false, type: 'string', description: 'Sort field' }})
  @ApiQuery({{ name: 'order', required: false, type: 'string', description: 'Sort order' }})
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("q") search?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query() allFilters?: Record<string, any>
    ) {{
    return super.list(page, limit, search, sort, order, allFilters)
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

    def generate_base_dto_properties(self, columns: Dict, complex_types_generated: Set[str] = None) -> str:
        if complex_types_generated is None:
            complex_types_generated = set()
            
        properties_to_import = []
        properties = []

        for col_name, col_info in columns.items():
            if col_name.lower() in ['id', 'createdat', 'deleted', 'active', 'companyid', 'companyname', 'createdbyname']:
                continue

            prop_name = self.snake_to_camel(col_name)
            prop_type, need_import = self.map_column_definition_to_ts(col_info['definition'])
            decorators = []

            # Add validation decorators
            if col_info['required']:
                decorators.append('@IsNotEmpty()')
            else:
                decorators.append('@IsOptional()')

            # Check if this is a complex type that was generated
            is_complex_type = False
            base_type = prop_type.replace('[]', '').strip()
            
            if base_type in complex_types_generated:
                is_complex_type = True
                # Convert type name to DTO class name (e.g., SaleItemsItem -> SaleItemsItemDto)
                dto_class_name = f'{base_type}Dto'
                
                if prop_type.endswith('[]'):
                    # Array of complex types
                    decorators.append('@IsArray()')
                    decorators.append('@ValidateNested({ each: true })')
                    decorators.append(f'@Type(() => {dto_class_name})')
                    prop_type = f'{dto_class_name}[]'
                else:
                    # Single complex type
                    decorators.append('@ValidateNested()')
                    decorators.append(f'@Type(() => {dto_class_name})')
                    prop_type = dto_class_name
                
                properties_to_import.append(dto_class_name)
            elif need_import:
                # For enum types, still import from schema
                if 'Enum' in prop_type:
                    properties_to_import.append(prop_type.replace('[]', ''))

            # Add type-specific decorators only if not a complex type
            if not is_complex_type:
                if col_name.lower().endswith('id') or col_name.lower() == 'id':
                    if not need_import:  # Don't add IsUUID for enum types
                        decorators.append('@IsUUID()')
                elif prop_type == 'string':
                    decorators.append('@IsString()')
                elif prop_type in ['number', 'numeric']:
                    decorators.append('@IsNumber()')
                elif prop_type == 'boolean':
                    decorators.append('@IsBoolean()')
                elif prop_type == 'Date':
                    decorators.append('@Type(() => Date)')

            # Add ApiProperty
            decorators.insert(0, '@ApiProperty()')

            decorator_str = '\n  '.join(decorators)
            properties.append(f'''  {decorator_str}
  {prop_name}!: {prop_type}''')

        return '\n\n'.join(properties), ', '.join(set(properties_to_import))

    def generate_complex_type_dto(self, type_name: str, type_info: Dict) -> str:
        """Gera DTO class para um tipo complexo."""
        properties = []
        properties_to_import = set()

        for prop_name, prop_data in type_info['properties'].items():
            prop_type = prop_data['type']
            decorators = []

            # Detectar se é array
            is_array = prop_type.endswith('[]')
            base_type = prop_type.replace('[]', '').strip()

            # Adicionar decoradores de validação
            decorators.append('@IsOptional()')

            if is_array:
                decorators.append('@IsArray()')
                # Se for array de objetos complexos, usar ValidateNested
                if base_type not in ['string', 'number', 'boolean', 'any']:
                    decorators.append('@ValidateNested({ each: true })')
                    decorators.append(f'@Type(() => {base_type})')
                    properties_to_import.add(base_type)
            else:
                # Adicionar decoradores específicos do tipo
                if base_type == 'string':
                    decorators.append('@IsString()')
                elif base_type in ['number', 'numeric']:
                    decorators.append('@IsNumber()')
                elif base_type == 'boolean':
                    decorators.append('@IsBoolean()')
                elif base_type != 'any':
                    # Se for um tipo customizado (ex: nested object)
                    decorators.append('@ValidateNested()')
                    decorators.append(f'@Type(() => {base_type})')
                    properties_to_import.add(base_type)

            decorators.insert(0, '@ApiProperty()')
            decorator_str = '\n  '.join(decorators)
            properties.append(f'''  {decorator_str}
  {prop_name}!: {prop_type}\n''')

        # Construir import statement
        import_stmt = ''
        if properties_to_import:
            imports = ', '.join(sorted(properties_to_import))
            import_stmt = f"import {{ {imports} }} from './{ self.snake_to_camel(type_name).lower()}.dto'\n"

        # Gerar DTO class
        dto_content = f'''import {{ ApiProperty }} from '@nestjs/swagger'
import {{ IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested }} from 'class-validator'
import {{ Type }} from 'class-transformer'
{import_stmt}
export class {type_name}Dto {{
{chr(10).join(properties)}
}}
'''
        return dto_content

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

    def generate_file(self, template_name: str, variables: Dict, output_path: Path, dry_run: bool = False, complex_types_generated: Set[str] = None) -> bool:
        """Generate a file from template."""
        if complex_types_generated is None:
            complex_types_generated = set()
            
        if template_name not in self.templates:
            print(f"Template {template_name} not found")
            return False

        template = self.templates[template_name]

        # Special handling for DTOs with properties
        if template_name in ['create_dto', 'base_dto'] and 'columns' in variables:
            if template_name == 'base_dto':
                variables['properties'], variables['properties_to_import'] = self.generate_base_dto_properties(
                    variables['columns'], 
                    complex_types_generated
                )
            else:
                variables['properties'], variables['properties_to_import'] = self.generate_dto_properties(variables['columns'])
            # Remove columns from variables to avoid KeyError
            variables = {k: v for k, v in variables.items() if k != 'columns'}

        # Format template
        try:
            # Handle complex type imports and schema imports separately
            complex_type_imports = []
            schema_imports = []
            
            if 'properties_to_import' in variables and variables['properties_to_import']:
                imports_str = variables['properties_to_import']
                for imp in imports_str.split(', '):
                    imp = imp.strip()
                    if imp.endswith('Dto'):
                        # It's a complex type DTO import
                        dto_file = f'{self.snake_to_camel(imp.replace("Dto", "")).lower()}.dto'
                        complex_type_imports.append((imp, f'./{dto_file}'))
                    elif imp and imp != '':
                        # It's a schema import (like enum)
                        schema_imports.append(imp)
            
            # Build proper import statements
            import_lines = []
            if complex_type_imports:
                # Group by file
                imports_by_file = defaultdict(list)
                for imp, file_path in complex_type_imports:
                    imports_by_file[file_path].append(imp)
                
                for file_path, imports in imports_by_file.items():
                    import_lines.append(f"import {{ {', '.join(imports)} }} from '{file_path}'")
            
            if schema_imports:
                import_lines.append(f"import {{ {', '.join(schema_imports)} }} from '../../../database/schemas'")
            
            variables['properties_to_import'] = '\n'.join(import_lines) if import_lines else ''

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


class ComponentSelector:
    """Handles selection of CRUD components to generate."""
    
    @staticmethod
    def get_components_to_generate(args) -> Set[str]:
        """Determine which components to generate based on arguments."""
        components = set()
        
        if not args.only_dto and not args.only_service and not args.only_controller:
            # Default: generate all
            components = {'dto', 'service', 'controller', 'module'}
        else:
            if args.only_dto:
                components.add('dto')
            if args.only_service:
                components.add('service')
            if args.only_controller:
                components.add('controller')
            # Module is always generated if service or controller is generated
            if 'service' in components or 'controller' in components:
                components.add('module')
        
        return components
    
    @staticmethod
    def display_components(components: Set[str]) -> str:
        """Display selected components in a user-friendly way."""
        component_names = {
            'dto': 'DTO files',
            'service': 'Service',
            'controller': 'Controller',
            'module': 'Module'
        }
        return ', '.join(component_names.get(c, c) for c in sorted(components))


def select_entity_interactive(schemas: Dict[str, Dict], existing_resources: Set[str]) -> Optional[str]:
    """Display interactive menu to select an entity."""
    mapper = EntityMapper()
    schema_list = sorted(schemas.keys())
    
    print("\n=== Select Entity to Generate/Regenerate ===")
    print("\nAvailable entities:")
    
    for idx, table_name in enumerate(schema_list, 1):
        entities_folder = mapper.table_to_entities_folder(table_name)
        status = "✓ (exists)" if entities_folder in existing_resources else "(new)"
        print(f"  {idx}. {table_name} {status}")
    
    print(f"\n  0. Generate all new entities")
    print(f"  q. Quit")
    
    while True:
        try:
            choice = input("\nEnter your choice: ").strip().lower()
            
            if choice == 'q':
                return None
            elif choice == '0':
                return 'all_new'
            else:
                idx = int(choice) - 1
                if 0 <= idx < len(schema_list):
                    return schema_list[idx]
                else:
                    print("Invalid choice. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number or 'q'.")


def select_components_interactive() -> Set[str]:
    """Display interactive menu to select components to generate."""
    print("\n=== Select Components to Generate ===")
    print("  1. DTOs (base, create, update, delete, list)")
    print("  2. Service")
    print("  3. Controller")
    print("  4. All components (default)")
    
    components = set()
    
    while True:
        choices = input("\nEnter your choices (comma-separated, e.g., 1,2,3 or just press Enter for all): ").strip()
        
        if not choices:
            return {'dto', 'service', 'controller', 'module'}
        
        try:
            selected = [int(c.strip()) for c in choices.split(',')]
            
            if 4 in selected:
                return {'dto', 'service', 'controller', 'module'}
            
            components = set()
            if 1 in selected:
                components.add('dto')
            if 2 in selected:
                components.add('service')
            if 3 in selected:
                components.add('controller')
            
            if 'service' in components or 'controller' in components:
                components.add('module')
            
            if components:
                return components
            else:
                print("Invalid choice. Please select at least one component.")
        except ValueError:
            print("Invalid input. Please enter numbers separated by commas.")


def main():
    parser = argparse.ArgumentParser(
        description='Generate or regenerate CRUD modules for NestJS entities',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Generate all new entities
  python scripts/generate_crud.py
  
  # Regenerate specific entity with all components
  python scripts/generate_crud.py --entity products --regenerate
  
  # Generate only DTOs and Service for an entity
  python scripts/generate_crud.py --entity orders --only-dto --only-service
  
  # Dry run to see what would be generated
  python scripts/generate_crud.py --entity products --dry-run
        '''
    )
    parser.add_argument('--entity', type=str, help='Specific entity to generate/regenerate (table name)')
    parser.add_argument('--regenerate', action='store_true', help='Force regeneration of existing entity')
    parser.add_argument('--only-dto', action='store_true', help='Generate only DTO files')
    parser.add_argument('--only-service', action='store_true', help='Generate only Service')
    parser.add_argument('--only-controller', action='store_true', help='Generate only Controller')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be generated without creating files')
    parser.add_argument('--no-interactive', action='store_true', help='Skip interactive mode and use defaults')
    
    args = parser.parse_args()

    # Setup paths
    backend_dir = Path(__file__).parent.parent
    schemas_dir = backend_dir / 'src' / 'database' / 'schemas'
    resources_dir = backend_dir / 'src' / 'resources'
    app_module_path = backend_dir / 'src' / 'app.module.ts'

    print("\n" + "="*60)
    print("CRUD Generator for NestJS + Drizzle ORM")
    print("="*60)
    print(f"Backend directory: {backend_dir}")
    print()

    # Parse schemas
    schema_parser = SchemaParser(schemas_dir)
    schemas = schema_parser.get_all_schemas()

    print(f"Found {len(schemas)} schema files:")
    for table_name in sorted(schemas.keys()):
        print(f"  - {table_name}")
    print()

    # Check existing resources
    existing_resources = set()
    if resources_dir.exists():
        for item in resources_dir.iterdir():
            if item.is_dir():
                existing_resources.add(item.name)

    print(f"Existing resources: {sorted(existing_resources) if existing_resources else 'None'}")
    print()

    # Determine which entities to generate
    mapper = EntityMapper()
    selected_entity = args.entity
    
    # Interactive selection if no entity specified and not no-interactive flag
    if not selected_entity and not args.no_interactive:
        selected_entity = select_entity_interactive(schemas, existing_resources)
        if selected_entity is None:
            print("Cancelled.")
            return
    
    # Interactive component selection if no specific components requested
    components_to_generate = ComponentSelector.get_components_to_generate(args)
    if not args.no_interactive and not (args.only_dto or args.only_service or args.only_controller):
        if selected_entity and selected_entity != 'all_new':
            components_to_generate = select_components_interactive()
    
    # Determine entities to generate
    to_generate = []

    if selected_entity == 'all_new' or not selected_entity:
        # Generate all new entities
        for table_name, schema_info in schemas.items():
            entities_folder = mapper.table_to_entities_folder(table_name)
            if entities_folder not in existing_resources or args.regenerate:
                entity_name = mapper.table_to_entity(table_name)
                to_generate.append({
                    'table_name': table_name,
                    'entity': entity_name,
                    'entities': entities_folder,
                    'schema': schema_info
                })
    else:
        # Generate specific entity
        if selected_entity not in schemas:
            print(f"❌ Entity '{selected_entity}' not found in schemas!")
            print(f"Available entities: {', '.join(sorted(schemas.keys()))}")
            return
        
        schema_info = schemas[selected_entity]
        entities_folder = mapper.table_to_entities_folder(selected_entity)
        entity_name = mapper.table_to_entity(selected_entity)
        
        if entities_folder in existing_resources and not args.regenerate:
            print(f"⚠️  Entity '{selected_entity}' already exists.")
            print("Use --regenerate flag to overwrite existing files.")
            return
        
        to_generate.append({
            'table_name': selected_entity,
            'entity': entity_name,
            'entities': entities_folder,
            'schema': schema_info
        })

    if not to_generate:
        print("No entities to generate. All schemas already have corresponding resources.")
        return

    print(f"Will generate CRUD for {len(to_generate)} entity/entities:")
    for item in to_generate:
        print(f"  ✓ {item['table_name']} -> {item['entity']} ({item['entities']})")
    print()
    print(f"Components to generate: {ComponentSelector.display_components(components_to_generate)}")
    print(f"Dry run: {args.dry_run}")
    print()

    if args.dry_run and not args.no_interactive:
        confirm = input("Proceed with dry run? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return
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
            'Entities': entity.capitalize(),  # Service/Controller class name
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

        print(f"\nGenerating for: {entity}")
        print("-" * 40)
        
        # Generate DTOs
        if 'dto' in components_to_generate:
            print(f"  📄 DTOs")
            
            # Extract and generate complex type DTOs first
            schema_file = item['schema']['file']
            complex_extractor = ComplexTypeExtractor(schema_file)
            complex_types = complex_extractor.extract_all_types()
            
            # Gerar DTOs para tipos complexos que são usados no schema
            generated_complex_types = set()
            for col_name, col_info in columns.items():
                col_def = col_info['definition']
                # Procurar por tipos complexos referenciados
                type_match = re.search(r'\$type<([^>]+)>', col_def)
                if type_match:
                    type_ref = type_match.group(1)
                    # Extrair nome base (remover [] se for array)
                    base_type = type_ref.replace('[]', '').strip()
                    
                    # Se encontrou o tipo complexo, gerar DTO para ele
                    if base_type in complex_types and base_type not in generated_complex_types:
                        complex_type_info = complex_types[base_type]
                        dto_content = generator.generate_complex_type_dto(base_type, complex_type_info)
                        
                        dto_path = dto_dir / f'{generator.snake_to_camel(base_type).lower()}.dto.ts'
                        if not args.dry_run:
                            dto_dir.mkdir(parents=True, exist_ok=True)
                            with open(dto_path, 'w', encoding='utf-8') as f:
                                f.write(dto_content)
                            print(f"    - Complex type DTO: {dto_path.name}")
                        else:
                            print(f"    Would create complex type DTO: {dto_path.name}")
                        
                        generated_complex_types.add(base_type)
            print(f"    - Generated complex type DTOs: {', '.join(generated_complex_types) if generated_complex_types else 'None'}")
            # print com as colunas detectadas
            print(f"    - Columns of entity {entity}: {', '.join([f'{col}({columns[col]["type"]})' for col in columns])}")


            # Gerar DTOs padrão, passando os tipos complexos gerados
            generator.generate_file('base_dto', variables, dto_dir / f'{entity.lower()}.base.dto.ts', args.dry_run, generated_complex_types)
            generator.generate_file('create_dto', variables, dto_dir / f'{entity.lower()}.post.dto.ts', args.dry_run, generated_complex_types)
            generator.generate_file('update_dto', variables, dto_dir / f'{entity.lower()}.update.dto.ts', args.dry_run)
            generator.generate_file('delete_dto', variables, dto_dir / f'{entity.lower()}.delete.dto.ts', args.dry_run)
            generator.generate_file('list_dto', variables, dto_dir / f'{entity.lower()}.list.dto.ts', args.dry_run)

        # Generate service
        if 'service' in components_to_generate:
            print(f"  🔧 Service")
            generator.generate_file('service', variables, entity_dir / f'{entities}.service.ts', args.dry_run)

        # Generate controller
        if 'controller' in components_to_generate:
            print(f"  🌐 Controller")
            generator.generate_file('controller', variables, entity_dir / f'{entities}.controller.ts', args.dry_run)

        # Generate module
        if 'module' in components_to_generate:
            print(f"  📦 Module")
            generator.generate_file('module', variables, entity_dir / f'{entities}.module.ts', args.dry_run)

        # Update app.module.ts only if generating module
        if 'module' in components_to_generate:
            updater.add_module_import(f'{variables["Entities"]}Module', entities, args.dry_run)

    if not args.dry_run:
        print("\n" + "="*60)
        print("✅ Generation complete!")
        print("="*60)
        print("\nNext steps:")
        print("1. Run 'npm run lint' to check for any linting issues")
        print("2. Run 'npm run test' to ensure tests pass")
        print("3. Test the new endpoints with your API client")
        print("4. Review generated DTOs and adjust validation rules if needed")
    else:
        print("\n" + "="*60)
        print("✅ Dry run complete!")
        print("="*60)
        print("Use without --dry-run to actually generate files.")


if __name__ == '__main__':
    main()