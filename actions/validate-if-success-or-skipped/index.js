const core = require('@actions/core');

const run = () => {
  try {
    core.info(core.getInput('needs'));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
