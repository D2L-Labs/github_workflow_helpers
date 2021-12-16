const core = require('@actions/core');

const run = async () => {
  try {
    // Create GitHub client with the API token
    const input = core.getInput('input', { required: true });
    // TODO sanitization of delimiter?
    const regex = core.getInput('regex', { required: true });

    const values = JSON.parse(input);

    // check input type
    if (values.some((e) => typeof e !== 'string')) {
      core.setFailed('Array contains non-string value');
    }

    const match = values.find((value) => value.match(regex));

    // Set step output context
    core.setOutput('match', match);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
