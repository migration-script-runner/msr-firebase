import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {isValidPullRequestTitle, shouldValidatePullRequestTitle} from '../../.github/scripts/validate-pr-title.mjs';

const validatorPath = fileURLToPath(new URL('../../.github/scripts/validate-pr-title.mjs', import.meta.url));

describe('pull request title validation', () => {
    it('skips title validation only for Dependabot-authored pull requests', () => {
        assert.equal(shouldValidatePullRequestTitle('dependabot[bot]'), false);
        assert.equal(shouldValidatePullRequestTitle('vlavrynovych'), true);
        assert.equal(shouldValidatePullRequestTitle(''), true);
    });

    it('allows issue-formatted task titles', () => {
        assert.equal(isValidPullRequestTitle('#78: Add GitHub Actions'), true);
    });

    it('rejects titles without a valid issue reference and imperative title', () => {
        assert.equal(isValidPullRequestTitle('Add GitHub Actions'), false);
        assert.equal(isValidPullRequestTitle('#0: Add GitHub Actions'), false);
        assert.equal(isValidPullRequestTitle('#78: add GitHub Actions'), false);
        assert.equal(isValidPullRequestTitle('#78: '), false);
    });

    it('skips generated Dependabot titles in the CLI validator', () => {
        const result = spawnSync(process.execPath, [validatorPath], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PR_AUTHOR: 'dependabot[bot]',
                PR_TITLE: 'Bump lodash from 4.17.21 to 4.17.23'
            }
        });

        assert.equal(result.status, 0);
        assert.match(result.stdout, /Skipping title validation for Dependabot pull requests/);
    });

    it('rejects invalid titles in the CLI validator', () => {
        const result = spawnSync(process.execPath, [validatorPath], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PR_AUTHOR: 'vlavrynovych',
                PR_TITLE: 'Bump lodash from 4.17.21 to 4.17.23'
            }
        });

        assert.equal(result.status, 1);
        assert.match(result.stderr, /#<issue number>: <imperative title>/);
    });
});
