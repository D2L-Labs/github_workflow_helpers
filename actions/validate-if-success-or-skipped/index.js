const core = require('@actions/core');
const { context } = require('@actions/github');

const run = () => {
  try {
    core.info(JSON.stringify(context));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
