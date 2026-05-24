const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

module.exports = function (api) {
  api.cache(true);

  // In pnpm monorepos, babel-preset-expo isn't hoisted. Resolve explicitly
  // from the mobile package root, falling back to the monorepo root's pnpm
  // virtual store (covers Xcode archive builds where CWD may vary).
  let presetExpo;
  try {
    presetExpo = require.resolve('babel-preset-expo', { paths: [__dirname] });
  } catch {
    presetExpo = require.resolve('babel-preset-expo', {
      paths: [path.join(monorepoRoot, 'node_modules', '.pnpm')],
    });
  }

  return {
    presets: [presetExpo],
    plugins: ['react-native-reanimated/plugin'],
  };
};
