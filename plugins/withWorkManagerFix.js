// Two Android libraries pull in different versions of AndroidX WorkManager (work-runtime 2.8.1 from
// react-native-android-widget, work-runtime-ktx 2.7.1 from another), which makes the release build fail with
// "Duplicate class androidx.work.OneTimeWorkRequestKt". Pin both to 2.8.1, where the ktx artifact is empty.
const { withProjectBuildGradle } = require('expo/config-plugins');

const MARK = '// noor: pin androidx.work';
const BLOCK = `
${MARK}
allprojects {
  configurations.all {
    resolutionStrategy {
      force 'androidx.work:work-runtime:2.8.1'
      force 'androidx.work:work-runtime-ktx:2.8.1'
    }
  }
}
`;

module.exports = (config) =>
  withProjectBuildGradle(config, (c) => {
    if (c.modResults.language === 'groovy' && !c.modResults.contents.includes(MARK)) c.modResults.contents += BLOCK;
    return c;
  });
