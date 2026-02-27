const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withFirebaseDebug(config) {
  return withXcodeProject(config, async (config) => {
    const projectName = config.modRequest.projectName;
    const schemePath = path.join(
      config.modRequest.platformProjectRoot,
      `${projectName}.xcodeproj`,
      'xcshareddata',
      'xcschemes',
      `${projectName}.xcscheme`
    );

    if (fs.existsSync(schemePath)) {
      let scheme = fs.readFileSync(schemePath, 'utf8');

      if (!scheme.includes('-FIRDebugEnabled')) {
        scheme = scheme.replace(
          '</BuildableProductRunnable>\n   </LaunchAction>',
          `</BuildableProductRunnable>
      <CommandLineArguments>
         <CommandLineArgument
            argument = "-FIRDebugEnabled"
            isEnabled = "YES">
         </CommandLineArgument>
      </CommandLineArguments>
   </LaunchAction>`
        );
        fs.writeFileSync(schemePath, scheme);
      }
    }

    return config;
  });
}

module.exports = withFirebaseDebug;
