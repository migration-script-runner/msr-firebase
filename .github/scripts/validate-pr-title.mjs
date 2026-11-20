import {pathToFileURL} from 'node:url';

const issueTitlePattern = /^#[1-9][0-9]*: [A-Z].+$/;
const dependabotAuthorLogin = 'dependabot[bot]';

/**
 * Determines whether the repository title convention applies to a pull request author.
 * Dependabot uses generated titles and is exempt from this check.
 * @param {string} authorLogin Pull request author's GitHub login.
 * @returns {boolean} Whether the title should be checked.
 */
export function shouldValidatePullRequestTitle(authorLogin) {
    return authorLogin !== dependabotAuthorLogin;
}

/**
 * Checks a pull request title against the repository issue-reference convention.
 * @param {string} title Pull request title.
 * @returns {boolean} Whether the title is allowed.
 */
export function isValidPullRequestTitle(title) {
    return issueTitlePattern.test(title);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const title = process.env.PR_TITLE ?? '';
    const authorLogin = process.env.PR_AUTHOR ?? '';

    if (!shouldValidatePullRequestTitle(authorLogin)) {
        console.info('Skipping title validation for Dependabot pull requests.');
        process.exit(0);
    }

    if (isValidPullRequestTitle(title)) {
        process.exit(0);
    }

    console.error('Use the format "#<issue number>: <imperative title>" for pull request titles.');
    process.exit(1);
}
