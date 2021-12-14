/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 42:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(42);
const { getOctokit, context } = __nccwpck_require__(896);

const NEWLINE = '\r\n';

const run = async () => {
  try {
    // Create GitHub client with the API token
    const octokit = getOctokit(core.getInput('token', { required: true }));
    const format = core.getInput('format', { required: true }); // default string
    // TODO sanitization of delimiter?
    const delimiter = core.getInput('delimiter', { required: false }); // default ' '
    const acceptedFormats = ['json-array', 'json-matrix', 'string'];
    // Ensure that the format parameter is correct
    if (!acceptedFormats.includes(format)) {
      core.setFailed(`Format must be one of 'json-array', 'json-matrix', or 'string' got '${format}'.`);
    }

    // Debug log the payload
    core.debug(`Payload keys: ${Object.keys(context.payload)}`);

    // Get event name
    const { eventName } = context;

    // Define the base and head commits to be extracted from the payload
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

    // Ensure that the base and head properties are set on the payload
    if (!base || !head) {
      core.setFailed(
        `The base and head commits are missing from the payload for this ${context.eventName} event. 
        Please submit an issue on this action's GitHub repo.`,
      );
    }

    // Use Github recommended oktokit to compare two commits API
    const response = await octokit.rest.repos.compareCommits({
      base,
      head,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // Ensure that the request was successful
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} 
        event returned ${response.status}, expected 200. Please submit an issue on this action's GitHub repo.`,
      );
    }

    // Get the changed files from the response payload
    const { files } = response.data;
    const all = [];
    const added = [];
    const modified = [];
    const removed = [];
    const renamed = [];
    files.forEach((file) => {
      const { filename } = file;
      // If we're using a space delimiter and any of the filenames have a space in them then fail the step
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

    // Log the output values
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
        // Format the arrays of changed files
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
    // Set step output context
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

})();

module.exports = __webpack_exports__;
/******/ })()
;