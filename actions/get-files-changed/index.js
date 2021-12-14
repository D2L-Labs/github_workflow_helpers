const core = require('@actions/core');
const { getOctokit, context } = require('@actions/github');

const NEWLINE = '\r\n';

const run = async () => {
  try {
    // Create GitHub client with the API token.
    const octokit = getOctokit(core.getInput('token', { required: true }));
    const format = core.getInput('format', { required: true }); // default string
    // TODO sanitization of delimiter?
    const delimiter = core.getInput('delimiter', { required: false }); // default ' '
    const acceptedFormats = ['json-array', 'json-matrix', 'string'];
    // Ensure that the format parameter is set properly.
    if (!acceptedFormats.includes(format)) {
      core.setFailed(`Format must be one of 'json-array', 'json-matrix', or 'string' got '${format}'.`);
    }

    // Debug log the payload.
    core.debug(`Payload keys: ${Object.keys(context.payload)}`);

    // Get event name.
    const { eventName } = context;

    // Define the base and head commits to be extracted from the payload.
    let base;
    let head;

    switch (eventName) {
      case 'pull_request':
        base = context.payload.pull_request?.base?.sha;
        head = context.payload.pull_request?.head?.sha;
        break;
      case 'push':
        base = context.payload.before;
        head = context.payload.after;
        break;
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${context.eventName} events are not supported.
          Please submit an issue on this action's GitHub repo if you believe this in correct.`,
        );
    }

    // Log the base and head commits
    core.info(`Base commit: ${base}`);
    core.info(`Head commit: ${head}`);

    // Ensure that the base and head properties are set on the payload.
    if (!base || !head) {
      core.setFailed(
        `The base and head commits are missing from the payload for this ${context.eventName} event. 
        Please submit an issue on this action's GitHub repo.`,
      );
    }

    // Use Github recommended oktokit to compare two commits API.
    const response = await octokit.rest.repos.compareCommits({
      base,
      head,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} 
        event returned ${response.status}, expected 200. Please submit an issue on this action's GitHub repo.`,
      );
    }

    // Ensure that the head commit is ahead of the base commit.
    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${context.eventName} event is not ahead of the base commit. 
        Please submit an issue on this action's GitHub repo.`,
      );
    }

    // Get the changed files from the response payload.
    const { files } = response.data;
    const all = [];
    const added = [];
    const modified = [];
    const removed = [];
    const renamed = [];
    files.forEach((file) => {
      const { filename } = file;
      // If we're using a space delimiter and any of the filenames have a space in them,
      // then fail the step.
      if (format === 'string' && delimiter === ' ' && filename.includes(' ')) {
        core.setFailed(
          `One of your filenames includes a space. Consider using a different output format or 
          removing spaces from your filenames. Please submit an issue on this action's GitHub repo.`,
        );
      }
      all.push(filename);
      switch (file.status) {
        case 'added':
          added.push(filename);
          break;
        case 'modified':
          modified.push(filename);
          break;
        case 'removed':
          removed.push(filename);
          break;
        case 'renamed':
          renamed.push(filename);
          break;
        default:
          core.setFailed(
            `One of your files includes an unsupported file status '${file.status}', 
            expected 'added', 'modified', 'removed', or 'renamed'.`,
          );
      }
    });

    const allLog = all.join(NEWLINE);
    const addedLog = added.join(NEWLINE);
    const modifiedLog = modified.join(NEWLINE);
    const removedLog = removed.join(NEWLINE);
    const renamedLog = renamed.join(NEWLINE);

    // Log the output values.
    core.info(`All: ${allLog}`);
    core.info(`Added: ${addedLog}`);
    core.info(`Modified: ${modifiedLog}`);
    core.info(`Removed: ${removedLog}`);
    core.info(`Renamed: ${renamedLog}`);

    let allOuput; let addedOutput; let modifiedOutput; let removedOutput; let
      renamedOutput;

    switch (format) {
      case 'json-array':
        allOuput = JSON.stringify(all);
        addedOutput = JSON.stringify(added);
        modifiedOutput = JSON.stringify(modified);
        removedOutput = JSON.stringify(removed);
        renamedOutput = JSON.stringify(renamed);
        break;
      case 'json-matrix':
        allOuput = {
          includes: JSON.stringify(all),
        };
        addedOutput = {
          includes: JSON.stringify(added),
        };
        modifiedOutput = {
          includes: JSON.stringify(modified),
        };
        removedOutput = {
          includes: JSON.stringify(removed),
        };
        renamedOutput = {
          includes: JSON.stringify(renamed),
        };
        break;
      case 'string':
        // Format the arrays of changed files.
        allOuput = all.join(delimiter);
        addedOutput = added.join(delimiter);
        modifiedOutput = modified.join(delimiter);
        removedOutput = removed.join(delimiter);
        renamedOutput = renamed.join(delimiter);
        break;
      default:
        core.setFailed(`Unexpected Error. Should have been caught earlier. 
        Format must be one of 'json-array', 'json-matrix', or 'string' got '${format}'.`);
    }
    // Set step output context.
    core.setOutput('all', allOuput);
    core.setOutput('added', addedOutput);
    core.setOutput('modified', modifiedOutput);
    core.setOutput('removed', removedOutput);
    core.setOutput('renamed', renamedOutput);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
