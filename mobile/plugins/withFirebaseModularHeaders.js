const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');

        const modularPods = [
          "pod 'FirebaseCore', :modular_headers => true",
          "pod 'FirebaseCoreInternal', :modular_headers => true",
          "pod 'FirebaseInstallations', :modular_headers => true",
          "pod 'FirebaseSessions', :modular_headers => true",
          "pod 'GoogleUtilities', :modular_headers => true",
          "pod 'GoogleDataTransport', :modular_headers => true",
          "pod 'nanopb', :modular_headers => true",
        ].join('\n  ');

        if (!podfile.includes('FirebaseCore')) {
          podfile = podfile.replace(
            /target '.*' do\n  use_expo_modules!/,
            (match) => `${match.split('\n')[0]}\n  ${modularPods}\n\n  use_expo_modules!`
          );
          fs.writeFileSync(podfilePath, podfile);
        }
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
