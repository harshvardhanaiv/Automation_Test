document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statTotal = document.getElementById('stat-total');
  const statPassed = document.getElementById('stat-passed');
  const statFailed = document.getElementById('stat-failed');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');

  const browserSelect = document.getElementById('browser-select');
  const headedToggle = document.getElementById('headed-toggle');
  const modeLabelOff = document.getElementById('mode-label-off');
  const modeLabelOn = document.getElementById('mode-label-on');

  function updateModeLabels() {
    if (headedToggle.checked) {
      modeLabelOn.classList.add('active');
      modeLabelOff.classList.remove('active');
    } else {
      modeLabelOff.classList.add('active');
      modeLabelOn.classList.remove('active');
    }
  }

  headedToggle.addEventListener('change', updateModeLabels);
  updateModeLabels();

  const btnRunAll = document.getElementById('btn-run-all');
  const btnRunSelected = document.getElementById('btn-run-selected');
  const btnSaveOrder = document.getElementById('btn-save-order');
  const btnStop = document.getElementById('btn-stop');

  const progressBanner = document.getElementById('progress-banner');
  const activeTestFile = document.getElementById('active-test-file');
  const progressMetricsText = document.getElementById('progress-metrics-text');
  const progressBar = document.getElementById('progress-bar');

  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const btnCollapseAll = document.getElementById('btn-collapse-all');
  const sectionsContainer = document.getElementById('sections-container');
  const orderManagerList = document.getElementById('order-manager-list');

  const consoleTerminal = document.getElementById('console-terminal');
  const btnClearLogs = document.getElementById('btn-clear-logs');

  const reportsTableBody = document.getElementById('reports-table-body');
  const btnRefreshReports = document.getElementById('btn-refresh-reports');

  const reportModal = document.getElementById('report-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const reportIframe = document.getElementById('report-iframe');
  const modalTitle = document.getElementById('modal-title');

  // Application State
  let testFiles = [];
  let executionConfig = { sequence: [] };
  let sseSource = null;

  // ── 1. Tab Switching ────────────────────────────────────────────────────────
  document.querySelectorAll('.tabs-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      
      const targetId = btn.dataset.target;
      const parent = header.parentElement;

      header.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // ── 2. Data Fetching ────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      testFiles = data.tests || [];
      executionConfig = data.config || { sequence: [] };

      statTotal.textContent = testFiles.length;

      renderTree();
      renderOrderManager();
      loadReports();
    } catch (e) {
      console.error('Failed to load tests data:', e);
    }
  }

  // ── Toast Notification Helper ─────────────────────────────────────────────
  function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      document.body.appendChild(toast);
    }
    const icon = type === 'error'
      ? '<i class="fa-solid fa-circle-xmark"></i>'
      : '<i class="fa-solid fa-circle-check"></i>';

    toast.className = `toast-notification ${type} show`;
    toast.innerHTML = `${icon} <span>${message}</span>`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  const collapsedTreeSections = new Set();
  const collapsedOrderSections = new Set();

  // ── 3. Render Tree View ──────────────────────────────────────────────────────
  function renderTree() {
    sectionsContainer.innerHTML = '';

    // Group tests by section
    const grouped = {};
    testFiles.forEach(t => {
      const sec = t.section || 'general';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(t);
    });

    // Sort sections according to executionConfig.sequence if available
    const configSequence = executionConfig.sequence || [];
    const orderedSecNames = [];

    configSequence.forEach(secObj => {
      if (grouped[secObj.name]) {
        orderedSecNames.push(secObj.name);
      }
    });

    // Add any remaining sections not in config sequence
    Object.keys(grouped).forEach(secName => {
      if (!orderedSecNames.includes(secName)) {
        orderedSecNames.push(secName);
      }
    });

    orderedSecNames.forEach((secName, sIdx) => {
      let tests = grouped[secName];
      const sectionId = `sec-${sIdx}`;

      // Sort tests within section according to executionConfig
      const secConfig = configSequence.find(s => s.name === secName);
      if (secConfig && Array.isArray(secConfig.tests)) {
        const orderedPaths = secConfig.tests;
        tests.sort((a, b) => {
          let idxA = orderedPaths.indexOf(a.path);
          let idxB = orderedPaths.indexOf(b.path);
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });
      }

      const secGroup = document.createElement('div');
      secGroup.className = 'section-group';
      if (collapsedTreeSections.has(secName)) {
        secGroup.classList.add('collapsed');
      }

      secGroup.innerHTML = `
        <div class="section-header" data-target="${sectionId}">
          <div class="section-header-left">
            <i class="fa-solid fa-folder-open folder-icon"></i>
            <span class="section-title" title="${secName}">${secName}</span>
            <span class="count-badge">${tests.length} tests</span>
          </div>
          <div class="section-header-right">
            <button class="btn-rerun btn-rerun-section" data-section="${secName}" title="Run Section">
              <i class="fa-solid fa-play"></i> Run Section
            </button>
            <i class="fa-solid fa-chevron-down toggle-icon" style="margin-left: 8px; color: var(--text-muted);"></i>
          </div>
        </div>
        <div id="${sectionId}" class="section-items">
          ${tests.map(test => `
            <div class="test-item">
              <div class="test-item-left">
                <label class="checkbox-container" onclick="event.stopPropagation();">
                  <input type="checkbox" class="test-checkbox" data-path="${test.path}">
                  <span class="checkmark"></span>
                </label>
                <span class="test-name" title="${test.path}">${test.name}</span>
              </div>
              <div class="test-item-right">
                <button class="btn-rerun btn-rerun-single" data-path="${test.path}" title="Run This Test">
                  <i class="fa-solid fa-play"></i> Run
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Header click collapses/expands
      const header = secGroup.querySelector('.section-header');
      header.addEventListener('click', (e) => {
        if (e.target.closest('.btn-rerun-section')) return;
        secGroup.classList.toggle('collapsed');
        if (secGroup.classList.contains('collapsed')) {
          collapsedTreeSections.add(secName);
        } else {
          collapsedTreeSections.delete(secName);
        }
      });

      sectionsContainer.appendChild(secGroup);
    });

    // Bind Rerun Buttons
    document.querySelectorAll('.btn-rerun-section').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const secName = e.currentTarget.dataset.section;
        const secConfig = (executionConfig.sequence || []).find(s => s.name === secName);
        let sectionTests = [];
        if (secConfig && Array.isArray(secConfig.tests) && secConfig.tests.length > 0) {
          sectionTests = secConfig.tests;
        } else {
          sectionTests = testFiles.filter(t => t.section === secName).map(t => t.path);
        }
        startExecution(sectionTests, `Section: ${secName}`);
      });
    });

    document.querySelectorAll('.btn-rerun-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const testPath = e.currentTarget.dataset.path;
        startExecution([testPath], `Single Test: ${testPath.split('/').pop()}`);
      });
    });
  }

  // ── 4. Order Modified Highlighting ──────────────────────────────────────────
  let isOrderModified = false;

  function markOrderModified() {
    isOrderModified = true;
    if (btnSaveOrder) {
      btnSaveOrder.classList.add('has-unsaved-changes');
    }
  }

  function clearOrderModified() {
    isOrderModified = false;
    if (btnSaveOrder) {
      btnSaveOrder.classList.remove('has-unsaved-changes');
    }
  }

  // ── 4b. Render Order Manager (With Sub-Test Ordering & Drag-and-Drop) ────────
  let draggedSecIdx = null;
  let draggedTestSecIdx = null;
  let draggedTestIdx = null;

  function renderOrderManager() {
    orderManagerList.innerHTML = '';
    const sequence = executionConfig.sequence || [];

    sequence.forEach((sec, secIdx) => {
      const secCard = document.createElement('div');
      secCard.className = 'order-section-card';
      if (collapsedOrderSections.has(sec.name)) {
        secCard.classList.add('collapsed');
      }

      secCard.setAttribute('draggable', 'true');
      secCard.dataset.secIndex = secIdx;

      const secTests = Array.isArray(sec.tests) ? sec.tests : [];

      secCard.innerHTML = `
        <div class="order-section-header">
          <div class="order-section-left">
            <i class="fa-solid fa-grip-vertical drag-handle-sec" title="Drag to reorder section"></i>
            <span class="order-seq-badge">${secIdx + 1}</span>
            <strong class="order-sec-title" title="${sec.name}"><i class="fa-solid fa-folder"></i> ${sec.name}</strong>
            <span class="count-badge">${secTests.length} tests</span>
          </div>
          <div class="order-section-right">
            <button class="btn-xs btn-move-sec-up" data-index="${secIdx}" ${secIdx === 0 ? 'disabled' : ''} title="Move Section Up">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button class="btn-xs btn-move-sec-down" data-index="${secIdx}" ${secIdx === sequence.length - 1 ? 'disabled' : ''} title="Move Section Down">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <i class="fa-solid fa-chevron-down order-toggle-icon" style="margin-left: 6px; cursor: pointer; color: var(--text-muted);"></i>
          </div>
        </div>
        <div class="order-subtests-container">
          ${secTests.map((tPath, tIdx) => {
            const fileName = tPath.split('/').pop();
            return `
              <div class="order-test-row" draggable="true" data-sec-index="${secIdx}" data-test-index="${tIdx}">
                <div class="order-test-left">
                  <i class="fa-solid fa-grip-lines drag-handle-test" title="Drag to reorder test"></i>
                  <span class="test-seq-badge">${tIdx + 1}</span>
                  <span class="test-name-text" title="${tPath}">${fileName}</span>
                </div>
                <div class="order-test-right">
                  <button class="btn-xs btn-move-test-up" data-sec-index="${secIdx}" data-test-index="${tIdx}" ${tIdx === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-up"></i>
                  </button>
                  <button class="btn-xs btn-move-test-down" data-sec-index="${secIdx}" data-test-index="${tIdx}" ${tIdx === secTests.length - 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-down"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Expand / Collapse Section in Order Manager
      const header = secCard.querySelector('.order-section-header');
      header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        secCard.classList.toggle('collapsed');
        if (secCard.classList.contains('collapsed')) {
          collapsedOrderSections.add(sec.name);
        } else {
          collapsedOrderSections.delete(sec.name);
        }
      });

      // Drag & Drop for Section Card
      secCard.addEventListener('dragstart', (e) => {
        if (e.target.closest('.order-test-row')) return; // Allow subtest drag
        draggedSecIdx = secIdx;
        secCard.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      secCard.addEventListener('dragend', () => {
        draggedSecIdx = null;
        secCard.classList.remove('dragging');
        document.querySelectorAll('.order-section-card').forEach(c => c.classList.remove('drag-over'));
      });

      secCard.addEventListener('dragover', (e) => {
        if (draggedSecIdx === null || draggedSecIdx === secIdx) return;
        e.preventDefault();
        secCard.classList.add('drag-over');
      });

      secCard.addEventListener('dragleave', () => {
        secCard.classList.remove('drag-over');
      });

      secCard.addEventListener('drop', (e) => {
        if (draggedSecIdx === null || draggedSecIdx === secIdx) return;
        e.preventDefault();
        secCard.classList.remove('drag-over');

        const movedSec = sequence.splice(draggedSecIdx, 1)[0];
        sequence.splice(secIdx, 0, movedSec);
        draggedSecIdx = null;
        markOrderModified();
        renderOrderManager();
      });

      orderManagerList.appendChild(secCard);
    });

    // Bind Section Move Up / Down Buttons
    orderManagerList.querySelectorAll('.btn-move-sec-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx > 0) {
          const temp = sequence[idx];
          sequence[idx] = sequence[idx - 1];
          sequence[idx - 1] = temp;
          markOrderModified();
          renderOrderManager();
        }
      });
    });

    orderManagerList.querySelectorAll('.btn-move-sec-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx < sequence.length - 1) {
          const temp = sequence[idx];
          sequence[idx] = sequence[idx + 1];
          sequence[idx + 1] = temp;
          markOrderModified();
          renderOrderManager();
        }
      });
    });

    // Bind Test Move Up / Down Buttons within a section
    orderManagerList.querySelectorAll('.btn-move-test-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sIdx = parseInt(e.currentTarget.dataset.secIndex, 10);
        const tIdx = parseInt(e.currentTarget.dataset.testIndex, 10);
        const tests = sequence[sIdx].tests;
        if (tIdx > 0) {
          const temp = tests[tIdx];
          tests[tIdx] = tests[tIdx - 1];
          tests[tIdx - 1] = temp;
          markOrderModified();
          renderOrderManager();
        }
      });
    });

    orderManagerList.querySelectorAll('.btn-move-test-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sIdx = parseInt(e.currentTarget.dataset.secIndex, 10);
        const tIdx = parseInt(e.currentTarget.dataset.testIndex, 10);
        const tests = sequence[sIdx].tests;
        if (tIdx < tests.length - 1) {
          const temp = tests[tIdx];
          tests[tIdx] = tests[tIdx + 1];
          tests[tIdx + 1] = temp;
          markOrderModified();
          renderOrderManager();
        }
      });
    });

    // Drag & Drop for Subtest Rows
    orderManagerList.querySelectorAll('.order-test-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        draggedTestSecIdx = parseInt(row.dataset.secIndex, 10);
        draggedTestIdx = parseInt(row.dataset.testIndex, 10);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        draggedTestSecIdx = null;
        draggedTestIdx = null;
        row.classList.remove('dragging');
        document.querySelectorAll('.order-test-row').forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        const sIdx = parseInt(row.dataset.secIndex, 10);
        const tIdx = parseInt(row.dataset.testIndex, 10);
        if (draggedTestSecIdx !== sIdx || draggedTestIdx === tIdx) return;
        e.preventDefault();
        e.stopPropagation();
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        const sIdx = parseInt(row.dataset.secIndex, 10);
        const tIdx = parseInt(row.dataset.testIndex, 10);
        if (draggedTestSecIdx !== sIdx || draggedTestIdx === tIdx) return;
        e.preventDefault();
        e.stopPropagation();
        row.classList.remove('drag-over');

        const tests = sequence[sIdx].tests;
        const movedTest = tests.splice(draggedTestIdx, 1)[0];
        tests.splice(tIdx, 0, movedTest);

        draggedTestSecIdx = null;
        draggedTestIdx = null;
        markOrderModified();
        renderOrderManager();
      });
    });
  }

  // ── 5. Save Order Config ────────────────────────────────────────────────────
  async function saveConfig() {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionConfig)
      });
      const data = await res.json();
      if (data.success || res.ok) {
        clearOrderModified();
        showToast('Configuration saved successfully!', 'success');
        renderTree(); // Instantly update Test Sections Tree tab!
      } else {
        showToast(data.message || 'Failed to save order config.', 'error');
      }
    } catch (e) {
      showToast('Failed to save order config.', 'error');
    }
  }

  btnSaveOrder.addEventListener('click', saveConfig);

  // Select All Checkbox
  selectAllCheckbox.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.test-checkbox').forEach(cb => cb.checked = checked);
  });

  btnCollapseAll.addEventListener('click', () => {
    document.querySelectorAll('.section-group').forEach(sg => sg.classList.add('collapsed'));
  });

  // ── 6. Execution Handler ────────────────────────────────────────────────────
  async function startExecution(targetTests, label = 'Custom Run') {
    const browser = browserSelect.value;
    const headed = headedToggle.checked;

    appendLog(`\n▶ Starting Test Execution [${label}]...`);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests: targetTests, browser, headed, label })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Failed to start execution.', 'error');
      }
    } catch (e) {
      showToast('Failed to trigger test execution.', 'error');
    }
  }

  btnRunAll.addEventListener('click', () => {
    let orderedTests = [];
    (executionConfig.sequence || []).forEach(sec => {
      if (Array.isArray(sec.tests)) {
        orderedTests = orderedTests.concat(sec.tests);
      }
    });
    startExecution(orderedTests, 'Full Sequence Run');
  });

  btnRunSelected.addEventListener('click', () => {
    const selected = [];
    document.querySelectorAll('.test-checkbox:checked').forEach(cb => {
      selected.push(cb.dataset.path);
    });

    if (selected.length === 0) {
      showToast('Please check at least one test case checkbox first.', 'error');
      return;
    }
    startExecution(selected, `Selected Tests (${selected.length})`);
  });

  btnStop.addEventListener('click', async () => {
    try {
      await fetch('/api/stop', { method: 'POST' });
    } catch (e) {}
  });

  // ── 7. SSE Live Event Stream ────────────────────────────────────────────────
  function initSSE() {
    sseSource = new EventSource('/api/events');

    sseSource.addEventListener('state', (e) => {
      const state = JSON.parse(e.data);
      updateExecutionUI(state);
    });

    sseSource.addEventListener('log', (e) => {
      const text = JSON.parse(e.data);
      appendLog(text);
    });
  }

  function formatStatusLabel(status) {
    if (!status) return 'Idle';
    switch (status) {
      case 'completed_with_failures':
        return 'Completed (With Failures)';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running...';
      case 'idle':
        return 'Idle';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  }

  function updateExecutionUI(state) {
    statusText.textContent = formatStatusLabel(state.status);
    statusPill.className = `status-pill ${state.status}`;

    statPassed.textContent = state.passedCount || 0;
    statFailed.textContent = state.failedCount || 0;

    const isRunning = state.status === 'running';
    btnRunAll.disabled = isRunning;
    btnRunSelected.disabled = isRunning;
    btnStop.disabled = !isRunning;

    if (isRunning) {
      progressBanner.classList.remove('hidden');
      activeTestFile.textContent = state.currentTest ? state.currentTest.split('/').pop() : 'Preparing...';

      const pct = state.totalTests > 0 ? Math.round((state.completedTests / state.totalTests) * 100) : 0;
      progressBar.style.width = `${pct}%`;
      progressMetricsText.textContent = `Completed: ${state.completedTests} / ${state.totalTests} | Passed: ${state.passedCount} | Failed: ${state.failedCount}`;
    } else {
      progressBanner.classList.add('hidden');
      loadReports();
    }
  }

  function stripAnsi(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nary=><]/g, '');
  }

  function appendLog(text) {
    const cleanText = stripAnsi(text);
    if (!cleanText.trim()) return;

    const line = document.createElement('div');
    line.className = 'log-line';
    if (cleanText.includes('passed') || cleanText.includes('✓') || cleanText.includes('ok ')) {
      line.classList.add('pass');
    } else if (cleanText.includes('failed') || cleanText.includes('Error') || cleanText.includes('x ')) {
      line.classList.add('fail');
    } else {
      line.classList.add('info');
    }
    line.textContent = cleanText;
    consoleTerminal.appendChild(line);
    consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
  }

  btnClearLogs.addEventListener('click', () => {
    consoleTerminal.innerHTML = '<div class="log-line info">Logs cleared.</div>';
  });

  // ── 8. Reports History ──────────────────────────────────────────────────────
  async function loadReports() {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      renderReportsTable(data.reports || []);
    } catch (e) {}
  }

  function formatReportDate(timestamp) {
    if (!timestamp) return '-';
    // timestamp format: 2026-07-28_13-00-32 (UTC)
    const parts = timestamp.split('_');
    if (parts.length === 2) {
      const dParts = parts[0].split('-');
      const tParts = parts[1].split('-');
      if (dParts.length === 3 && tParts.length === 3) {
        // Construct UTC Date object so toLocaleString converts to local system timezone
        const dt = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2], tParts[0], tParts[1], tParts[2]));
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }
      }
    }
    return timestamp;
  }

  const selectAllReportsCheckbox = document.getElementById('select-all-reports');
  const btnDeleteSelectedReports = document.getElementById('btn-delete-selected-reports');
  const selectedReportsCount = document.getElementById('selected-reports-count');

  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const deleteConfirmText = document.getElementById('delete-confirm-text');
  let pendingDeleteFolders = [];

  function openDeleteConfirmModal(folderNames) {
    if (!folderNames || folderNames.length === 0) return;
    pendingDeleteFolders = folderNames;
    const count = folderNames.length;
    deleteConfirmText.textContent = `Are you sure you want to delete ${count} report archive${count > 1 ? 's' : ''}? This action cannot be undone.`;
    deleteConfirmModal.classList.remove('hidden');
  }

  function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.add('hidden');
    pendingDeleteFolders = [];
  }

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteConfirmModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (pendingDeleteFolders.length === 0) return;
      try {
        const res = await fetch('/api/reports/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderNames: pendingDeleteFolders })
        });
        const data = await res.json();
        closeDeleteConfirmModal();
        if (data.success) {
          showToast('Report archive(s) deleted successfully.', 'success');
          loadReports();
        } else {
          showToast(data.message || 'Failed to delete report(s).', 'error');
        }
      } catch (e) {
        closeDeleteConfirmModal();
        showToast('Error deleting report archives.', 'error');
      }
    });
  }

  function updateSelectedReportsUI() {
    const checked = document.querySelectorAll('.report-checkbox:checked');
    const count = checked.length;
    if (count > 0) {
      btnDeleteSelectedReports.style.display = 'inline-flex';
      selectedReportsCount.textContent = count;
    } else {
      btnDeleteSelectedReports.style.display = 'none';
    }
  }

  if (selectAllReportsCheckbox) {
    selectAllReportsCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = isChecked);
      updateSelectedReportsUI();
    });
  }

  if (btnDeleteSelectedReports) {
    btnDeleteSelectedReports.addEventListener('click', () => {
      const selectedFolders = [];
      document.querySelectorAll('.report-checkbox:checked').forEach(cb => {
        selectedFolders.push(cb.dataset.folder);
      });
      openDeleteConfirmModal(selectedFolders);
    });
  }

  function renderReportsTable(reports) {
    reportsTableBody.innerHTML = '';
    if (selectAllReportsCheckbox) selectAllReportsCheckbox.checked = false;
    updateSelectedReportsUI();

    if (reports.length === 0) {
      reportsTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No report archives generated yet. Click "Run" to create a new timestamped report.</td></tr>`;
      return;
    }

    reports.forEach(rep => {
      const formattedTime = formatReportDate(rep.timestamp);
      const runTitle = rep.label || rep.reportFolderName;

      let statusClass = 'completed';
      let statusLabel = 'Completed';
      if (rep.status === 'completed_with_failures') {
        statusClass = 'completed_with_failures';
        statusLabel = 'Completed (With Failures)';
      } else if (rep.status === 'failed') {
        statusClass = 'failed';
        statusLabel = 'Failed';
      } else if (rep.status === 'running') {
        statusClass = 'running';
        statusLabel = 'Running';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">
          <label class="checkbox-container">
            <input type="checkbox" class="report-checkbox" data-folder="${rep.reportFolderName}">
            <span class="checkmark"></span>
          </label>
        </td>
        <td>
          <strong style="display: block; font-size: 13px; color: var(--text-main);">${runTitle}</strong>
          <small style="color: var(--text-muted); font-size: 11px;"><i class="fa-regular fa-clock"></i> ${formattedTime}</small>
        </td>
        <td><span class="count-badge">${rep.browser || 'chromium'}</span></td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td><strong style="color: var(--success);">${rep.passedCount || 0}</strong></td>
        <td><strong style="color: var(--danger);">${rep.failedCount || 0}</strong></td>
        <td>${rep.durationMs ? Math.round(rep.durationMs / 1000) + 's' : '-'}</td>
        <td>
          <div class="report-action-buttons">
            <button class="btn-xs btn-view-report" data-url="${rep.reportPath}" data-name="${runTitle} (${formattedTime})">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open HTML
            </button>
            <button class="btn-icon-danger btn-delete-single-report" data-folder="${rep.reportFolderName}" title="Delete report archive">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      reportsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.report-checkbox').forEach(cb => {
      cb.addEventListener('change', updateSelectedReportsUI);
    });

    document.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.currentTarget.dataset.url;
        const name = e.currentTarget.dataset.name;
        openReportModal(url, name);
      });
    });

    document.querySelectorAll('.btn-delete-single-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const folder = e.currentTarget.dataset.folder;
        openDeleteConfirmModal([folder]);
      });
    });
  }

  btnRefreshReports.addEventListener('click', loadReports);

  // ── 9. Screenshots Gallery Handler ──────────────────────────────────────────
  const btnRefreshScreenshots = document.getElementById('btn-refresh-screenshots');
  const btnCollapseScreenshots = document.getElementById('btn-collapse-screenshots');
  const screenshotSearchInput = document.getElementById('screenshot-search-input');
  const screenshotsTreeContainer = document.getElementById('screenshots-tree-container');

  // Lightbox Elements
  const screenshotLightbox = document.getElementById('screenshot-lightbox');
  const lightboxOverlay = screenshotLightbox ? screenshotLightbox.querySelector('.lightbox-overlay') : null;
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxFilename = document.getElementById('lightbox-filename');
  const lightboxSize = document.getElementById('lightbox-size');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxDownload = document.getElementById('lightbox-download');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let rawScreenshotRuns = [];
  let flatImageList = [];
  let currentLightboxIndex = -1;
  const collapsedScreenshotRuns = new Set();
  const collapsedScreenshotSections = new Set();

  async function loadScreenshots() {
    if (!screenshotsTreeContainer) return;
    screenshotsTreeContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading Screenshots Gallery...</div>';
    try {
      const res = await fetch('/api/screenshots');
      const data = await res.json();
      if (data.success) {
        rawScreenshotRuns = data.runs || [];
        renderScreenshotsGallery();
      } else {
        screenshotsTreeContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--danger);">Failed to load screenshots gallery.</div>';
      }
    } catch (e) {
      screenshotsTreeContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--danger);">Error loading screenshots gallery.</div>';
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function renderScreenshotsGallery() {
    if (!screenshotsTreeContainer) return;
    screenshotsTreeContainer.innerHTML = '';
    flatImageList = [];

    const searchQuery = (screenshotSearchInput ? screenshotSearchInput.value : '').trim().toLowerCase();

    if (rawScreenshotRuns.length === 0) {
      screenshotsTreeContainer.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: var(--text-muted); background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 10px;">
          <i class="fa-solid fa-images" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--text-main);">No Screenshots Captured Yet</h4>
          <p style="font-size: 13px;">Screenshots captured during test runs will automatically appear here grouped by Date/Time execution run folders!</p>
        </div>
      `;
      return;
    }

    const filteredRuns = rawScreenshotRuns.map(run => {
      const filteredSections = (run.sections || []).map(sec => {
        const filteredTests = (sec.tests || []).map(t => {
          const filteredImgs = (t.images || []).filter(img => {
            if (!searchQuery) return true;
            return img.name.toLowerCase().includes(searchQuery) || 
                   t.name.toLowerCase().includes(searchQuery) ||
                   sec.name.toLowerCase().includes(searchQuery) ||
                   run.title.toLowerCase().includes(searchQuery);
          });
          return { ...t, images: filteredImgs };
        }).filter(t => t.images.length > 0);
        return { ...sec, tests: filteredTests };
      }).filter(sec => sec.tests.length > 0);

      const totalCount = filteredSections.reduce((sum, sec) => {
        return sum + sec.tests.reduce((tSum, t) => tSum + t.images.length, 0);
      }, 0);

      return { ...run, totalScreenshots: totalCount, sections: filteredSections };
    }).filter(run => run.totalScreenshots > 0);

    if (filteredRuns.length === 0) {
      screenshotsTreeContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted);">
          No screenshots matching "<strong>${searchQuery}</strong>".
        </div>
      `;
      return;
    }

    filteredRuns.forEach(run => {
      if (run.runFolderName === 'run_archive' && rawScreenshotRuns.length > 1 && !collapsedScreenshotRuns.has('run_archive_init')) {
        collapsedScreenshotRuns.add('run_archive');
        collapsedScreenshotRuns.add('run_archive_init');
      }

      const runCard = document.createElement('div');
      runCard.className = 'screenshot-run-card';
      if (collapsedScreenshotRuns.has(run.runFolderName)) {
        runCard.classList.add('collapsed');
      }

      const runTitleDisplay = run.runFolderName === 'run_archive' ? 'Archive / Legacy Screenshots' : `Execution Run: ${run.title}`;
      const runIcon = run.runFolderName === 'run_archive' ? 'fa-box-archive' : 'fa-calendar-days';

      runCard.innerHTML = `
        <div class="screenshot-run-header">
          <div class="run-title-group">
            <i class="fa-solid ${runIcon} run-icon"></i>
            <span class="run-title-text">${runTitleDisplay}</span>
            <span class="count-badge" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">
              ${run.totalScreenshots} screenshot${run.totalScreenshots !== 1 ? 's' : ''}
            </span>
          </div>
          <div class="run-meta-group">
            ${run.runFolderName !== 'run_archive' ? `
              <button class="btn-icon-danger-xs btn-delete-run" data-run="${run.runFolderName}" title="Delete screenshot run folder">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
            <i class="fa-solid fa-chevron-down run-toggle-icon" style="color: var(--text-muted);"></i>
          </div>
        </div>
        <div class="screenshot-run-body"></div>
      `;

      const runHeader = runCard.querySelector('.screenshot-run-header');
      const runBody = runCard.querySelector('.screenshot-run-body');
      const btnDeleteRun = runCard.querySelector('.btn-delete-run');

      if (btnDeleteRun) {
        btnDeleteRun.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteScreenshotRun(run.runFolderName);
        });
      }

      runHeader.addEventListener('click', () => {
        runCard.classList.toggle('collapsed');
        if (runCard.classList.contains('collapsed')) {
          collapsedScreenshotRuns.add(run.runFolderName);
        } else {
          collapsedScreenshotRuns.delete(run.runFolderName);
        }
      });

      (run.sections || []).forEach(sec => {
        const secCard = document.createElement('div');
        secCard.className = 'screenshot-sec-card';
        const secKey = `${run.runFolderName}/${sec.name}`;
        if (collapsedScreenshotSections.has(secKey)) {
          secCard.classList.add('collapsed');
        }

        const secImageCount = sec.tests.reduce((sum, t) => sum + t.images.length, 0);

        secCard.innerHTML = `
          <div class="screenshot-sec-header">
            <div class="screenshot-sec-title">
              <i class="fa-solid fa-folder-open" style="color: #f59e0b;"></i>
              <strong>${sec.name}</strong>
              <span class="count-badge">${secImageCount} item${secImageCount !== 1 ? 's' : ''}</span>
            </div>
            <i class="fa-solid fa-chevron-down sec-toggle-icon" style="color: var(--text-muted); font-size: 12px;"></i>
          </div>
          <div class="screenshot-sec-body"></div>
        `;

        const secHeader = secCard.querySelector('.screenshot-sec-header');
        const secBody = secCard.querySelector('.screenshot-sec-body');

        secHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          secCard.classList.toggle('collapsed');
          if (secCard.classList.contains('collapsed')) {
            collapsedScreenshotSections.add(secKey);
          } else {
            collapsedScreenshotSections.delete(secKey);
          }
        });

        (sec.tests || []).forEach(testObj => {
          const testGroup = document.createElement('div');
          testGroup.className = 'screenshot-test-group';
          testGroup.innerHTML = `
            <div class="screenshot-test-header">
              <span><i class="fa-solid fa-vial" style="color: #6366f1; margin-right: 6px;"></i> ${testObj.name}</span>
              <span class="count-badge">${testObj.images.length} screenshot${testObj.images.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="screenshot-grid"></div>
          `;

          const grid = testGroup.querySelector('.screenshot-grid');

          (testObj.images || []).forEach(imgObj => {
            const imgIndex = flatImageList.length;
            flatImageList.push(imgObj);

            const formattedTime = imgObj.modifiedAt ? new Date(imgObj.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const sizeText = formatBytes(imgObj.sizeBytes);

            const imgCard = document.createElement('div');
            imgCard.className = 'screenshot-card';
            imgCard.dataset.index = imgIndex;
            imgCard.innerHTML = `
              <div class="screenshot-thumb-wrapper">
                <img src="${imgObj.url}" alt="${imgObj.name}" loading="lazy" />
                <div class="screenshot-overlay">
                  <i class="fa-solid fa-maximize"></i>
                </div>
              </div>
              <div class="screenshot-card-footer">
                <span class="screenshot-card-name" title="${imgObj.name}">${imgObj.name}</span>
                <div class="screenshot-card-meta">
                  <span>${sizeText}</span>
                  <span>${formattedTime}</span>
                </div>
              </div>
            `;

            imgCard.addEventListener('click', () => openLightbox(imgIndex));
            grid.appendChild(imgCard);
          });

          secBody.appendChild(testGroup);
        });

        runBody.appendChild(secCard);
      });

      screenshotsTreeContainer.appendChild(runCard);
    });
  }

  async function deleteScreenshotRun(runFolderName) {
    if (!confirm(`Are you sure you want to delete screenshot run folder "${runFolderName}"?`)) return;
    try {
      const res = await fetch('/api/screenshots/delete-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runFolderName })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Screenshot run folder deleted successfully.', 'success');
        loadScreenshots();
      } else {
        showToast(data.message || 'Failed to delete run folder.', 'error');
      }
    } catch (e) {
      showToast('Error deleting screenshot run folder.', 'error');
    }
  }

  function openLightbox(index) {
    if (!screenshotLightbox || flatImageList.length === 0) return;
    currentLightboxIndex = index;
    updateLightboxContent();
    screenshotLightbox.classList.remove('hidden');
  }

  function closeLightbox() {
    if (!screenshotLightbox) return;
    screenshotLightbox.classList.add('hidden');
    if (lightboxImg) lightboxImg.src = '';
  }

  function updateLightboxContent() {
    if (currentLightboxIndex < 0 || currentLightboxIndex >= flatImageList.length) return;
    const item = flatImageList[currentLightboxIndex];

    if (lightboxImg) lightboxImg.src = item.url;
    if (lightboxTitle) lightboxTitle.textContent = item.name;
    if (lightboxFilename) lightboxFilename.innerHTML = `<i class="fa-solid fa-file-image"></i> ${item.name}`;
    if (lightboxSize) lightboxSize.innerHTML = `<i class="fa-solid fa-hard-drive"></i> ${formatBytes(item.sizeBytes)}`;
    if (lightboxDate) lightboxDate.innerHTML = `<i class="fa-regular fa-clock"></i> ${item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : ''}`;
    if (lightboxDownload) lightboxDownload.href = item.url;
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', () => {
      if (flatImageList.length === 0) return;
      currentLightboxIndex = (currentLightboxIndex - 1 + flatImageList.length) % flatImageList.length;
      updateLightboxContent();
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', () => {
      if (flatImageList.length === 0) return;
      currentLightboxIndex = (currentLightboxIndex + 1) % flatImageList.length;
      updateLightboxContent();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!screenshotLightbox || screenshotLightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lightboxPrev && lightboxPrev.click();
    else if (e.key === 'ArrowRight') lightboxNext && lightboxNext.click();
  });

  if (btnRefreshScreenshots) btnRefreshScreenshots.addEventListener('click', loadScreenshots);
  if (screenshotSearchInput) screenshotSearchInput.addEventListener('input', renderScreenshotsGallery);

  if (btnCollapseScreenshots) {
    btnCollapseScreenshots.addEventListener('click', () => {
      document.querySelectorAll('.screenshot-run-card, .screenshot-sec-card').forEach(sc => sc.classList.add('collapsed'));
    });
  }

  // Load screenshots when tab is clicked
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      if (target === 'tab-screenshots') {
        loadScreenshots();
      }
    });
  });

  // Modal handlers
  function openReportModal(url, name) {
    modalTitle.innerHTML = `<i class="fa-solid fa-file-contract"></i> Playwright HTML Report - <strong>${name}</strong>`;
    reportIframe.src = url;
    reportModal.classList.remove('hidden');
  }

  btnCloseModal.addEventListener('click', () => {
    reportModal.classList.add('hidden');
    reportIframe.src = 'about:blank';
  });

  // Init
  loadData();
  initSSE();
});
