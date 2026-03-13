const {
  withDangerousMod,
  withXcodeProject,
  withInfoPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DENSITIES = ['hdpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const ICON_FILES = ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png'];
const LOCALES = ['ru', 'en'];

// ─── Android ────────────────────────────────────────────────────────────────

function withAndroidLocalizedIcons(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res'
      );
      const iconsRoot = path.join(config.modRequest.projectRoot, '..', 'icons_%LOCALE%');

      for (const locale of LOCALES) {
        const sourceBase = iconsRoot.replace('%LOCALE%', locale);

        for (const density of DENSITIES) {
          const targetDir = path.join(resDir, `mipmap-${locale}-${density}`);
          fs.mkdirSync(targetDir, { recursive: true });

          for (const file of ICON_FILES) {
            const src = path.join(sourceBase, 'android', `mipmap-${density}`, file);
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, path.join(targetDir, file));
            }
          }
        }
      }

      return config;
    },
  ]);
}

// ─── iOS ─────────────────────────────────────────────────────────────────────

// Icon variants: [source filename in appiconset, destination name prefix, sizes array]
// iOS alternate icons need at least 60@2x and 60@3x for iPhone
const IOS_ICON_MAP = [
  { src: 'icon-ios-60x60@2x.png', dst: '@2x.png' },
  { src: 'icon-ios-60x60@3x.png', dst: '@3x.png' },
];

function withIosCopyIcons(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      const iosRoot = config.modRequest.platformProjectRoot;
      const iconsRoot = path.join(config.modRequest.projectRoot, '..', 'icons_%LOCALE%');

      for (const locale of LOCALES) {
        const sourceDir = path.join(
          iconsRoot.replace('%LOCALE%', locale),
          'apple-devices',
          'AppIcon.appiconset'
        );
        const iconName = `AppIcon${locale.charAt(0).toUpperCase() + locale.slice(1)}`;

        for (const { src, dst } of IOS_ICON_MAP) {
          const srcFile = path.join(sourceDir, src);
          if (fs.existsSync(srcFile)) {
            const dstFile = path.join(iosRoot, projectName, `${iconName}${dst}`);
            fs.copyFileSync(srcFile, dstFile);
          }
        }
      }

      return config;
    },
  ]);
}

function withIosXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;

    for (const locale of LOCALES) {
      const iconName = `AppIcon${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
      for (const { dst } of IOS_ICON_MAP) {
        const filePath = `${projectName}/${iconName}${dst}`;
        // Avoid adding duplicates
        const existing = project.pbxFileReferenceSection();
        const alreadyAdded = Object.values(existing).some(
          (ref) => typeof ref === 'object' && ref.path === `"${iconName}${dst}"`
        );
        if (!alreadyAdded) {
          project.addResourceFile(filePath);
        }
      }
    }

    return config;
  });
}

function withIosInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    const alternateIcons = {};
    for (const locale of LOCALES) {
      const iconName = `AppIcon${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
      alternateIcons[iconName] = {
        CFBundleIconFiles: [iconName],
        UIPrerenderedIcon: false,
      };
    }

    config.modResults['CFBundleIcons'] = {
      ...(config.modResults['CFBundleIcons'] || {}),
      CFBundleAlternateIcons: alternateIcons,
    };

    // iPad
    config.modResults['CFBundleIcons~ipad'] = {
      ...(config.modResults['CFBundleIcons~ipad'] || {}),
      CFBundleAlternateIcons: alternateIcons,
    };

    return config;
  });
}

// ─── Swift native module for icon switching ───────────────────────────────────

const SWIFT_MODULE = `
import UIKit

@objc(LocalizedIconsModule)
class LocalizedIconsModule: NSObject {
  @objc func setIcon(_ name: String?,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      // Uses private API to avoid the system alert dialog
      UIApplication.shared.setValue(name, forKey: "alternateIconName")
      resolve(nil)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
`.trim();

const OBJC_BRIDGE = `
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LocalizedIconsModule, NSObject)
RCT_EXTERN_METHOD(setIcon:(NSString *)name
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
@end
`.trim();

function withIosNativeModule(config) {
  // Write source files
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      const iosRoot = config.modRequest.platformProjectRoot;
      const dir = path.join(iosRoot, projectName);

      fs.writeFileSync(path.join(dir, 'LocalizedIconsModule.swift'), SWIFT_MODULE);
      fs.writeFileSync(path.join(dir, 'LocalizedIconsModule.m'), OBJC_BRIDGE);

      return config;
    },
  ]);

  // Add files to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;

    for (const file of ['LocalizedIconsModule.swift', 'LocalizedIconsModule.m']) {
      const filePath = `${projectName}/${file}`;
      const existing = project.pbxFileReferenceSection();
      const alreadyAdded = Object.values(existing).some(
        (ref) => typeof ref === 'object' && ref.path === `"${file}"`
      );
      if (!alreadyAdded) {
        project.addSourceFile(filePath);
      }
    }

    return config;
  });

  return config;
}

// ─── Main export ─────────────────────────────────────────────────────────────

function withLocalizedIcons(config) {
  // Android
  config = withAndroidLocalizedIcons(config);

  // iOS
  config = withIosCopyIcons(config);
  config = withIosXcodeProject(config);
  config = withIosInfoPlist(config);
  config = withIosNativeModule(config);

  return config;
}

module.exports = withLocalizedIcons;
