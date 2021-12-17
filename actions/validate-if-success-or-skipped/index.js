const core = require('@actions/core');
const { context } = require('@actions/github');

const run = () => {
  try {
    core.info(JSON.stringify(context));
    core.info(core.getInput('jobs'));
    core.info(JSON.stringify(core.getInput('jobs')));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
