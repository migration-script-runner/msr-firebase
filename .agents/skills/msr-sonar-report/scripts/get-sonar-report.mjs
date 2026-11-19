import {promises as fs} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const DEFAULT_SONAR_PROJECT_KEY = 'migration-script-runner_msr-firebase';
export const DEFAULT_SONAR_ORGANIZATION = 'vlavrynovych';
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Builds a SonarCloud API URL for one page of the complete new-code issue report.
 * @param {string} projectKey SonarCloud project key.
 * @param {string} organization SonarCloud organization key.
 * @param {number} pullRequestNumber Pull request number.
 * @param {number} page One-based page number.
 * @param {number} pageSize Number of findings per page.
 * @returns {URL} SonarCloud issue-search URL.
 */
export function buildSonarIssueSearchUrl(projectKey, organization, pullRequestNumber, page, pageSize) {
    const url = new URL('https://sonarcloud.io/api/issues/search');
    url.searchParams.set('pullRequest', String(pullRequestNumber));
    url.searchParams.set('componentKeys', projectKey);
    url.searchParams.set('organization', organization);
    url.searchParams.set('ps', String(pageSize));
    url.searchParams.set('p', String(page));
    url.searchParams.set('facets', 'impactSoftwareQualities,impactSeverities');
    url.searchParams.set('s', 'IMPACT_RANK');
    url.searchParams.set('sinceLeakPeriod', 'true');
    url.searchParams.set('issueStatuses', 'OPEN,CONFIRMED');
    url.searchParams.set('additionalFields', '_all');
    return url;
}

/**
 * Retrieves and verifies every page of SonarCloud's open, confirmed new-code findings.
 * @param {object} options Query options.
 * @param {string} options.projectKey SonarCloud project key.
 * @param {string} options.organization SonarCloud organization key.
 * @param {number} options.pullRequestNumber Pull request number.
 * @param {typeof fetch} [options.fetchImpl] Fetch implementation, injectable for tests.
 * @param {number} [options.pageSize] Number of findings per page.
 * @returns {Promise<Record<string, unknown>>} Standardized report with all raw findings.
 */
export async function fetchSonarReport({projectKey, organization, pullRequestNumber, fetchImpl = fetch, pageSize = DEFAULT_PAGE_SIZE}) {
    if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
        throw new RangeError('Pull request number must be a positive integer');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new RangeError('Page size must be a positive integer');
    }

    const findings = [];
    const findingKeys = new Set();
    let expectedTotal;
    let page = 1;

    while (expectedTotal === undefined || findings.length < expectedTotal) {
        const url = buildSonarIssueSearchUrl(projectKey, organization, pullRequestNumber, page, pageSize);
        const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
        if (!response.ok) {
            throw new Error(`SonarCloud issue search failed with HTTP ${response.status}`);
        }

        const data = await response.json();
        const total = isRecord(data) ? data.paging?.total ?? data.total : undefined;
        if (!isRecord(data) || !Array.isArray(data.issues) || !Number.isInteger(total) || total < 0) {
            throw new Error('SonarCloud issue search returned an invalid response');
        }

        if (expectedTotal === undefined) {
            expectedTotal = total;
        } else if (expectedTotal !== total) {
            throw new Error('SonarCloud issue count changed while pages were being retrieved');
        }

        for (const finding of data.issues) {
            if (!isRecord(finding) || typeof finding.key !== 'string') {
                throw new Error('SonarCloud issue search returned a malformed finding');
            }
            if (findingKeys.has(finding.key)) {
                throw new Error('SonarCloud issue search returned a duplicate finding across pages');
            }
            findingKeys.add(finding.key);
            findings.push(finding);
        }

        if (data.issues.length === 0 && findings.length < expectedTotal) {
            throw new Error('SonarCloud issue search returned fewer findings than its paging total');
        }

        page += 1;
    }

    if (findings.length !== expectedTotal) {
        throw new Error(`Retrieved ${findings.length} SonarCloud findings, expected ${expectedTotal}`);
    }

    return {
        projectKey,
        organization,
        pullRequestNumber,
        query: {
            issueStatuses: ['OPEN', 'CONFIRMED'],
            sinceLeakPeriod: true,
            sort: 'IMPACT_RANK',
            facets: ['impactSoftwareQualities', 'impactSeverities'],
            additionalFields: '_all'
        },
        pageSize,
        total: expectedTotal,
        findings
    };
}

/**
 * Parses command-line arguments for the report command.
 * @param {string[]} args Command-line arguments.
 * @param {NodeJS.ProcessEnv} [environment] Environment values for defaults.
 * @returns {{pullRequestNumber: number, projectKey: string, organization: string, pageSize: number, format: string, outputPath?: string}} Parsed options.
 */
