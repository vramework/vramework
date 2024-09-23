// generateDispatcher.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// Paths
const routesMetaPath = path.resolve(__dirname, 'routesMeta.json');
const outputPath = path.resolve(__dirname, 'dispatcher.ts');
const projectPath = path.resolve(__dirname);

// Read Route Metadata
const routesMeta: Array<{
  route: string;
  func: string;
  inputType: string;
  outputType: string;
}> = JSON.parse(fs.readFileSync(routesMetaPath, 'utf-8'));

// Initialize TypeScript Program
const program = ts.createProgram({
  rootNames: getAllFiles(projectPath),
  options: {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    esModuleInterop: true,
  },
});
const checker = program.getTypeChecker();

// Helper to get all TypeScript files
function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(res, files);
    } else if (res.endsWith('.ts') && !res.endsWith('.d.ts')) {
      files.push(res);
    }
  }
  return files;
}

// Resolve Import Paths
interface ImportInfo {
  importPath: string;
  namedImports: Set<string>;
}

const importMap: Map<string, ImportInfo> = new Map();

// Function to find the file containing a symbol
function findSymbolFile(symbolName: string): string | null {
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    const symbol = checker.getSymbolAtLocation(sourceFile);
    if (symbol) {
      const declarations = symbol.getDeclarations();
      if (declarations) {
        for (const decl of declarations) {
          if (
            (ts.isFunctionDeclaration(decl) || ts.isTypeAliasDeclaration(decl) || ts.isInterfaceDeclaration(decl)) &&
            decl.name?.text === symbolName
          ) {
            return path.relative(projectPath, sourceFile.fileName).replace(/\\/g, '/').replace(/\.ts$/, '');
          }
        }
      }
    }
  }
  // Alternatively, use checker to find all symbols
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    const symbols = checker.getSymbolsInScope(sourceFile, ts.SymbolFlags.Function | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface);
    for (const symbol of symbols) {
      if (symbol.getName() === symbolName) {
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
          const decl = declarations[0];
          const filePath = path.relative(projectPath, decl.getSourceFile().fileName).replace(/\\/g, '/').replace(/\.ts$/, '');
          return filePath;
        }
      }
    }
  }
  return null;
}

// Populate importMap
routesMeta.forEach(({ func, inputType, outputType }) => {
  // Functions
  const funcPath = findSymbolFile(func);
  if (funcPath) {
    if (!importMap.has(funcPath)) {
      importMap.set(funcPath, { importPath: `./${funcPath}`, namedImports: new Set() });
    }
    importMap.get(funcPath)!.namedImports.add(func);
  }

  // Input Types
  const inputTypePath = findSymbolFile(inputType);
  if (inputTypePath) {
    if (!importMap.has(inputTypePath)) {
      importMap.set(inputTypePath, { importPath: `./${inputTypePath}`, namedImports: new Set() });
    }
    importMap.get(inputTypePath)!.namedImports.add(inputType);
  }

  // Output Types
  const outputTypePath = findSymbolFile(outputType);
  if (outputTypePath) {
    if (!importMap.has(outputTypePath)) {
      importMap.set(outputTypePath, { importPath: `./${outputTypePath}`, namedImports: new Set() });
    }
    importMap.get(outputTypePath)!.namedImports.add(outputType);
  }
});

// Generate Import Statements
const importStatements: string[] = [];
importMap.forEach(({ importPath, namedImports }) => {
  importStatements.push(`import { ${Array.from(namedImports).join(', ')} } from '${importPath}';`);
});

// Generate Function Map
const functionMapEntries = routesMeta.map(({ func }) => `  '${func}': ${func},`).join('\n');

// Generate Route Meta Import
importStatements.push(`import routes from './routesMeta.json';`);

// Create Dispatcher Content
const dispatcherContent = `
// Auto-generated Dispatcher
${importStatements.join('\n')}

interface RouteMeta {
  route: string;
  func: string;
  inputType: string;
  outputType: string;
}

type FunctionMap = {
  [key: string]: (input: any) => Promise<any>;
};

const functionMap: FunctionMap = {
${functionMapEntries}
};

export async function runRoute(route: string, input: any): Promise<any> {
  const routeMeta: RouteMeta | undefined = routes.find(r => r.route === route);
  if (!routeMeta) {
    throw new Error(\`Route "\${route}" not found.\`);
  }

  const func = functionMap[routeMeta.func];
  if (!func) {
    throw new Error(\`Function "\${routeMeta.func}" not found.\`);
  }

  // Type assertions (optional, for better type safety)
  const typedInput = input as any; // Replace 'any' with routeMeta.inputType if types are available
  const output = await func(typedInput);
  return output as any; // Replace 'any' with routeMeta.outputType if types are available
}
`;

// Write Dispatcher File
fs.writeFileSync(outputPath, dispatcherContent, 'utf-8');
console.log(`Dispatcher generated at ${outputPath}`);