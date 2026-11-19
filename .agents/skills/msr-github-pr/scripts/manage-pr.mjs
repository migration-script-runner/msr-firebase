#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const HELP = `Usage: node .agents/skills/msr-github-pr/scripts/manage-pr.mjs --issue <number> --title "#<number>: <title>" --base <branch> --body-file <path> [--head <branch>]

Creates or updates the open pull request for the current task branch, copies issue metadata,
and links the issue through GitHub's Development relationship. The branch must be pushed first.
`;

export function parseArgs(args) {
    const options = {};
    const valueOptions = new Set(['--issue', '--title', '--body-file', '--base', '--head']);

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (argument === '--help' || argument === '-h') {
            return {help: true};
        }
        if (!valueOptions.has(argument)) {
            throw new Error(`Unknown option: ${argument}`);
        }

        const value = args[index + 1];
        if (value === undefined || value.startsWith('--')) {
            throw new Error(`Missing value for ${argument}`);
        }
        options[argument.slice(2)] = value;
        index += 1;
    }

    const issueNumber = Number(options.issue);
    if (!Number.isInteger(issueNumber) || issueNumber < 1) {
        throw new Error('--issue must be a positive integer');
    }
    for (const option of ['base', 'title', 'body-file']) {
        if (!options[option]) {
            throw new Error(`--${option} is required`);
        }
    }

    return {
        issueNumber,
        title: options.title,
        bodyFile: options['body-file'],
        base: options.base,
        head: options.head
    };
}

export function resolveBaseBranch(requestedBase) {
    if (!requestedBase) {
        throw new Error('Pass --base explicitly after checking the issue release plan and target branch');
    }
    return requestedBase;
}

export function pullRequestLabels(issueLabels) {
    return [...issueLabels];
}

export function validatePullRequestInput(issueNumber, title, body) {
    if (!title.startsWith(`#${issueNumber}: `)) {
        throw new Error(`PR title must start with "#${issueNumber}: "`);
    }
    if (new RegExp(`#${issueNumber}\\b`).test(body)) {
        throw new Error(`Keep #${issueNumber} out of the PR description; link it through Development`);
    }
}

function run(command, args, input) {
    return execFileSync(command, args, {
        encoding: 'utf8',
        input,
        stdio: ['pipe', 'pipe', 'inherit']
    }).trim();
}

function runGh(args, input) {
    return run('gh', args, input);
}

function runGit(args) {
    return run('git', args);
}

function parseJson(value, description) {
    try {
        return JSON.parse(value);
    } catch {
        throw new Error(`Could not parse ${description} returned by GitHub CLI`);
    }
}

function assertPushedCleanBranch(branch) {
    if (runGit(['status', '--porcelain'])) {
        throw new Error('Commit or discard checkout changes before managing the pull request');
    }
    const localSha = runGit(['rev-parse', 'HEAD']);
    const remoteRef = runGit(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`]);
    const remoteSha = remoteRef.split('\t')[0];
    if (!remoteSha) {
        throw new Error(`Remote branch origin/${branch} does not exist; push it before managing the PR`);
    }
    if (localSha !== remoteSha) {
        throw new Error(`Local HEAD is not the tip of origin/${branch}; push or update the checkout first`);
    }
}

function assertProjectRoot() {
    const root = runGit(['rev-parse', '--show-toplevel']);
    if (path.resolve(root) !== path.resolve(process.cwd())) {
        throw new Error('Run this helper from the MSR Firebase project directory');
    }
}

function assertRemoteBranchExists(repository, branch) {
    const branches = runGh(['api', 'repos/' + repository + '/branches', '--paginate', '--jq', '.[].name'])
        .split(String.fromCharCode(10)).filter(Boolean);
    if (!branches.includes(branch)) {
        throw new Error('Target branch ' + branch + ' does not exist in ' + repository);
    }
}

function graphql(query, variables) {
    const args = ['api', 'graphql', '-f', `query=${query}`];
    for (const [key, value] of Object.entries(variables)) {
        args.push('-F', `${key}=${value}`);
    }
    const result = parseJson(runGh(args), 'GraphQL response');
    if (result.errors?.length) {
        throw new Error(`GitHub GraphQL request failed: ${result.errors.map(error => error.message).join('; ')}`);
    }
    return result.data;
}

function linkIssueInDevelopment(owner, repository, issueNumber, pullRequestNumber) {
    const ids = graphql(
        'query($owner:String!,$name:String!,$issue:Int!,$pr:Int!){repository(owner:$owner,name:$name){issue(number:$issue){id} pullRequest(number:$pr){id}}}',
        {owner, name: repository, issue: issueNumber, pr: pullRequestNumber}
    ).repository;
    if (!ids?.issue?.id || !ids?.pullRequest?.id) {
        throw new Error('Could not resolve GitHub node IDs for the issue and pull request');
    }

    const variables = {owner, name: repository, issue: issueNumber};
    const references = () => graphql(
        'query($owner:String!,$name:String!,$issue:Int!){repository(owner:$owner,name:$name){issue(number:$issue){closedByPullRequestsReferences(first:100){nodes{id number url}}}}}',
        variables
    ).repository.issue.closedByPullRequestsReferences.nodes;

    if (!references().some(reference => reference.id === ids.pullRequest.id)) {
        const mutation = 'mutation($issueId:ID!,$pullRequestId:ID!){addCloseIssueReferences(input:{issueId:$issueId,pullRequestIds:[$pullRequestId]}){issue{id}}}';
        graphql(mutation, {issueId: ids.issue.id, pullRequestId: ids.pullRequest.id});
    }
    if (!references().some(reference => reference.id === ids.pullRequest.id)) {
        throw new Error(`GitHub did not link PR #${pullRequestNumber} to issue #${issueNumber}`);
    }
}

