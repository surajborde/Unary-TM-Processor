/**
 * Main Application Controller for Unary Turing Machine Processor
 * Manages UI rendering, user interactions, animation frames, and telemetry.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let currentOp = 'addition'; // 'addition' | 'multiplication'
  let tm = new TuringMachine(TM_MACHINES[currentOp]);
  let timerId = null;
  let isRunning = false;
  let stepIntervalMs = 350;

  // DOM Elements - Navigation & Operation
  const opAdditionBtn = document.getElementById('opAdditionBtn');
  const opMultiplicationBtn = document.getElementById('opMultiplicationBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  // DOM Elements - Input & Validation
  const unaryInput = document.getElementById('unaryInput');
  const loadInputBtn = document.getElementById('loadInputBtn');
  const validationBanner = document.getElementById('validationBanner');
  const valIcon = document.getElementById('valIcon');
  const valText = document.getElementById('valText');
  const operandBreakdown = document.getElementById('operandBreakdown');
  const tagOp1 = document.getElementById('tagOp1');
  const tagOp2 = document.getElementById('tagOp2');
  const tagOpSymbol = document.getElementById('tagOpSymbol');
  const tagExpected = document.getElementById('tagExpected');

  // DOM Elements - Tape
  const tapeTrackOuter = document.getElementById('tapeTrackOuter');
  const tapeCellsContainer = document.getElementById('tapeCellsContainer');
  const headStateBadge = document.getElementById('headStateBadge');
  const centerHeadBtn = document.getElementById('centerHeadBtn');

  // DOM Elements - Telemetry HUD
  const telState = document.getElementById('telState');
  const telSymbol = document.getElementById('telSymbol');
  const telHeadPos = document.getElementById('telHeadPos');
  const telStep = document.getElementById('telStep');
  const telAction = document.getElementById('telAction');
  const telStatus = document.getElementById('telStatus');

  // DOM Elements - Controls
  const runBtn = document.getElementById('runBtn');
  const runBtnText = document.getElementById('runBtnText');
  const stepBtn = document.getElementById('stepBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const fastForwardBtn = document.getElementById('fastForwardBtn');
  const speedSlider = document.getElementById('speedSlider');
  const speedDisplay = document.getElementById('speedDisplay');

  // DOM Elements - Results Card
  const resultBadgeStatus = document.getElementById('resultBadgeStatus');
  const resInput = document.getElementById('resInput');
  const resArithmetic = document.getElementById('resArithmetic');
  const resUnaryOutput = document.getElementById('resUnaryOutput');
  const resDecimal = document.getElementById('resDecimal');
  const statSteps = document.getElementById('statSteps');
  const statCells = document.getElementById('statCells');
  const statHaltState = document.getElementById('statHaltState');

  // DOM Elements - Table & Logs
  const activeMachinePill = document.getElementById('activeMachinePill');
  const transitionTable = document.getElementById('transitionTable');
  const stateDescText = document.getElementById('stateDescText');
  const traceLogContainer = document.getElementById('traceLogContainer');
  const copyTraceBtn = document.getElementById('copyTraceBtn');
  const clearTraceBtn = document.getElementById('clearTraceBtn');

  // DOM Elements - Presets
  const validPresetsGrid = document.getElementById('validPresetsGrid');
  const invalidPresetsGrid = document.getElementById('invalidPresetsGrid');

  // DOM Elements - Theory Tabs
  const theoryTabBtns = document.querySelectorAll('.theory-tab-btn');
  const theoryPanels = document.querySelectorAll('.theory-panel');

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    setupEventListeners();
    updateSpeedLabel(speedSlider.value);
    loadMachine(currentOp, unaryInput.value);
  }

  // =========================================================================
  // Operation & Machine Loading
  // =========================================================================
  function setOperation(op, newInput = null) {
    if (isRunning) pauseSimulation();
    currentOp = op;

    if (op === 'addition') {
      opAdditionBtn.classList.add('active');
      opAdditionBtn.setAttribute('aria-selected', 'true');
      opMultiplicationBtn.classList.remove('active');
      opMultiplicationBtn.setAttribute('aria-selected', 'false');
      tagOpSymbol.textContent = '+';
      activeMachinePill.textContent = 'Unary Addition Machine';
    } else {
      opMultiplicationBtn.classList.add('active');
      opMultiplicationBtn.setAttribute('aria-selected', 'true');
      opAdditionBtn.classList.remove('active');
      opAdditionBtn.setAttribute('aria-selected', 'false');
      tagOpSymbol.textContent = '×';
      activeMachinePill.textContent = 'Unary Multiplication Machine';
    }

    const valToLoad = newInput !== null ? newInput : unaryInput.value;
    loadMachine(op, valToLoad);
  }

  function loadMachine(op, inputStr) {
    if (isRunning) pauseSimulation();

    const machineDef = TM_MACHINES[op];
    tm.setMachine(machineDef);
    unaryInput.value = inputStr;

    validateAndDisplay(inputStr);
    const res = tm.loadInput(inputStr);

    renderTransitionTable(machineDef);
    renderTape();
    updateTelemetry();
    updateResultView();
    clearTraceLog();

    if (res.success) {
      addTraceEntry({
        step: 0,
        text: `Loaded machine [${machineDef.name}] with tape input: ${inputStr}`,
        desc: 'Ready for execution'
      });
    }
  }

  // =========================================================================
  // Input Validation & Live Breakdown
  // =========================================================================
  function validateAndDisplay(inputStr) {
    const val = TuringMachine.validateInput(inputStr);

    if (val.valid) {
      unaryInput.classList.remove('error');
      validationBanner.className = 'validation-banner valid';
      valIcon.textContent = '✓';
      valText.textContent = 'Valid Unary Expression';
      operandBreakdown.style.display = 'flex';

      const opChar = currentOp === 'addition' ? '+' : '×';
      const m = val.m;
      const n = val.n;
      const expected = currentOp === 'addition' ? (m + n) : (m * n);

      tagOp1.textContent = `${'1'.repeat(m)} (${m})`;
      tagOp2.textContent = `${'1'.repeat(n)} (${n})`;
      tagOpSymbol.textContent = opChar;
      tagExpected.textContent = `${'1'.repeat(expected)} (${expected})`;
    } else {
      unaryInput.classList.add('error');
      validationBanner.className = 'validation-banner invalid';
      valIcon.textContent = '✕';
      valText.textContent = val.error || 'Invalid Format';
      operandBreakdown.style.display = 'none';
    }

    return val;
  }

  // =========================================================================
  // Tape Rendering & Mechanical Head Animation
  // =========================================================================
  function renderTape() {
    const tapeWin = tm.getTapeWindow(8);
    tapeCellsContainer.innerHTML = '';

    tapeWin.cells.forEach(cell => {
      const cellEl = document.createElement('div');
      cellEl.className = 'tape-cell';
      cellEl.setAttribute('data-index', cell.index);

      if (cell.isHead) {
        cellEl.classList.add('is-head');
      }

      // Add symbol-specific class
      if (cell.symbol === '1') cellEl.classList.add('sym-1');
      else if (cell.symbol === 'B') cellEl.classList.add('sym-B');
      else if (cell.symbol === 'X') cellEl.classList.add('sym-X');
      else if (cell.symbol === 'Y') cellEl.classList.add('sym-Y');
      else cellEl.classList.add('sym-blank');

      cellEl.innerHTML = `
        <span class="cell-index">${cell.index}</span>
        <span class="cell-value">${cell.symbol}</span>
      `;

      tapeCellsContainer.appendChild(cellEl);
    });

    // Update Head Badge
    headStateBadge.textContent = tm.state;

    // Smooth Center on active cell
    centerTapeOnHead();
  }

  function centerTapeOnHead() {
    const headCell = tapeCellsContainer.querySelector('.tape-cell.is-head');
    if (headCell) {
      const outerRect = tapeTrackOuter.getBoundingClientRect();
      const cellRect = headCell.getBoundingClientRect();
      const scrollOffset = (cellRect.left + cellRect.width / 2) - (outerRect.left + outerRect.width / 2);
      
      tapeTrackOuter.scrollBy({
        left: scrollOffset,
        behavior: isRunning && stepIntervalMs < 100 ? 'auto' : 'smooth'
      });
    }
  }

  // =========================================================================
  // State Transition Table Rendering & Live Highlighting
  // =========================================================================
  function renderTransitionTable(machineDef) {
    const states = machineDef.states;
    const alphabet = machineDef.tapeAlphabet;

    let html = `<thead><tr><th>State \\ Symbol</th>`;
    alphabet.forEach(sym => {
      html += `<th>'${sym}'</th>`;
    });
    html += `</tr></thead><tbody>`;

    states.forEach(state => {
      html += `<tr><td><strong>${state.id}</strong></td>`;
      alphabet.forEach(sym => {
        const key = `${state.id}_${sym}`;
        const trans = machineDef.transitions[key];
        const cellId = `cell_${key}`;

        if (trans) {
          html += `<td id="${cellId}" title="${trans.desc}">
            (${trans.nextState}, '${trans.writeSymbol}', ${trans.move})
          </td>`;
        } else {
          html += `<td id="${cellId}" class="empty-transition">—</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody>`;
    transitionTable.innerHTML = html;
    highlightActiveTransition();
  }

  function highlightActiveTransition() {
    // Clear previous highlights
    const prevs = transitionTable.querySelectorAll('.active-transition');
    prevs.forEach(el => el.classList.remove('active-transition'));

    const currentSym = tm.readSymbol(tm.head);
    const key = `${tm.state}_${currentSym}`;
    const cell = document.getElementById(`cell_${key}`);
    if (cell) {
      cell.classList.add('active-transition');
    }

    // Update state explanation
    const stateObj = tm.def.states.find(s => s.id === tm.state);
    if (stateObj) {
      stateDescText.textContent = `${stateObj.name} — ${stateObj.desc}`;
    } else {
      stateDescText.textContent = `State: ${tm.state}`;
    }
  }

  // =========================================================================
  // Telemetry HUD & Status Updates
  // =========================================================================
  function updateTelemetry(stepInfo = null) {
    telState.textContent = tm.state;
    const currentSym = tm.readSymbol(tm.head);
    telSymbol.textContent = currentSym;
    telHeadPos.textContent = `Index: ${tm.head}`;
    telStep.textContent = tm.stepCount;

    if (stepInfo) {
      telAction.textContent = `δ(${stepInfo.prevState}, '${stepInfo.readSymbol}') ⟶ (${stepInfo.nextState}, '${stepInfo.wroteSymbol}', ${stepInfo.move}) : ${stepInfo.desc}`;
    } else if (tm.status === 'READY') {
      telAction.textContent = 'Initial tape loaded. Ready to simulate.';
    } else if (tm.status === 'HALTED') {
      telAction.textContent = 'Computation halted successfully in accept state.';
    } else if (tm.status === 'ERROR') {
      telAction.textContent = tm.errorMessage || 'Execution Error.';
    }

    // Status Pill
    telStatus.className = 'status-pill';
    if (tm.status === 'RUNNING') {
      telStatus.textContent = 'RUNNING';
      telStatus.classList.add('status-running');
    } else if (tm.status === 'PAUSED') {
      telStatus.textContent = 'PAUSED';
      telStatus.classList.add('status-paused');
    } else if (tm.status === 'HALTED') {
      telStatus.textContent = 'HALTED (ACCEPT)';
      telStatus.classList.add('status-halted');
    } else if (tm.status === 'ERROR') {
      telStatus.textContent = 'ERROR / REJECT';
      telStatus.classList.add('status-error');
    } else {
      telStatus.textContent = 'READY';
      telStatus.classList.add('status-ready');
    }

    // Button states
    pauseBtn.disabled = !isRunning;
    runBtn.disabled = (tm.status === 'HALTED' || tm.status === 'ERROR');
    stepBtn.disabled = (tm.status === 'HALTED' || tm.status === 'ERROR' || isRunning);
  }

  // =========================================================================
  // Result Display View
  // =========================================================================
  function updateResultView() {
    const opSign = currentOp === 'addition' ? '+' : '×';
    const m = tm.operand1Count;
    const n = tm.operand2Count;
    const expectedVal = tm.expectedResult;

    resInput.textContent = tm.rawInput || '—';
    resArithmetic.textContent = `${m} ${opSign} ${n} = ${expectedVal}`;

    const outputInfo = tm.getTapeOutput();
    resUnaryOutput.textContent = outputInfo.unaryString;
    
    statSteps.textContent = `${tm.stepCount} steps`;
    statCells.textContent = `${tm.tape.size} cells`;
    statHaltState.textContent = tm.def.haltState;

    if (tm.status === 'HALTED') {
      resultBadgeStatus.textContent = 'Computation Complete (Verified ✓)';
      resultBadgeStatus.style.color = 'var(--emerald-success)';
      resultBadgeStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      resDecimal.textContent = `${expectedVal}`;
    } else if (tm.status === 'RUNNING' || tm.status === 'PAUSED') {
      resultBadgeStatus.textContent = `In Progress (${tm.stepCount} steps)`;
      resultBadgeStatus.style.color = 'var(--cyan-primary)';
      resDecimal.textContent = `${expectedVal}`;
    } else if (tm.status === 'ERROR') {
      resultBadgeStatus.textContent = 'Abnormal Halt';
      resultBadgeStatus.style.color = 'var(--rose-danger)';
      resDecimal.textContent = `${expectedVal} (Error)`;
    } else {
      resultBadgeStatus.textContent = 'Ready to Simulate';
      resultBadgeStatus.style.color = 'var(--text-muted)';
      resDecimal.textContent = `${expectedVal}`;
    }
  }

  // =========================================================================
  // Trace Log
  // =========================================================================
  function addTraceEntry(entry) {
    if (traceLogContainer.querySelector('.placeholder-entry')) {
      traceLogContainer.innerHTML = '';
    }

    const row = document.createElement('div');
    row.className = 'trace-entry';
    if (entry.halted) row.classList.add('entry-halt');

    if (entry.step === 0) {
      row.innerHTML = `
        <span class="trace-step-num">[Init]</span>
        <span class="trace-transition-str">${entry.text}</span>
        <span class="trace-desc">${entry.desc}</span>
      `;
    } else {
      const transStr = `δ(${entry.prevState}, '${entry.readSymbol}') ⟶ (${entry.nextState}, '${entry.wroteSymbol}', ${entry.move})`;
      row.innerHTML = `
        <span class="trace-step-num">[Step ${entry.step}]</span>
        <span class="trace-transition-str">${transStr}</span>
        <span class="trace-desc">${entry.desc}</span>
      `;
    }

    traceLogContainer.prepend(row);
  }

  function clearTraceLog() {
    traceLogContainer.innerHTML = `
      <div class="trace-entry placeholder-entry">
        Tape reset. Press <strong>Start Simulation</strong> or <strong>Single Step</strong> to observe transitions.
      </div>
    `;
  }

  // =========================================================================
  // Simulation Step & Playback Control
  // =========================================================================
  function executeSingleStep() {
    if (tm.status === 'HALTED' || tm.status === 'ERROR') {
      pauseSimulation();
      return;
    }

    const stepRes = tm.step();

    if (stepRes.error) {
      window.soundController.playError();
      updateTelemetry();
      updateResultView();
      pauseSimulation();
      addTraceEntry({
        step: tm.stepCount,
        prevState: tm.state,
        readSymbol: '?',
        wroteSymbol: '?',
        move: 'S',
        nextState: 'ERROR',
        desc: stepRes.error
      });
      return;
    }

    // Play synthesized sound
    window.soundController.playStep(stepRes.move);
    if (stepRes.wroteSymbol !== stepRes.readSymbol) {
      window.soundController.playWrite(stepRes.wroteSymbol);
    }

    renderTape();
    highlightActiveTransition();
    updateTelemetry(stepRes);
    updateResultView();
    addTraceEntry(stepRes);

    if (stepRes.halted) {
      window.soundController.playHalt();
      pauseSimulation();
      updateTelemetry();
      updateResultView();
    }
  }

  function startSimulation() {
    if (tm.status === 'HALTED' || tm.status === 'ERROR') {
      tm.reset();
      renderTape();
      clearTraceLog();
    }

    isRunning = true;
    runBtn.classList.remove('btn-success');
    runBtn.classList.add('btn-primary');
    runBtnText.textContent = 'Running...';
    pauseBtn.disabled = false;
    stepBtn.disabled = true;

    // Continuous timer
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (!isRunning || tm.status === 'HALTED' || tm.status === 'ERROR') {
        pauseSimulation();
        return;
      }
      executeSingleStep();
    }, stepIntervalMs);
  }

  function pauseSimulation() {
    isRunning = false;
    clearInterval(timerId);
    timerId = null;

    runBtn.classList.remove('btn-primary');
    runBtn.classList.add('btn-success');
    runBtnText.textContent = 'Resume Simulation';
    pauseBtn.disabled = true;
    stepBtn.disabled = (tm.status === 'HALTED' || tm.status === 'ERROR');

    if (tm.status === 'RUNNING') {
      tm.status = 'PAUSED';
      updateTelemetry();
    }
  }

  function runToFastEnd() {
    if (isRunning) pauseSimulation();
    if (tm.status === 'HALTED' || tm.status === 'ERROR') {
      tm.reset();
    }

    const result = tm.runToHalt(6000);
    renderTape();
    highlightActiveTransition();
    updateTelemetry();
    updateResultView();

    if (result.status === 'HALTED') {
      window.soundController.playHalt();
      addTraceEntry({
        step: tm.stepCount,
        halted: true,
        text: `Fast-forward completed in ${result.stepsRun} steps.`,
        desc: 'Halted in accept state'
      });
    } else if (result.error) {
      window.soundController.playError();
      addTraceEntry({
        step: tm.stepCount,
        halted: false,
        text: 'Fast-forward aborted.',
        desc: result.error
      });
    }
  }

  function updateSpeedLabel(val) {
    const ms = 1030 - Number(val); // invert: higher slider = faster (lower ms)
    stepIntervalMs = ms;

    let descriptor = 'Medium';
    if (ms > 700) descriptor = 'Very Slow';
    else if (ms > 450) descriptor = 'Slow';
    else if (ms > 200) descriptor = 'Medium';
    else if (ms > 80) descriptor = 'Fast';
    else descriptor = 'Ultra Fast';

    speedDisplay.textContent = `${descriptor} (${ms}ms)`;

    if (isRunning) {
      clearInterval(timerId);
      timerId = setInterval(executeSingleStep, stepIntervalMs);
    }
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Operation Switching
    opAdditionBtn.addEventListener('click', () => setOperation('addition'));
    opMultiplicationBtn.addEventListener('click', () => setOperation('multiplication'));

    // Input Events
    unaryInput.addEventListener('input', (e) => {
      const val = validateAndDisplay(e.target.value);
      if (val.valid) {
        loadMachine(currentOp, e.target.value);
      }
    });

    loadInputBtn.addEventListener('click', () => {
      loadMachine(currentOp, unaryInput.value);
    });

    unaryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        loadMachine(currentOp, unaryInput.value);
      }
    });

    // Control Buttons
    runBtn.addEventListener('click', () => {
      if (isRunning) {
        pauseSimulation();
      } else {
        if (tm.rawInput !== unaryInput.value.trim()) {
          loadMachine(currentOp, unaryInput.value);
        }
        startSimulation();
      }
    });

    stepBtn.addEventListener('click', () => {
      if (tm.rawInput !== unaryInput.value.trim()) {
        loadMachine(currentOp, unaryInput.value);
      }
      executeSingleStep();
    });
    pauseBtn.addEventListener('click', pauseSimulation);

    resetBtn.addEventListener('click', () => {
      if (isRunning) pauseSimulation();
      tm.reset();
      renderTape();
      highlightActiveTransition();
      updateTelemetry();
      updateResultView();
      clearTraceLog();
      runBtnText.textContent = 'Start Simulation';
    });

    fastForwardBtn.addEventListener('click', () => {
      if (tm.rawInput !== unaryInput.value.trim()) {
        loadMachine(currentOp, unaryInput.value);
      }
      runToFastEnd();
    });

    // Speed Slider
    speedSlider.addEventListener('input', (e) => {
      updateSpeedLabel(e.target.value);
    });

    // Center on Head
    centerHeadBtn.addEventListener('click', centerTapeOnHead);

    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      const enabled = window.soundController.toggle();
      soundIcon.textContent = enabled ? '🔊' : '🔇';
      soundToggleBtn.title = enabled ? 'Simulation Sound On' : 'Simulation Sound Muted';
    });

    // Preset chips
    validPresetsGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-chip');
      if (!chip) return;

      const inputVal = chip.getAttribute('data-input');
      const opVal = chip.getAttribute('data-op');

      // Update active highlight on chips
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active-preset'));
      chip.classList.add('active-preset');

      if (opVal && opVal !== currentOp) {
        setOperation(opVal, inputVal);
      } else {
        loadMachine(currentOp, inputVal);
      }
    });

    invalidPresetsGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.invalid-chip');
      if (!chip) return;

      const inputVal = chip.getAttribute('data-input');
      unaryInput.value = inputVal;
      validateAndDisplay(inputVal);
      tm.loadInput(inputVal);
      renderTape();
      updateTelemetry();
      updateResultView();
    });

    // Trace Actions
    clearTraceBtn.addEventListener('click', clearTraceLog);
    copyTraceBtn.addEventListener('click', () => {
      const entries = Array.from(traceLogContainer.querySelectorAll('.trace-entry'))
        .map(el => el.innerText.replace(/\n+/g, ' | '))
        .reverse()
        .join('\n');
      
      navigator.clipboard.writeText(entries).then(() => {
        const orig = copyTraceBtn.textContent;
        copyTraceBtn.textContent = 'Copied!';
        setTimeout(() => copyTraceBtn.textContent = orig, 1500);
      }).catch(() => {
        alert('Trace copied to clipboard!');
      });
    });

    // Theory Tabs
    theoryTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        theoryTabBtns.forEach(b => b.classList.remove('active'));
        theoryPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // Run initial setup
  init();
});
