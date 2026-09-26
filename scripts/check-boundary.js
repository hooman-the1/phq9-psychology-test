const fs = require('node:fs');
const path = require('node:path');

const EXCLUDED_DIRECTORIES = new Set([
  '.angular',
  '.git',
  'copied-from-main-repo',
  'coverage',
  'dist',
  'node_modules',
]);

const CONFIG_FILES = new Set([
  'angular.json',
  'karma.conf.js',
  'package-lock.json',
  'package.json',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.spec.json',
]);

const FORBIDDEN_REFERENCE = /yekravankav|copied-from-main-repo/i;
const IMPORT_PATTERN = /(?:import\s+(?:[\s\S]*?\s+from\s+|type\s+)?|export\s+[\s\S]*?\s+from\s+|require\s*\(\s*|import\s*\(\s*)(['"])([^'"]+)\1/g;

function listFiles(root, relativeDirectory = '') {
  const directory = path.join(root, relativeDirectory);
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function readJson(root, relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch {
    return undefined;
  }
}

function packageNames(packageJson) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
  ]);
}

function packageName(specifier) {
  if (!specifier.startsWith('@')) {
    return specifier.split('/')[0];
  }

  return specifier.split('/').slice(0, 2).join('/');
}

function hasLocalModule(root, importer, specifier) {
  const base = path.resolve(path.dirname(path.join(root, importer)), specifier);
  const candidates = [
    base,
    ...['.ts', '.tsx', '.js', '.mjs'].map((extension) => `${base}${extension}`),
    ...['index.ts', 'index.tsx', 'index.js', 'index.mjs'].map((file) => path.join(base, file)),
  ];

  return candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function inspectImports(root, relativePath, source, declaredPackages, issues) {
  if (!relativePath.startsWith('src' + path.sep) || !/\.(m|c)?tsx?$/.test(relativePath)) {
    return;
  }

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[2];

    if (specifier.startsWith('..')) {
      issues.push(`${relativePath}: parent-directory import '${specifier}' is not allowed`);
      continue;
    }

    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      if (!specifier.startsWith('.') || !hasLocalModule(root, relativePath, specifier)) {
        issues.push(`${relativePath}: import '${specifier}' does not resolve to a local file`);
      }
      continue;
    }

    if (!declaredPackages.has(packageName(specifier))) {
      issues.push(`${relativePath}: undeclared package import '${specifier}'`);
    }
  }
}

function inspectRepository(root) {
  const issues = [];
  const files = listFiles(root);
  const packageJson = readJson(root, 'package.json');
  const declaredPackages = packageNames(packageJson);

  if (!packageJson) {
    issues.push('package.json is missing or invalid');
  }

  for (const relativePath of files) {
    const normalizedPath = relativePath.split(path.sep).join('/');
    const shouldInspectContent = normalizedPath.startsWith('src/') || CONFIG_FILES.has(normalizedPath);

    if (FORBIDDEN_REFERENCE.test(normalizedPath)) {
      issues.push(`${normalizedPath}: original-application path reference is not allowed`);
    }

    if (!shouldInspectContent) {
      continue;
    }

    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (FORBIDDEN_REFERENCE.test(source)) {
      issues.push(`${normalizedPath}: original-application reference is not allowed`);
    }

    inspectImports(root, relativePath, source, declaredPackages, issues);
  }

  if (fs.existsSync(path.join(root, '.gitmodules'))) {
    issues.push('.gitmodules is not allowed in the standalone repository');
  }

  return issues;
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] ?? process.cwd());
  const issues = inspectRepository(root);

  if (issues.length > 0) {
    console.error('Standalone boundary check failed:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Standalone boundary check passed.');
  }
}

module.exports = { inspectRepository };
