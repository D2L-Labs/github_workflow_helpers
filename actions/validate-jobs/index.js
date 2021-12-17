const core = require('@actions/core');

const run = () => {
  try {
    const needs = JSON.parse(core.getInput('needs', { required: true }));
    // const accepted = JSON.parse(core.getInput('accepted'));
    const accepted = ['success', 'skipped'];

    const failedJobs = [];
    Object.entries(needs).forEach(([job, value]) => {
      if (!(accepted.includes(value.result))) {
        failedJobs.push(job);
      }
    });
    if (failedJobs.length > 0) {
      core.setFailed(`Failed jobs: ${failedJobs}`);
    } else {
      core.info('All jobs validated!');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
