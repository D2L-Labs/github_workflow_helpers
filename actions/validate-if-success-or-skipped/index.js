const core = require('@actions/core');

const run = () => {
  const acceptedResults = ['success', 'skipped'];
  try {
    const needs = JSON.parse(core.getInput('needs', { required: true }));
    const failedJobs = [];
    needs.forEach((job) => {
      if (!(acceptedResults.includes(needs[job].result))) {
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
