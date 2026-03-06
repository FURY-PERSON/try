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

// Patch unity-levelplay-mediation: disable Fabric (New Architecture) for native view components
// to fix EXC_BAD_ACCESS crash on real iOS devices with static frameworks.
// Views will use old-arch interop layer (supported by React Native automatically).
const levelplayDir = path.join(__dirname, '..', 'node_modules', 'unity-levelplay-mediation', 'ios');

function stripFabricFromHeader(fileName) {
  const filePath = path.join(levelplayDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('RCT_NEW_ARCH_ENABLED')) return;
  // Replace: #ifdef RCT_NEW_ARCH_ENABLED ... @interface X : RCTViewComponentView #else @interface X : UIView #endif
  // With just: @interface X : UIView
  content = content.replace(
    /#ifdef RCT_NEW_ARCH_ENABLED\n#import <React\/RCTViewComponentView\.h>\n@interface (\w+) : RCTViewComponentView\n#else\n@interface \1 : UIView\n#endif/,
    '@interface $1 : UIView'
  );
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${fileName}: forced UIView (disabled Fabric)`);
}

function stripFabricFromImpl(fileName) {
  const filePath = path.join(levelplayDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('RCT_NEW_ARCH_ENABLED')) return;

  // 1. Remove Fabric imports block (#ifdef RCT_NEW_ARCH_ENABLED ... #import ... using namespace ... @interface with Fabric protocol ... #else @interface ... #endif)
  content = content.replace(
    /#ifdef RCT_NEW_ARCH_ENABLED\n(?:#import <react\/renderer\/components\/.*\n)*(?:#import <React\/RCTConversions\.h>\n)?\n?using namespace facebook::react;\n\n@interface (\w+)\(\)\s*<[^>]+>\n@property[^;]+;\n#else\n@interface \1\(\)<([^>]+)>\n#endif/,
    '@interface $1()<$2>'
  );

  // 2. Remove #ifdef RCT_NEW_ARCH_ENABLED blocks (initWithFrame, updateProps, etc.)
  // This handles multi-line blocks between #ifdef RCT_NEW_ARCH_ENABLED and #endif
  content = content.replace(
    /\n#ifdef RCT_NEW_ARCH_ENABLED\n- \(instancetype\)initWithFrame[\s\S]*?#endif\n/g,
    '\n'
  );

  // 3. Remove trailing Cls function block
  content = content.replace(
    /\n#ifdef RCT_NEW_ARCH_ENABLED\nextern "C"[\s\S]*?#endif\n?/g,
    '\n'
  );

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${fileName}: stripped Fabric code paths`);
}

stripFabricFromHeader('LevelPlayBannerAdView.h');
stripFabricFromHeader('LevelPlayNativeAdView.h');
stripFabricFromImpl('LevelPlayBannerAdView.mm');
stripFabricFromImpl('LevelPlayNativeAdView.mm');

// Add stub Cls functions returning nil — Fabric will fall back to old-arch ViewManager interop
const bannerMM = path.join(levelplayDir, 'LevelPlayBannerAdView.mm');
if (fs.existsSync(bannerMM)) {
  let content = fs.readFileSync(bannerMM, 'utf8');
  if (!content.includes('LevelPlayBannerAdViewCls')) {
    content += `
// Stub Cls functions: return nil so Fabric falls back to old-arch ViewManager interop.
// Needed because RCTThirdPartyFabricComponentsProvider references these symbols.
#import <React/RCTComponentViewProtocol.h>
extern "C" Class<RCTComponentViewProtocol> LevelPlayBannerAdViewCls(void) { return nil; }
`;
    fs.writeFileSync(bannerMM, content);
    console.log('Patched LevelPlayBannerAdView.mm: added stub LevelPlayBannerAdViewCls');
  }
}

const nativeMM = path.join(levelplayDir, 'LevelPlayNativeAdView.mm');
if (fs.existsSync(nativeMM)) {
  let content = fs.readFileSync(nativeMM, 'utf8');
  if (!content.includes('LevelPlayNativeAdViewCls')) {
    content += `
#import <React/RCTComponentViewProtocol.h>
extern "C" Class<RCTComponentViewProtocol> LevelPlayNativeAdViewCls(void) { return nil; }
`;
    fs.writeFileSync(nativeMM, content);
    console.log('Patched LevelPlayNativeAdView.mm: added stub LevelPlayNativeAdViewCls');
  }
}
