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