function synchronizePullRequest(prNumber, input, base, milestoneTitle, assignees, labels) {
    const args = ['pr', 'edit', String(prNumber), '--title', input.title, '--body-file', input.bodyFile, '--base', base];
    if (milestoneTitle) {
        args.push('--milestone', milestoneTitle);
    } else {
        args.push('--remove-milestone');
    }
    runGh(args);

    const current = parseJson(runGh(['pr', 'view', String(prNumber), '--json', 'labels,assignees']), 'PR metadata');
    const currentLabels = current.labels.map(label => label.name);
    const currentAssignees = current.assignees.map(assignee => assignee.login);
    for (const label of currentLabels.filter(name => !labels.includes(name))) {
        runGh(['pr', 'edit', String(prNumber), '--remove-label', label]);
    }
    for (const label of labels.filter(name => !currentLabels.includes(name))) {
        runGh(['pr', 'edit', String(prNumber), '--add-label', label]);
    }
    for (const assignee of currentAssignees.filter(login => !assignees.includes(login))) {
        runGh(['pr', 'edit', String(prNumber), '--remove-assignee', assignee]);
    }
    for (const assignee of assignees.filter(login => !currentAssignees.includes(login))) {
        runGh(['pr', 'edit', String(prNumber), '--add-assignee', assignee]);
    }
}

function main(args) {
    const input = parseArgs(args);
    if (input.help) {
        process.stdout.write(HELP);
        return;
    }

    assertProjectRoot();
    const repository = parseJson(runGh(['repo', 'view', '--json', 'nameWithOwner']), 'repository metadata').nameWithOwner;
    if (repository !== 'migration-script-runner/msr-firebase') {
        throw new Error('Expected migration-script-runner/msr-firebase, received ' + repository);
    }
    const body = readFileSync(input.bodyFile, 'utf8');
    validatePullRequestInput(input.issueNumber, input.title, body);
    const issue = parseJson(runGh(['issue', 'view', String(input.issueNumber), '--json', 'milestone,assignees,labels']), 'issue metadata');
    const milestoneTitle = issue.milestone?.title;
    const base = resolveBaseBranch(input.base);
    const head = input.head || runGit(['branch', '--show-current']);
    if (!head) {
        throw new Error('Pass --head or run this command from a task branch');
    }
    if (head === base) {
        throw new Error('The PR head and base branches must be different');
    }
    assertPushedCleanBranch(head);

    assertRemoteBranchExists(repository, base);
    const [owner, repositoryName] = repository.split('/');
    const assignees = issue.assignees.map(assignee => assignee.login);
    const labels = pullRequestLabels(issue.labels.map(label => label.name));
    const candidates = parseJson(runGh(['pr', 'list', '--head', head, '--state', 'all', '--json', 'number,state,baseRefName']), 'pull request list');
    const openCandidates = candidates.filter(candidate => candidate.state === 'OPEN');
    if (openCandidates.length > 1) {
        throw new Error(`Branch ${head} has multiple open PRs; select one manually before continuing`);
    }
    const active = openCandidates[0];
    if (!active && candidates.length) {
        throw new Error(`Branch ${head} already has a closed PR (#${candidates[0].number}); refusing to create a duplicate`);
    }

    let pullRequestNumber;
    let operation;
    if (active) {
        pullRequestNumber = active.number;
        operation = 'Updated';
        synchronizePullRequest(pullRequestNumber, input, base, milestoneTitle, assignees, labels);
    } else {
        const createArgs = ['pr', 'create', '--head', head, '--base', base, '--title', input.title, '--body-file', input.bodyFile];
        if (milestoneTitle) {
            createArgs.push('--milestone', milestoneTitle);
        }
        for (const assignee of assignees) createArgs.push('--assignee', assignee);
        for (const label of labels) createArgs.push('--label', label);
        const url = runGh(createArgs);
        const match = /\/pull\/(\d+)/.exec(url);
        if (!match) {
            throw new Error(`Could not read PR number from GitHub CLI output: ${url}`);
        }
        pullRequestNumber = Number(match[1]);
        operation = 'Created';
    }

    linkIssueInDevelopment(owner, repositoryName, input.issueNumber, pullRequestNumber);
    const pr = parseJson(
        runGh(['pr', 'view', String(pullRequestNumber), '--json', 'url,title,baseRefName,headRefName,milestone,assignees,labels']),
        'updated PR metadata'
    );
    if (pr.title !== input.title || pr.baseRefName !== base || pr.headRefName !== head) {
        throw new Error(`PR #${pullRequestNumber} metadata did not match the requested title, base, and head`);
    }
    const actualLabels = pr.labels.map(label => label.name).sort();
    const expectedLabels = [...labels].sort();
    const actualAssignees = pr.assignees.map(assignee => assignee.login).sort();
    const expectedAssignees = [...assignees].sort();
    if (JSON.stringify(actualLabels) !== JSON.stringify(expectedLabels)
        || JSON.stringify(actualAssignees) !== JSON.stringify(expectedAssignees)
        || (pr.milestone?.title ?? null) !== (milestoneTitle ?? null)) {
        throw new Error(`PR #${pullRequestNumber} labels, assignees, or milestone did not match the issue`);
    }
    process.stdout.write(`${operation} ${pr.url}\nLinked issue #${input.issueNumber} in Development.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
    }
}
