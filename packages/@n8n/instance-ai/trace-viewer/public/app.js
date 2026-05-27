const evalList = document.querySelector('#evalList');
const reportList = document.querySelector('#reportList');
const threadList = document.querySelector('#threadList');
const evalSummary = document.querySelector('#evalSummary');
const detailTitle = document.querySelector('#detailTitle');
const detailMeta = document.querySelector('#detailMeta');
const detailSummary = document.querySelector('#detailSummary');
const evalSource = document.querySelector('#evalSource');
const timeline = document.querySelector('#timeline');
const refreshButton = document.querySelector('#refreshButton');
const fileModeBanner = document.querySelector('#fileModeBanner');
const connectionStatus = document.querySelector('#connectionStatus');
const statusDot = document.querySelector('.status-dot');

const state = {
	activeButton: null,
};

function escapeHtml(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function pretty(value) {
	return escapeHtml(JSON.stringify(value ?? null, null, 2));
}

function pill(text, tone = '') {
	return `<span class="pill ${tone}">${escapeHtml(text)}</span>`;
}

function summaryCard(label, value) {
	return `<article class="summary-card"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function setActive(button) {
	state.activeButton?.classList.remove('active');
	state.activeButton = button;
	button?.classList.add('active');
}

async function requestJson(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return await response.json();
}

function setConnectionStatus(text, failed = false) {
	connectionStatus.textContent = text;
	statusDot.style.background = failed ? '#dc2626' : '#16a34a';
	statusDot.style.boxShadow = failed
		? '0 0 0 4px rgba(220, 38, 38, 0.12)'
		: '0 0 0 4px rgba(22, 163, 74, 0.12)';
}

function renderEvalIndex(data) {
	const cases = data.testCases ?? [];
	const totalScenarios = cases.reduce((sum, testCase) => sum + testCase.scenarios.length, 0);
	const sourceName = data.sourceReport?.name ?? 'latest eval-results.json';
	evalSummary.textContent = `${totalScenarios} scenario(s) · ${sourceName}`;
	evalSource.innerHTML = data.sourceReport
		? `Showing traces from <a href="/reports/${encodeURIComponent(data.sourceReport.name)}" target="_blank" rel="noreferrer">${escapeHtml(data.sourceReport.name)}</a>.`
		: 'Showing traces from the latest eval-results.json.';

	evalList.innerHTML = cases
		.map(
			(testCase) => `
				<section class="eval-group">
					<div class="eval-group-heading">
						<span class="item-title">${escapeHtml(testCase.name)}</span>
						<span class="muted">${escapeHtml(`${testCase.scenarios.length} scenario(s)`)}</span>
					</div>
					<div class="eval-group-runs">
						${testCase.scenarios
							.flatMap((scenario) =>
								scenario.runs.map(
									(run) => `
										<button
											class="list-button eval-run-button"
											type="button"
											data-kind="eval"
											data-test-case-index="${testCase.testCaseIndex}"
											data-scenario-index="${scenario.scenarioIndex}"
											data-run-index="${run.runIndex}"
										>
											<span class="item-title">${escapeHtml(scenario.name)}</span>
											<span class="item-row">
												${pill(run.passed ? 'passed' : 'failed', run.passed ? 'success' : 'fail')}
												${run.failureCategory ? pill(run.failureCategory, 'warn') : ''}
												${pill(`${run.nodeCount} node(s)`)}
											</span>
										</button>
									`,
								),
							)
							.join('')}
					</div>
				</section>
			`,
		)
		.join('');
}

function renderReports(data) {
	reportList.innerHTML = (data.reports ?? [])
		.map(
			(report) => `
				<div class="report-row">
					<button class="list-button report-select" type="button" data-kind="report" data-report-name="${escapeHtml(report.name)}">
						<span class="item-title">${escapeHtml(report.name)}</span>
						<span class="muted">${new Date(report.mtimeMs).toLocaleString()} · ${Math.round(report.size / 1024)} KB</span>
					</button>
					<a class="report-open-link" href="/reports/${encodeURIComponent(report.name)}" target="_blank" rel="noreferrer">Open</a>
				</div>
			`,
		)
		.join('');
}

function renderThreads(data) {
	threadList.innerHTML = (data.threads ?? [])
		.map(
			(thread) => `
				<button class="list-button" type="button" data-kind="thread" data-thread-id="${escapeHtml(thread.id)}">
					<span class="item-title">${escapeHtml(thread.id)}</span>
					<span class="item-row">
						${pill(thread.kind, thread.kind === 'builder' ? 'warn' : '')}
						${pill(new Date(thread.updatedAt.replace(' ', 'T') + 'Z').toLocaleString())}
					</span>
				</button>
			`,
		)
		.join('');
}

function renderEvalDetail(detail) {
	detailTitle.textContent = `${detail.testCaseName}`;
	detailMeta.textContent = `${detail.scenarioName} · eval run ${detail.runIndex + 1}`;
	detailSummary.innerHTML = [
		summaryCard('Status', detail.passed ? 'Passed' : 'Failed'),
		summaryCard('Failure', detail.failureCategory ?? 'none'),
		summaryCard('Exec errors', String(detail.execErrors.length)),
		summaryCard('Nodes', String(Object.keys(detail.evalResult?.nodeResults ?? {}).length)),
	].join('');

	const summaryNotice = detail.reasoning
		? `<div class="notice ${detail.passed ? 'success' : 'fail'}">${escapeHtml(detail.reasoning)}</div>`
		: '';

	const errors = detail.evalResult?.errors ?? [];
	const errorNotice = errors.length
		? `<div class="notice fail">${escapeHtml(errors.join('; '))}</div>`
		: '';

	const nodeEvents = Object.entries(detail.evalResult?.nodeResults ?? {}).map(
		([nodeName, node]) => {
			const requests = (node.interceptedRequests ?? [])
				.map(
					(request, index) => `
					<details>
						<summary>Request ${index + 1}: ${escapeHtml(request.method)} ${escapeHtml(request.url)}</summary>
						<pre>${pretty(request.requestBody)}</pre>
						<pre>${pretty(request.mockResponse)}</pre>
					</details>
				`,
				)
				.join('');

			return `
			<article class="event">
				<div class="event-header">
					<div class="event-title">
						<span>${escapeHtml(nodeName)}</span>
						${pill(node.executionMode ?? 'unknown')}
						${pill(`${node.outputCount ?? 0} output(s)`)}
					</div>
					<span class="event-meta">${node.startTime ? new Date(node.startTime).toLocaleTimeString() : ''}</span>
				</div>
				<div class="event-grid">
					${requests}
					<details>
						<summary>Node output</summary>
						<pre>${pretty(node.output)}</pre>
					</details>
				</div>
			</article>
		`;
		},
	);

	timeline.classList.remove('empty-state');
	timeline.innerHTML = `
		${summaryNotice}
		${errorNotice}
		<details>
			<summary>Mock hints</summary>
			<pre>${pretty(detail.evalResult?.hints ?? null)}</pre>
		</details>
		${nodeEvents.join('')}
	`;
}

function renderHistoricalReportIndex(report) {
	const totalScenarios = (report.testCases ?? []).reduce(
		(sum, testCase) => sum + testCase.scenarios.length,
		0,
	);
	evalSummary.textContent = `${totalScenarios} scenario(s) · ${report.name}`;
	evalSource.innerHTML = `Showing historical traces from <a href="/reports/${encodeURIComponent(report.name)}" target="_blank" rel="noreferrer">${escapeHtml(report.name)}</a>.`;

	evalList.innerHTML = (report.testCases ?? [])
		.map(
			(testCase) => `
				<section class="eval-group">
					<div class="eval-group-heading">
						<span class="item-title">${escapeHtml(testCase.name)}</span>
						<span class="muted">${escapeHtml(`${testCase.scenarios.length} scenario(s)`)}</span>
					</div>
					<div class="eval-group-runs">
						${testCase.scenarios
							.map(
								(scenario) => `
									<button
										class="list-button eval-run-button"
										type="button"
										data-kind="report-scenario"
										data-report-name="${escapeHtml(report.name)}"
										data-test-case-index="${testCase.testCaseIndex}"
										data-scenario-index="${scenario.scenarioIndex}"
									>
										<span class="item-title">${escapeHtml(scenario.name)}</span>
										<span class="muted">${escapeHtml(scenario.description || 'Historical report scenario')}</span>
										<span class="item-row">
											${pill(scenario.passed ? 'passed' : 'failed', scenario.passed ? 'success' : 'fail')}
											${scenario.failureCategory ? pill(scenario.failureCategory, 'warn') : ''}
											${pill(`${scenario.nodeCount} trace node(s)`)}
										</span>
									</button>
								`,
							)
							.join('')}
					</div>
				</section>
			`,
		)
		.join('');
}

function renderHistoricalScenarioDetail(detail) {
	detailTitle.textContent = detail.testCaseName;
	detailMeta.textContent = `${detail.scenario.name} · ${detail.reportName}`;
	detailSummary.innerHTML = [
		summaryCard('Status', detail.scenario.passed ? 'Passed' : 'Failed'),
		summaryCard('Failure', detail.scenario.failureCategory ?? 'none'),
		summaryCard('Trace nodes', String(detail.scenario.nodeCount)),
		summaryCard('Workflow', detail.workflowId || 'n/a'),
	].join('');

	const diagnosis = detail.scenario.diagnosis
		? `<div class="notice ${detail.scenario.passed ? 'success' : 'fail'}">${escapeHtml(detail.scenario.diagnosis)}</div>`
		: '';

	timeline.classList.remove('empty-state');
	timeline.innerHTML = `
		${diagnosis}
		<div class="report-frame-shell">
			<div class="report-frame-toolbar">
				<span class="muted">${escapeHtml(detail.reportSubtitle || detail.reportName)}</span>
				<a href="${escapeHtml(detail.reportHref)}" target="_blank" rel="noreferrer">Open report</a>
			</div>
			<iframe class="report-frame" src="${escapeHtml(detail.reportHref)}" title="${escapeHtml(detail.scenario.name)} report trace"></iframe>
		</div>
	`;
}

function compactContent(parsed, fallback) {
	if (!parsed || typeof parsed !== 'object') return fallback;
	if (typeof parsed.content === 'string' && parsed.content) return parsed.content;
	if (Array.isArray(parsed.parts)) {
		return parsed.parts
			.map((part) => part?.text ?? part?.toolInvocation?.toolName ?? part?.type ?? '')
			.filter(Boolean)
			.join('\n');
	}
	return fallback;
}

function renderThreadDetail(detail) {
	const { thread, messages, iterationLogs, runSnapshots } = detail;
	detailTitle.textContent = thread.id;
	detailMeta.textContent = thread.resourceId;
	detailSummary.innerHTML = [
		summaryCard(
			'Kind',
			String(thread.resourceId).includes(':workflow-builder') ? 'Builder' : 'Orchestrator',
		),
		summaryCard('Messages', String(messages.length)),
		summaryCard('Iteration logs', String(iterationLogs.length)),
		summaryCard('Run snapshots', String(runSnapshots.length)),
	].join('');

	const messageEvents = messages.map(
		(message) => `
		<article class="event">
			<div class="event-header">
				<div class="event-title">
					<span>${escapeHtml(message.role ?? 'message')}</span>
					${message.type ? pill(message.type) : ''}
				</div>
				<span class="event-meta">${escapeHtml(message.createdAt)}</span>
			</div>
			<div class="notice">${escapeHtml(compactContent(message.contentParsed, message.content ?? ''))}</div>
			<details>
				<summary>Raw message JSON</summary>
				<pre>${pretty(message.contentParsed ?? message.content)}</pre>
			</details>
		</article>
	`,
	);

	const logEvents = iterationLogs.map(
		(entry) => `
		<article class="event">
			<div class="event-header">
				<div class="event-title">
					<span>Iteration log</span>
					${pill(entry.taskKey)}
				</div>
				<span class="event-meta">${escapeHtml(entry.createdAt)}</span>
			</div>
			<details open>
				<summary>Entry</summary>
				<pre>${pretty(entry.entryParsed ?? entry.entry)}</pre>
			</details>
		</article>
	`,
	);

	const snapshotEvents = runSnapshots.map(
		(snapshot) => `
		<article class="event">
			<div class="event-header">
				<div class="event-title">
					<span>Run snapshot</span>
					${pill(snapshot.runId)}
				</div>
				<span class="event-meta">${escapeHtml(snapshot.createdAt)}</span>
			</div>
			<details>
				<summary>Agent tree</summary>
				<pre>${pretty(snapshot.treeParsed ?? snapshot.tree)}</pre>
			</details>
		</article>
	`,
	);

	timeline.classList.remove('empty-state');
	timeline.innerHTML = [...messageEvents, ...logEvents, ...snapshotEvents].join('');
}

async function loadAll() {
	const [evals, reports, threads] = await Promise.all([
		requestJson('/api/evals'),
		requestJson('/api/reports'),
		requestJson('/api/threads'),
	]);
	renderEvalIndex(evals);
	renderReports(reports);
	renderThreads(threads);
	setConnectionStatus('Connected to local trace service');

	const firstEvalButton = evalList.querySelector('button[data-kind="eval"]');
	if (!state.activeButton && firstEvalButton) {
		firstEvalButton.click();
	}
}

document.addEventListener('click', async (event) => {
	const button = event.target.closest('button[data-kind]');
	if (!button) return;

	setActive(button);
	if (button.dataset.kind === 'eval') {
		const query = new URLSearchParams({
			testCaseIndex: button.dataset.testCaseIndex,
			scenarioIndex: button.dataset.scenarioIndex,
			runIndex: button.dataset.runIndex,
		});
		renderEvalDetail(await requestJson(`/api/eval-run?${query.toString()}`));
		return;
	}

	if (button.dataset.kind === 'report') {
		const query = new URLSearchParams({ name: button.dataset.reportName });
		const report = await requestJson(`/api/report-evals?${query.toString()}`);
		renderHistoricalReportIndex(report);
		detailTitle.textContent = report.name;
		detailMeta.textContent = report.subtitle ?? '';
		detailSummary.innerHTML = [
			summaryCard(
				'Scenarios',
				String(report.testCases.reduce((sum, testCase) => sum + testCase.scenarios.length, 0)),
			),
			summaryCard('Test cases', String(report.testCases.length)),
		].join('');
		timeline.className = 'timeline empty-state';
		timeline.textContent = 'Choose a historical scenario to open its report trace.';

		const firstHistoricalScenario = evalList.querySelector('button[data-kind="report-scenario"]');
		if (firstHistoricalScenario) firstHistoricalScenario.click();
		return;
	}

	if (button.dataset.kind === 'report-scenario') {
		const query = new URLSearchParams({
			name: button.dataset.reportName,
			testCaseIndex: button.dataset.testCaseIndex,
			scenarioIndex: button.dataset.scenarioIndex,
		});
		renderHistoricalScenarioDetail(await requestJson(`/api/report-scenario?${query.toString()}`));
		return;
	}

	if (button.dataset.kind === 'thread') {
		const query = new URLSearchParams({ id: button.dataset.threadId });
		renderThreadDetail(await requestJson(`/api/thread?${query.toString()}`));
	}
});

refreshButton.addEventListener('click', async () => {
	setActive(null);
	detailTitle.textContent = 'Select a run or thread';
	detailMeta.textContent = '';
	detailSummary.innerHTML = '';
	evalSource.textContent = '';
	timeline.className = 'timeline empty-state';
	timeline.textContent =
		'Choose an eval run to inspect execution nodes, or choose an agent thread to inspect planner and builder messages.';
	await loadAll();
});

if (window.location.protocol === 'file:') {
	fileModeBanner.hidden = false;
	setConnectionStatus('Static file mode: service unavailable', true);
	timeline.className = 'timeline empty-state';
	timeline.textContent =
		'This page was opened from disk, so it cannot query eval JSON or SQLite traces. Use http://127.0.0.1:4173.';
} else {
	loadAll().catch((error) => {
		setConnectionStatus('Trace service unavailable', true);
		timeline.className = 'timeline empty-state';
		timeline.textContent = `Trace viewer failed to load: ${error.message}`;
	});
}
