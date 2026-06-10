#!/usr/bin/env node

/**
 * bump-version.js
 * 
 * Bumps the project version in both version.json and package.json.
 * 
 * Usage:
 *   node scripts/bump-version.js patch   # 0.1.0 → 0.1.1
 *   node scripts/bump-version.js minor   # 0.1.0 → 0.2.0
 *   node scripts/bump-version.js major   # 0.1.0 → 1.0.0
 */

const fs = require('fs');
const path = require('path');

const BUMP_TYPE = process.argv[2];

if (!['patch', 'minor', 'major'].includes(BUMP_TYPE)) {
  console.error('❌ Usage: node scripts/bump-version.js <patch|minor|major>');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'version.json');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

// Read files
const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
const packageData = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));

const currentVersion = versionData.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
switch (BUMP_TYPE) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Build date in YYYY-MM-DD format
const buildDate = new Date().toISOString().split('T')[0];

// Update version.json
versionData.version = newVersion;
versionData.buildDate = buildDate;

// Add a new changelog entry
versionData.changelog.unshift({
  version: newVersion,
  date: buildDate,
  changes: [`Version bump: ${BUMP_TYPE}`],
});

// Update package.json
packageData.version = newVersion;

// Write files
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');
fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packageData, null, 2) + '\n', 'utf-8');

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion} (${BUMP_TYPE})`);
console.log(`   Updated: version.json, package.json`);
console.log(`   Build date: ${buildDate}`);
