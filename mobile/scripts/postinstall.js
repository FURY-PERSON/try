const fs = require('fs');
const path = require('path');

// Patch expo-localization: add @unknown default to Swift switch
const file = path.join(__dirname, '..', 'node_modules', 'expo-localization', 'ios', 'LocalizationModule.swift');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('@unknown default')) {
    content = content.replace(
      `case .iso8601:\n      return "iso8601"\n    }`,
      `case .iso8601:\n      return "iso8601"\n    @unknown default:\n      return "gregory"\n    }`
    );
    fs.writeFileSync(file, content);
    console.log('Patched expo-localization Swift switch');
  }
}

// Patch unity-levelplay-mediation: add extern "C" to Fabric component functions
// to prevent C++ name mangling (bug in SDK 9.0.0 with New Architecture + static frameworks)
const levelplayFiles = [
  'LevelPlayBannerAdView.mm',
  'LevelPlayNativeAdView.mm',
];
for (const fileName of levelplayFiles) {
  const filePath = path.join(__dirname, '..', 'node_modules', 'unity-levelplay-mediation', 'ios', fileName);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Match the pattern: #ifdef RCT_NEW_ARCH_ENABLED\nClass<...> SomeNameCls(void)
    const pattern = /#ifdef RCT_NEW_ARCH_ENABLED\nClass<RCTComponentViewProtocol>\s+(\w+Cls)\(void\)/;
    if (pattern.test(content) && !content.includes('extern "C"')) {
      content = content.replace(
        pattern,
        '#ifdef RCT_NEW_ARCH_ENABLED\nextern "C" Class<RCTComponentViewProtocol> $1(void)'
      );
      fs.writeFileSync(filePath, content);
      console.log(`Patched ${fileName}: added extern "C" for Fabric component`);
    }
  }
}
