const semver = require('semver');
const { getLatestTag } = require('./git');
const { inc } = require('bump-file');
const _ = require('lodash');
const conventionalRecommendedBump = require('conventional-recommended-bump');

const releaseTypes = ['premajor', 'major', 'preminor', 'minor', 'prepatch', 'patch', 'prerelease', 'pre'];

const isValid = value => !!semver.valid(value);

const isValidSystem = ({ system, preset }) => system === 'conventional' && preset === 'angular';

const getConventionalRecommendedBump = preset =>
  new Promise((resolve, reject) => {
    conventionalRecommendedBump(
      {
        preset
      },
      function(err, result) {
        if (err) return reject(err);
        resolve(result.releaseType);
      }
    );
  });

const parse = async options => {
  const { increment = '', preReleaseId } = options;

  const latestTag = await getLatestTag();
  const latestVersion = isValid(latestTag) ? latestTag : options.npm.version;

  const isValidVersion = isValid(increment) && semver.gt(increment, latestVersion);

  if (isValidVersion) {
    return {
      latestVersion,
      version: increment
    };
  }

  const isValidType = _.includes(releaseTypes, increment);

  if (isValidType) {
    return {
      latestVersion,
      version: inc(latestVersion, increment, preReleaseId)
    };
  }

  const [system, preset] = increment.split(':');

  if (isValidSystem({ system, preset })) {
    if (system === 'conventional') {
      const recommendedType = await getConventionalRecommendedBump(preset);
      const isValidRecommendedType = _.includes(releaseTypes, recommendedType);
      if (isValidRecommendedType) {
        return {
          latestVersion,
          version: inc(latestVersion, recommendedType, preReleaseId)
        };
      }
    }
  }

  return {
    latestVersion,
    version: null
  };
};

module.exports = {
  isValid,
  parse
};
