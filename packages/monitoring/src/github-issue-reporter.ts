import { Octokit } from '@octokit/rest';
import { createLogger, loadConfig } from '@patentrack/shared';
import type { HealthCheckResult } from './health-checker.js';

const logger = createLogger({ service: 'github-issue-reporter' });

export interface IssueReport {
  title: string;
  body: string;
  labels: string[];
  healthChecks?: HealthCheckResult[];
}

export async function createGitHubIssue(
  report: IssueReport
): Promise<{ issueUrl: string; issueNumber: number }> {
  const config = loadConfig();

  if (!config.githubToken) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const octokit = new Octokit({
    auth: config.githubToken,
  });

  const owner = config.githubOwner;
  const repo = config.githubRepo.split('/')[1] || 'patentrack';

  logger.info('Creating GitHub issue', { title: report.title, owner, repo });

  try {
    const response = await octokit.issues.create({
      owner,
      repo,
      title: report.title,
      body: report.body,
      labels: report.labels,
    });

    logger.info('GitHub issue created', {
      issueNumber: response.data.number,
      issueUrl: response.data.html_url,
    });

    return {
      issueUrl: response.data.html_url,
      issueNumber: response.data.number,
    };
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create GitHub issue', { error: typedError });
    throw error;
  }
}

export function generateHealthIssueReport(
  healthChecks: HealthCheckResult[]
): IssueReport {
  const unhealthyServices = healthChecks.filter(
    (check) => check.status === 'unhealthy'
  );

  if (unhealthyServices.length === 0) {
    throw new Error('No unhealthy services to report');
  }

  const title = `Health Check Alert: ${unhealthyServices.map((s) => s.service).join(', ')} Unhealthy`;

  let body = '## Health Check Failure\n\n';
  body += `**Timestamp:** ${new Date().toISOString()}\n\n`;
  body += '### Unhealthy Services\n\n';

  for (const service of unhealthyServices) {
    body += `- **${service.service}**: ${service.message || 'No message'}\n`;
  }

  body += '\n### All Health Checks\n\n';
  body += '| Service | Status | Message | Latency |\n';
  body += '|---------|--------|---------|--------|\n';

  for (const check of healthChecks) {
    const latency = check.latency ? `${check.latency}ms` : 'N/A';
    body += `| ${check.service} | ${check.status} | ${check.message || 'N/A'} | ${latency} |\n`;
  }

  return {
    title,
    body,
    labels: ['health-check', 'automated', 'incident'],
    healthChecks,
  };
}
