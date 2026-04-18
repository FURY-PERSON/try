const fs = require('fs');
const path = require('path');

// Patch unity-levelplay-mediation: strip all #ifdef RCT_NEW_ARCH_ENABLED blocks,
// keeping the #else branch (old-arch code). This forces old-arch interop mode
// which React Native supports automatically.
// Needed because LevelPlay's Fabric code uses codegen types that don't compile
// with RN 0.83+ prebuilt binaries.
const levelplayDir = path.join(__dirname, '..', 'node_modules', 'unity-levelplay-mediation', 'ios');

function stripNewArchBlocks(fileName) {
  const filePath = path.join(levelplayDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('RCT_NEW_ARCH_ENABLED')) return;

  const result = [];
  const lines = content.split('\n');
  let inIfdef = false;   // inside #ifdef RCT_NEW_ARCH_ENABLED (true branch)
  let inElse = false;    // inside #else (old-arch branch — keep this)

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed === '#ifdef RCT_NEW_ARCH_ENABLED') {
      inIfdef = true;
      inElse = false;
      continue;
    }

    if (inIfdef && !inElse && trimmed === '#else') {
      inElse = true;
      continue;
    }

    if ((inIfdef || inElse) && trimmed === '#endif') {
      inIfdef = false;
      inElse = false;
      continue;
    }

    // Keep the line if we're NOT in the ifdef true-branch
    if (!inIfdef || inElse) {
      result.push(lines[i]);
    }
  }

  const newContent = result.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Patched ${fileName}: stripped RCT_NEW_ARCH_ENABLED blocks`);
  }
}

stripNewArchBlocks('LevelPlayBannerAdView.h');
stripNewArchBlocks('LevelPlayNativeAdView.h');
stripNewArchBlocks('LevelPlayBannerAdView.mm');
stripNewArchBlocks('LevelPlayNativeAdView.mm');

// Remove dead C++ helper functions that were only used by Fabric event emitters.
// These use std::string which doesn't compile in ObjC mode without proper includes.
function removeCppHelpers(fileName) {
  const filePath = path.join(levelplayDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove #pragma mark - Event Helpers block and all static std:: functions before @implementation
  const original = content;
  content = content.replace(
    /#pragma mark - Event Helpers[\s\S]*?(?=\/\*\*\n Class for implementing|@implementation)/,
    ''
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${fileName}: removed dead C++ helper functions`);
  }
}

removeCppHelpers('LevelPlayBannerAdView.mm');
removeCppHelpers('LevelPlayNativeAdView.mm');

// Add stub Cls functions returning nil — needed because RCTThirdPartyFabricComponentsProvider
// references these symbols. Returning nil makes Fabric fall back to old-arch ViewManager interop.
function addStubCls(fileName, clsName) {
  const filePath = path.join(levelplayDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(clsName)) return;
  content += `
// Stub: return nil so Fabric falls back to old-arch ViewManager interop.
#import <React/RCTComponentViewProtocol.h>
extern "C" Class<RCTComponentViewProtocol> ${clsName}(void) { return nil; }
`;
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${fileName}: added stub ${clsName}`);
}

addStubCls('LevelPlayBannerAdView.mm', 'LevelPlayBannerAdViewCls');
addStubCls('LevelPlayNativeAdView.mm', 'LevelPlayNativeAdViewCls');

// Strip codegenConfig.ios.componentProvider from unity-levelplay-mediation/package.json.
// Codegen uses it to register LevelPlayBannerAdView/NativeAdView into
// RCTThirdPartyComponentsProvider.mm as NSClassFromString(...), but the actual ObjC
// classes are plain UIView subclasses (not RCTViewComponentView), so Fabric trips on
// "Exception in HostFunction: <unknown>" while rendering. Removing the provider entry
// lets the automatic Fabric<->legacy ViewManager interop layer handle these views.
function stripComponentProvider() {
  const pkgPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'unity-levelplay-mediation',
    'package.json',
  );
  if (!fs.existsSync(pkgPath)) return;
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  const ios = pkg.codegenConfig && pkg.codegenConfig.ios;
  if (ios && ios.componentProvider) {
    delete ios.componentProvider;
    if (Object.keys(ios).length === 0) {
      delete pkg.codegenConfig.ios;
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Patched unity-levelplay-mediation/package.json: stripped codegenConfig.ios.componentProvider');
  }
}

stripComponentProvider();

// Purge the stale generated provider so next pod install regenerates it without LevelPlay entries.
function purgeGeneratedProvider() {
  const providerPath = path.join(
    __dirname,
    '..',
    'ios',
    'build',
    'generated',
    'ios',
    'ReactCodegen',
    'RCTThirdPartyComponentsProvider.mm',
  );
  if (fs.existsSync(providerPath)) {
    fs.unlinkSync(providerPath);
    console.log('Purged stale RCTThirdPartyComponentsProvider.mm; re-run pod install to regenerate.');
  }
}

purgeGeneratedProvider();
