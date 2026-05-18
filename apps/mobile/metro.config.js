const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Allow Metro to follow pnpm symlinks that resolve into the monorepo root's node_modules
config.watchFolders = [projectRoot, monorepoRoot];

module.exports = config;
