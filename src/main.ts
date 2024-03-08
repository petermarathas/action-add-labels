import * as github from '@actions/github';
import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github_token');

    const labels = core
      .getInput('labels')
      .split('\n')
      .filter(l => l !== '');
    const [owner, repo] = core.getInput('repo').split('/');
    const number =
      core.getInput('number') === ''
        ? github.context.issue.number
        : parseInt(core.getInput('number'));

    if (labels.length === 0) {
      return;
    }

    const octokit = github.getOctokit(githubToken);
    const githubLabels = (await octokit.rest.issues.addLabels({
      labels,
      owner,
      repo,
      issue_number: number
    })).reduce((acc, githubLabel) => ({ ...acc, [githubLabel.name]: githubLabel }));

    const colorsInput = core.getInput('colors');
    if (colorsInput === '') {
      return;
    }

    const colors =
      colorsInput.include('\n')
        ? colorsInput.split('\n')
        : Array(labels.length).fill(colorsInput);

    for (const [i, name] of labels.entries()) {
      const color = colors[i];
      if (!color || githubLabels[name].color == color) {
        continue;
      }

      await octokit.rest.issues.updateLabel({
        owner,
        repo,
        name,
        color
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      core.error(e);
      core.setFailed(e.message);
    }
  }
}

run();
