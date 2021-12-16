const core = require('@actions/core');
const escapeStringRegexp = require('escape-string-regexp');

const run = async () => {
  try {
    // Create GitHub client with the API token
    const input = core.getInput('input', { required: true });
    // TODO sanitization of delimiter?
    const rawRegex = core.getInput('regex', { required: true });
    let regex;

    try {
      // javascript has no in built solution for escaping special characters for regex
      // this package is used by 11million repos and has 60 million weekly downloads
      // https://www.npmjs.com/package/escape-string-regexp
      regex = escapeStringRegexp(rawRegex);
    } catch (e) {
      core.setFailed(e.message);
    }

    const values = JSON.parse(input);

    // check input type
    if (values.some((e) => typeof e !== 'string')) {
      core.setFailed('Array contains non-string value');
    }

    try {
      // eslint-disable-next-line no-new
      new RegExp(regex);
    } catch (e) {
      core.setFailed(`Invalid regular expression ${regex}. ${e.message}`);
    }

    const match = values.find((value) => value.match(regex));

    // Set step output context
    core.setOutput('match', match);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
