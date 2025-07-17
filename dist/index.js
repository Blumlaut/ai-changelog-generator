/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 640:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(721);
const fetch = global.fetch || ((...args) =>
  __nccwpck_require__.e(/* import() */ 495).then(__nccwpck_require__.t.bind(__nccwpck_require__, 495, 23)).then(({ default: fetch }) => fetch(...args)));

async function generateChangelog(prompt, { apiKey, apiBaseUrl = 'https://api.openai.com', model = 'gpt-3.5-turbo', systemPrompt = 'You are a helpful assistant that writes changelog entries.' } = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });
    if (!res.ok) {
      const text = await res.text();
      core.error(`OpenAI request failed: ${res.status} ${res.statusText}`);
      core.error(text);
      return '';
    }
    const data = await res.json();
    return data.choices && data.choices[0] && data.choices[0].message.content.trim();
  } catch (err) {
    core.error(`OpenAI fetch error: ${err.message}`);
    return '';
  }
}

module.exports = { generateChangelog };


/***/ }),

/***/ 721:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 425:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 317:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nccwpck_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__nccwpck_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__nccwpck_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__nccwpck_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__nccwpck_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__nccwpck_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
/******/ 				__nccwpck_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__nccwpck_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			792: 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__nccwpck_require__.o(moreModules, moduleId)) {
/******/ 					__nccwpck_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__nccwpck_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__nccwpck_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __nccwpck_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(721);
const github = __nccwpck_require__(425);
const { execSync } = __nccwpck_require__(317);
const fs = __nccwpck_require__(896);
const path = __nccwpck_require__(928);

async function run() {
  try {
    const apiKey = core.getInput('api_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const baseBranch = core.getInput('base_branch') || 'main';
    const style = core.getInput('style') || 'summary';
    const provider = core.getInput('provider') || 'openai';
    const apiBase = core.getInput('api_base_url');
    const systemPrompt = core.getInput('system_prompt') || "You are a changelog generator, create a short, informative, bullet-point changelog for the provided information, do not preface your response with anything or comment on the commits, only return the changelogs as a list of items. Do not include changes which mention the changelogs.";
    const model = core.getInput('model');
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const headBranch = 'generate-ai-changelog';

    // fetch previous changelog branch if it exists
    try {
      execSync(`git fetch origin ${headBranch}`, { stdio: 'ignore' });
    } catch (_) {}

    // determine the base commit for collecting new changes
    let baseCommit = '';
    try {
      baseCommit = execSync(`git rev-parse origin/${headBranch}`, { encoding: 'utf8' }).trim();
    } catch (_) {
      try {
        baseCommit = execSync('git log -n 1 --pretty=format:%H -- CHANGELOG.md', { encoding: 'utf8' }).trim();
      } catch (_) {
        baseCommit = '';
      }
    }

    const range = baseCommit ? `${baseCommit}..HEAD` : `${baseBranch}..HEAD`;
    const shas = execSync(`git rev-list ${range}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .reverse();

    let commits = '';
    for (const sha of shas) {
      const files = execSync(`git show --pretty="" --name-only ${sha}`, { encoding: 'utf8' })
        .trim()
        .split('\n');
      if (files.includes('CHANGELOG.md')) {
        continue;
      }
      const message = execSync(`git show -s --format=%s%n%b ${sha}`, { encoding: 'utf8' });
      const diff = execSync(`git show ${sha} --patch --no-color --no-prefix`, { encoding: 'utf8' });
      commits += `Commit ${sha}\n${message}\n${diff}\n`;
    }

    if (!commits.trim()) {
      core.info('No new commits found for changelog generation.');
      return;
    }

    const prompt = `Generate a ${style} changelog entry for the following git commits:\n${commits}`;

    let providerPath;
    try {
      providerPath = __nccwpck_require__.ab + "providers/" + provider;
      // eslint-disable-next-line import/no-dynamic-require
      var { generateChangelog } = require(providerPath); // dynamic import
    } catch (_) {
      core.warning(`Unknown provider "${provider}", falling back to openai.`);
      providerPath = path.join(__dirname, 'providers', 'openai');
      // eslint-disable-next-line import/no-dynamic-require
      var { generateChangelog } = __nccwpck_require__(640);
    }

    const changelog = await generateChangelog(prompt, {
      apiKey,
      apiBaseUrl: apiBase,
      systemPrompt,
      model
    });
    if (!changelog) {
      core.error(`Failed to generate changelog for "${provider}".`);
      core.setFailed('Failed to generate changelog.');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const dateHeader = `## ${date}`;
    const entry = `${changelog}\n`;

    let existing = '';
    try {
      existing = execSync(`git show origin/${headBranch}:CHANGELOG.md`, { encoding: 'utf8' });
    } catch (_) {
      if (fs.existsSync('CHANGELOG.md')) {
        existing = fs.readFileSync('CHANGELOG.md', 'utf8');
      }
    }
    if (!existing.startsWith('# Changelog')) {
      existing = `# Changelog\n\n${existing}`;
    }
    const header = '# Changelog';
    let rest = existing.replace(/^# Changelog\n*/, '');

    if (rest.startsWith(`${dateHeader}\n`)) {
      const lines = rest.split('\n');
      let i = 1;
      while (i < lines.length && !lines[i].startsWith('## ')) {
        i++;
      }
      const current = lines.slice(0, i).join('\n');
      const remainder = lines.slice(i).join('\n');
      rest = `${current}\n${entry}${remainder}`.replace(/\n+$/, '\n');
    } else {
      rest = `${dateHeader}\n${entry}${rest}`;
    }

    const newContent = `${header}\n\n${rest}`;
    fs.writeFileSync('CHANGELOG.md', newContent);

    execSync('git config user.name "github-actions"');
    execSync('git config user.email "github-actions@users.noreply.github.com"');
    execSync(`git checkout -B ${headBranch}`);
    execSync('git add CHANGELOG.md');
    execSync('git commit -m "chore: update changelog"');
    execSync(`git push --force origin ${headBranch}`);

    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${headBranch}`,
      state: 'open'
    });

    if (pulls.length === 0) {
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'chore: update changelog with recent changes',
        head: headBranch,
        base: baseBranch,
        body: 'Automated changelog update.'
      });
    } else {
      await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pulls[0].number,
        body: 'Automated changelog update.'
      });
    }
  } catch (err) {
    core.error(err.stack || err.message);
    core.setFailed(err.message);
  }
}

run();

module.exports = __webpack_exports__;
/******/ })()
;