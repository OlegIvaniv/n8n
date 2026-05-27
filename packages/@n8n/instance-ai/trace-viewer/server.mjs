import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const viewerDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(viewerDir, 'public');
const packageDir = path.resolve(viewerDir, '..');
const projectRoot = path.resolve(packageDir, '../../..');
const dataDir = path.join(packageDir, '.data');
const evalResultsPath = path.join(packageDir, 'eval-results.json');
const databasePath = path.join(projectRoot, '.n8n-instance-ai', '.n8n', 'database.sqlite');
const port = Number(process.env.TRACE_VIEWER_PORT ?? 4173);

function json(res, statusCode, payload) {
	res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
	res.end(JSON.stringify(payload));
}

function text(res, statusCode, payload, contentType = 'text/plain; charset=utf-8') {
	res.writeHead(statusCode, { 'Content-Type': contentType });
	res.end(payload);
}

function safeJsonParse(value, fallback = value) {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function decodeHtml(value = '') {
	return String(value)
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'")
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&mdash;', ' - ')
		.replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

function stripTags(value = '') {
	return decodeHtml(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function readJson(filePath) {
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runSql(sql) {
	if (!fs.existsSync(databasePath)) return [];
	const output = execFileSync('sqlite3', ['-json', databasePath, sql], {
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
	});
	return output.trim() ? JSON.parse(output) : [];
}

function summarizeEvalResults() {
	const raw = readJson(evalResultsPath);
	if (!raw) return { summary: null, testCases: [] };
	const timestamp = raw.timestamp ?? null;
	const timestampSlug = timestamp ? timestamp.replaceAll(':', '-').replace(/\.\d+Z$/, '') : null;
	const reports = listReports();
	const matchedReport =
		reports.find((report) => timestampSlug && report.name.includes(timestampSlug)) ??
		reports.find((report) => report.name === 'workflow-eval-report.html') ??
		null;

	return {
		summary: raw.summary ?? null,
		timestamp,
		duration: raw.duration ?? null,
		totalRuns: raw.totalRuns ?? null,
		comparisonStatus: raw.comparisonStatus ?? null,
		sourceReport: matchedReport,
		testCases: (raw.testCases ?? []).map((testCase, testCaseIndex) => ({
			testCaseIndex,
			name: testCase.name,
			buildSuccessCount: testCase.buildSuccessCount,
			totalRuns: testCase.totalRuns,
			scenarios: (testCase.scenarios ?? []).map((scenario, scenarioIndex) => ({
				scenarioIndex,
				name: scenario.name,
				passCount: scenario.passCount,
				totalRuns: scenario.totalRuns,
				runs: (scenario.runs ?? []).map((run, runIndex) => ({
					runIndex,
					passed: Boolean(run.passed),
					score: run.score ?? 0,
					reasoning: run.reasoning ?? '',
					failureCategory: run.failureCategory ?? null,
					execErrors: run.execErrors ?? [],
					executionId: run.evalResult?.executionId ?? null,
					success: run.evalResult?.success ?? null,
					nodeCount: Object.keys(run.evalResult?.nodeResults ?? {}).length,
				})),
			})),
		})),
	};
}

function evalRunDetail(testCaseIndex, scenarioIndex, runIndex) {
	const raw = readJson(evalResultsPath);
	const testCase = raw?.testCases?.[testCaseIndex];
	const scenario = testCase?.scenarios?.[scenarioIndex];
	const run = scenario?.runs?.[runIndex];
	if (!run) return null;

	return {
		testCaseName: testCase.name,
		scenarioName: scenario.name,
		runIndex,
		passed: Boolean(run.passed),
		score: run.score ?? 0,
		reasoning: run.reasoning ?? '',
		failureCategory: run.failureCategory ?? null,
		rootCause: run.rootCause ?? null,
		execErrors: run.execErrors ?? [],
		evalResult: run.evalResult ?? null,
	};
}

function listReports() {
	if (!fs.existsSync(dataDir)) return [];
	return fs
		.readdirSync(dataDir)
		.filter((name) => /^workflow-eval-(report|\d{4}-\d{2}-\d{2}T.+)\.html$/.test(name))
		.map((name) => {
			const filePath = path.join(dataDir, name);
			const stat = fs.statSync(filePath);
			return {
				name,
				size: stat.size,
				mtimeMs: stat.mtimeMs,
			};
		})
		.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function reportPath(reportName) {
	if (!/^workflow-eval-(report|\d{4}-\d{2}-\d{2}T.+)\.html$/.test(reportName ?? '')) return null;
	const filePath = path.join(dataDir, reportName);
	return fs.existsSync(filePath) ? filePath : null;
}

function parseReport(reportName) {
	const filePath = reportPath(reportName);
	if (!filePath) return null;

	const html = fs.readFileSync(filePath, 'utf8');
	const subtitle = stripTags(html.match(/<p class="subtitle">([\s\S]*?)<\/p>/)?.[1] ?? '');
	const testCaseMatches = [...html.matchAll(/<div class="test-case(?: [^"]*)?">/g)];

	const testCases = testCaseMatches.map((match, testCaseIndex) => {
		const start = match.index ?? 0;
		const end = testCaseMatches[testCaseIndex + 1]?.index ?? html.length;
		const block = html.slice(start, end);
		const prompt =
			stripTags(block.match(/<span class="test-case-prompt">([\s\S]*?)<\/span>/)?.[1] ?? '') ||
			`Test case ${testCaseIndex + 1}`;
		const workflowId = stripTags(block.match(/<span class="workflow-id">([\s\S]*?)<\/span>/)?.[1] ?? '');
		const scenarioMatches = [...block.matchAll(/<div class="scenario ([^"]*)">/g)];

		const scenarios = scenarioMatches.map((scenarioMatch, scenarioIndex) => {
			const scenarioStart = scenarioMatch.index ?? 0;
			const scenarioEnd = scenarioMatches[scenarioIndex + 1]?.index ?? block.length;
			const scenarioBlock = block.slice(scenarioStart, scenarioEnd);
			const classes = scenarioMatch[1] ?? '';
			const detailId =
				scenarioBlock.match(/<div class="scenario-detail" id="([^"]+)">/)?.[1] ??
				`scenario-${scenarioIndex}`;
			const name =
				stripTags(scenarioBlock.match(/<span class="scenario-name">([\s\S]*?)<\/span>/)?.[1] ?? '') ||
				`scenario-${scenarioIndex}`;
			const description = stripTags(
				scenarioBlock.match(/<span class="scenario-desc">([\s\S]*?)<\/span>/)?.[1] ?? '',
			);
			const failureCategory = stripTags(
				scenarioBlock.match(/<div class="category-badge[^"]*">([\s\S]*?)<\/div>/)?.[1] ?? '',
			);
			const diagnosis = stripTags(
				scenarioBlock.match(/<div class="diagnosis">([\s\S]*?)<\/div>/)?.[1] ?? '',
			);
			const nodeCount = (scenarioBlock.match(/class="trace-node"/g) ?? []).length;
			const passed = /\bpass\b/.test(classes) && !/\bfail\b/.test(classes);

			return {
				scenarioIndex,
				name,
				description,
				detailId,
				passed,
				failureCategory: failureCategory || null,
				diagnosis: diagnosis || '',
				nodeCount,
			};
		});

		return {
			testCaseIndex,
			name: prompt,
			workflowId,
			scenarios,
		};
	});

	return {
		name: reportName,
		subtitle,
		testCases,
	};
}

function reportScenarioDetail(reportName, testCaseIndex, scenarioIndex) {
	const report = parseReport(reportName);
	const testCase = report?.testCases?.[testCaseIndex];
	const scenario = testCase?.scenarios?.[scenarioIndex];
	if (!report || !testCase || !scenario) return null;

	return {
		reportName: report.name,
		reportSubtitle: report.subtitle,
		testCaseName: testCase.name,
		workflowId: testCase.workflowId,
		scenario,
		reportHref: `/reports/${encodeURIComponent(report.name)}#${encodeURIComponent(scenario.detailId)}`,
	};
}

function listThreads() {
	const rows = runSql(`
		SELECT id, resourceId, createdAt, updatedAt
		FROM instance_ai_threads
		ORDER BY updatedAt DESC
		LIMIT 200;
	`);
	return rows.map((row) => ({
		...row,
		kind: String(row.resourceId ?? '').includes(':workflow-builder') ? 'builder' : 'orchestrator',
	}));
}

function threadDetail(threadId) {
	const escaped = threadId.replaceAll("'", "''");
	const [thread] = runSql(`
		SELECT id, resourceId, createdAt, updatedAt
		FROM instance_ai_threads
		WHERE id = '${escaped}'
		LIMIT 1;
	`);
	if (!thread) return null;

	const messages = runSql(`
		SELECT id, role, type, resourceId, createdAt, updatedAt, content
		FROM instance_ai_messages
		WHERE threadId = '${escaped}'
		ORDER BY createdAt ASC;
	`).map((row) => ({
		...row,
		contentParsed: safeJsonParse(row.content, null),
	}));

	const iterationLogs = runSql(`
		SELECT id, taskKey, createdAt, updatedAt, entry
		FROM instance_ai_iteration_logs
		WHERE threadId = '${escaped}'
		ORDER BY createdAt ASC;
	`).map((row) => ({
		...row,
		entryParsed: safeJsonParse(row.entry, null),
	}));

	const runSnapshots = runSql(`
		SELECT threadId, runId, messageGroupId, runIds, tree, createdAt, updatedAt, langsmithRunId, langsmithTraceId
		FROM instance_ai_run_snapshots
		WHERE threadId = '${escaped}'
		ORDER BY createdAt ASC;
	`).map((row) => ({
		...row,
		runIdsParsed: safeJsonParse(row.runIds, []),
		treeParsed: safeJsonParse(row.tree, null),
	}));

	return {
		thread,
		messages,
		iterationLogs,
		runSnapshots,
	};
}

function serveStatic(req, res) {
	const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
	const assetPath = url.pathname === '/' ? '/index.html' : url.pathname;
	const normalized = path.normalize(assetPath).replace(/^(\.\.[/\\])+/, '');
	const filePath = path.join(publicDir, normalized);

	if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
		text(res, 404, 'Not found');
		return;
	}

	const ext = path.extname(filePath);
	const contentType =
		ext === '.html'
			? 'text/html; charset=utf-8'
			: ext === '.css'
				? 'text/css; charset=utf-8'
				: ext === '.js'
					? 'text/javascript; charset=utf-8'
					: 'application/octet-stream';
	text(res, 200, fs.readFileSync(filePath), contentType);
}

const server = http.createServer((req, res) => {
	const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

	if (url.pathname === '/api/health') {
		json(res, 200, {
			ok: true,
			evalResultsPath,
			databasePath,
			dataDir,
		});
		return;
	}

	if (url.pathname === '/api/evals') {
		json(res, 200, summarizeEvalResults());
		return;
	}

	if (url.pathname === '/api/eval-run') {
		const testCaseIndex = Number(url.searchParams.get('testCaseIndex') ?? -1);
		const scenarioIndex = Number(url.searchParams.get('scenarioIndex') ?? -1);
		const runIndex = Number(url.searchParams.get('runIndex') ?? -1);
		const detail = evalRunDetail(testCaseIndex, scenarioIndex, runIndex);
		if (!detail) {
			json(res, 404, { error: 'Eval run not found' });
			return;
		}
		json(res, 200, detail);
		return;
	}

	if (url.pathname === '/api/reports') {
		json(res, 200, { reports: listReports() });
		return;
	}

	if (url.pathname === '/api/report-evals') {
		const reportName = url.searchParams.get('name');
		const report = reportName ? parseReport(reportName) : null;
		if (!report) {
			json(res, 404, { error: 'Report not found' });
			return;
		}
		json(res, 200, report);
		return;
	}

	if (url.pathname === '/api/report-scenario') {
		const reportName = url.searchParams.get('name');
		const testCaseIndex = Number(url.searchParams.get('testCaseIndex') ?? -1);
		const scenarioIndex = Number(url.searchParams.get('scenarioIndex') ?? -1);
		const detail = reportName ? reportScenarioDetail(reportName, testCaseIndex, scenarioIndex) : null;
		if (!detail) {
			json(res, 404, { error: 'Report scenario not found' });
			return;
		}
		json(res, 200, detail);
		return;
	}

	if (url.pathname === '/api/threads') {
		json(res, 200, { threads: listThreads() });
		return;
	}

	if (url.pathname === '/api/thread') {
		const threadId = url.searchParams.get('id');
		if (!threadId) {
			json(res, 400, { error: 'Missing thread id' });
			return;
		}
		const detail = threadDetail(threadId);
		if (!detail) {
			json(res, 404, { error: 'Thread not found' });
			return;
		}
		json(res, 200, detail);
		return;
	}

	if (url.pathname.startsWith('/reports/')) {
		const reportName = path.basename(decodeURIComponent(url.pathname.slice('/reports/'.length)));
		const reportPath = path.join(dataDir, reportName);
		if (!/^workflow-eval-(report|\d{4}-\d{2}-\d{2}T.+)\.html$/.test(reportName)) {
			text(res, 400, 'Invalid report name');
			return;
		}
		if (!fs.existsSync(reportPath)) {
			text(res, 404, 'Report not found');
			return;
		}
		text(res, 200, fs.readFileSync(reportPath), 'text/html; charset=utf-8');
		return;
	}

	serveStatic(req, res);
});

server.listen(port, '127.0.0.1', () => {
	console.log(`Instance AI trace viewer: http://127.0.0.1:${port}`);
});
