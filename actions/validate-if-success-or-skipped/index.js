const core = require('@actions/core');
const { context } = require('@actions/github');

const run = () => {
  try {
    core.info(JSON.stringify(context));
    core.info(JSON.stringify(core.getInput('jobs', { required: true })));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
