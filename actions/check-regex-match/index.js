const core = require('@actions/core');

const run = () => {
  try {
    // Create GitHub client with the API token
    const input = core.getInput('input', { required: true });
    // TODO sanitization of delimiter?
    const rawRegex = core.getInput('regex', { required: true });
    let regex;

    try {
      // not sure if I need to escape anything here
      regex = new RegExp(rawRegex);
    } catch (e) {
      core.setFailed(e.message);
    }

    const values = JSON.parse(input);

    // check input type
    if (values.some((e) => typeof e !== 'string')) {
      core.setFailed('Array contains non-string value');
    }

    const match = values.some((value) => regex.test(value));
    if (match) {
      core.info(`Match found for ${rawRegex}`);
    } else {
      core.info(`No match found for ${rawRegex}`);
    }
    // Set step output context
    core.setOutput('match', match);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