export function parseArguments(args, environment = process.env) {
    const options = {
        pullRequestNumber: undefined,
        projectKey: environment.SONAR_PROJECT_KEY ?? DEFAULT_SONAR_PROJECT_KEY,
        organization: environment.SONAR_ORGANIZATION ?? DEFAULT_SONAR_ORGANIZATION,
        pageSize: DEFAULT_PAGE_SIZE,
        format: 'markdown',
        outputPath: undefined
    };

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        const value = args[index + 1];
        if (!value || value.startsWith('--')) {
            throw new TypeError(`Expected a value after ${argument}`);
        }

        if (argument === '--pr' || argument === '--pull-request') {
            options.pullRequestNumber = Number(value);
        } else if (argument === '--project') {
            options.projectKey = value;
        } else if (argument === '--organization') {
            options.organization = value;
        } else if (argument === '--page-size') {
            options.pageSize = Number(value);
        } else if (argument === '--format') {
            options.format = value;
        } else if (argument === '--output') {
            options.outputPath = value;
        } else {
            throw new TypeError(`Unknown argument: ${argument}`);
        }
        index += 1;
    }

    if (!Number.isInteger(options.pullRequestNumber) || options.pullRequestNumber < 1) {
        throw new RangeError('Provide a positive pull request number with --pr');
    }
    if (typeof options.projectKey !== 'string' || !options.projectKey.trim()) {
        throw new TypeError('Provide the Firebase SonarCloud project key with --project or SONAR_PROJECT_KEY');
    }
    if (typeof options.organization !== 'string' || !options.organization.trim()) {
        throw new TypeError('Provide the SonarCloud organization key with --organization or SONAR_ORGANIZATION');
    }
    if (!Number.isInteger(options.pageSize) || options.pageSize < 1) {
        throw new RangeError('--page-size must be a positive integer');
    }
    if (!['json', 'markdown'].includes(options.format)) {
        throw new TypeError('--format must be json or markdown');
    }

    return options;
}

/**
 * Formats a complete SonarCloud report for human review.
 * @param {Record<string, unknown>} report Standardized SonarCloud report.
 * @returns {string} Markdown report.
 */
export function formatSonarReportMarkdown(report) {
    const findings = Array.isArray(report.findings) ? report.findings : [];
    const lines = [
        `# SonarCloud findings for PR #${report.pullRequestNumber}`,
        '',
        `- **Project:** \`${escapeMarkdown(report.projectKey)}\``,
        `- **Organization:** \`${escapeMarkdown(report.organization)}\``,
        `- **Open and confirmed new-code findings:** ${report.total}`,
        `- **Page size:** ${report.pageSize}`,
        ''
    ];

    if (findings.length === 0) {
        lines.push('No open or confirmed findings were returned for the new-code period.');
        return lines.join('\n');
    }

    for (const finding of findings) {
        const location = typeof finding.component === 'string' ? finding.component : 'location unavailable';
        const lineNumber = Number.isInteger(finding.line) ? `:${finding.line}` : '';
        const impacts = Array.isArray(finding.impacts) ? JSON.stringify(finding.impacts) : 'not provided';
        lines.push(
            `## ${escapeMarkdown(finding.key)} — ${escapeMarkdown(finding.severity ?? 'severity unavailable')}`,
            '',
            `- **Rule:** \`${escapeMarkdown(finding.rule ?? 'rule unavailable')}\``,
            `- **Location:** \`${escapeMarkdown(`${location}${lineNumber}`)}\``,
            `- **Impacts:** ${escapeMarkdown(impacts)}`,
            `- **Message:** ${escapeMarkdown(finding.message ?? 'message unavailable')}`,
            ''
        );
    }

    return lines.join('\n');
}

function escapeMarkdown(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('`', '\\`').replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');
}

function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function run() {
    const options = parseArguments(process.argv.slice(2));
    const report = await fetchSonarReport(options);
    const output = options.format === 'json' ? JSON.stringify(report, null, 2) : formatSonarReportMarkdown(report);

    if (options.outputPath) {
        await fs.writeFile(path.resolve(options.outputPath), `${output}\n`);
        console.log(`Saved ${report.total} findings to ${path.resolve(options.outputPath)}`);
    } else {
        console.log(output);
    }

    if (process.env.GITHUB_OUTPUT) {
        await fs.appendFile(process.env.GITHUB_OUTPUT, `has_findings=${String(report.total > 0)}\nfinding_count=${report.total}\n`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    run().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
