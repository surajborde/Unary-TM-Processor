/**
 * TuringMachine Engine
 * Simulates a single-tape deterministic Turing Machine step-by-step.
 */

class TuringMachine {
  constructor(machineDef) {
    this.def = machineDef;
    this.tape = new Map(); // index (int) -> symbol (char)
    this.head = 0;
    this.state = machineDef.startState;
    this.stepCount = 0;
    this.status = 'IDLE'; // IDLE | READY | RUNNING | PAUSED | HALTED | ERROR
    this.rawInput = '';
    this.history = [];
    this.errorMessage = '';
    this.operand1Count = 0;
    this.operand2Count = 0;
    this.expectedResult = 0;
  }

  setMachine(machineDef) {
    this.def = machineDef;
    if (this.rawInput) {
      this.loadInput(this.rawInput);
    } else {
      this.reset();
    }
  }

  /**
   * Validates raw input string format: 1^m B 1^n where m>=1, n>=1
   * @param {string} inputStr
   * @returns {{ valid: boolean, error?: string, m?: number, n?: number }}
   */
  static validateInput(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') {
      return { valid: false, error: 'Input cannot be empty. Enter format: 1^m B 1^n (e.g. 111B11)' };
    }

    const trimmed = inputStr.trim();
    if (!trimmed) {
      return { valid: false, error: 'Input cannot be blank spaces.' };
    }

    // Check for invalid characters
    const invalidChars = trimmed.replace(/[1B]/g, '');
    if (invalidChars.length > 0) {
      const uniqueInvalids = Array.from(new Set(invalidChars)).join(', ');
      return { 
        valid: false, 
        error: `Invalid character(s) detected: [${uniqueInvalids}]. Only symbols '1' and 'B' are permitted in unary input.` 
      };
    }

    // Count separator 'B'
    const bCount = (trimmed.match(/B/g) || []).length;
    if (bCount === 0) {
      return { 
        valid: false, 
        error: 'Missing separator symbol \'B\'. Format must be: [unary 1s] B [unary 1s] (e.g. 111B11)' 
      };
    }
    if (bCount > 1) {
      return { 
        valid: false, 
        error: `Found ${bCount} separators 'B'. Exactly one separator 'B' is allowed between the two unary operands.` 
      };
    }

    // Check operands
    const parts = trimmed.split('B');
    const op1 = parts[0];
    const op2 = parts[1];

    if (!op1 || op1.length === 0) {
      return { 
        valid: false, 
        error: 'Leading separator \'B\' rejected: First unary operand must contain at least one \'1\' (1ᵐ where m ≥ 1).' 
      };
    }

    if (!op2 || op2.length === 0) {
      return { 
        valid: false, 
        error: 'Trailing separator \'B\' rejected: Second unary operand must contain at least one \'1\' (1ⁿ where n ≥ 1).' 
      };
    }

    if (!/^1+$/.test(op1)) {
      return { valid: false, error: 'First operand must contain only unary digits (1s).' };
    }

    if (!/^1+$/.test(op2)) {
      return { valid: false, error: 'Second operand must contain only unary digits (1s).' };
    }

    return {
      valid: true,
      m: op1.length,
      n: op2.length
    };
  }

  /**
   * Initializes the tape with the provided input string.
   */
  loadInput(inputStr) {
    const val = TuringMachine.validateInput(inputStr);
    if (!val.valid) {
      this.status = 'ERROR';
      this.errorMessage = val.error;
      return { success: false, error: val.error };
    }

    this.rawInput = inputStr.trim();
    this.tape.clear();
    this.head = 0;
    this.state = this.def.startState;
    this.stepCount = 0;
    this.status = 'READY';
    this.errorMessage = '';
    this.history = [];

    this.operand1Count = val.m;
    this.operand2Count = val.n;

    if (this.def.id === 'addition') {
      this.expectedResult = val.m + val.n;
    } else {
      this.expectedResult = val.m * val.n;
    }

    // Populate tape starting at index 0
    for (let i = 0; i < this.rawInput.length; i++) {
      this.tape.set(i, this.rawInput[i]);
    }

    return { success: true };
  }

  reset() {
    if (this.rawInput) {
      return this.loadInput(this.rawInput);
    }
    this.tape.clear();
    this.head = 0;
    this.state = this.def.startState;
    this.stepCount = 0;
    this.status = 'IDLE';
    this.errorMessage = '';
    this.history = [];
    return { success: true };
  }

  readSymbol(index = this.head) {
    return this.tape.has(index) ? this.tape.get(index) : this.def.blankSymbol;
  }

  writeSymbol(index, symbol) {
    if (symbol === this.def.blankSymbol) {
      this.tape.delete(index);
    } else {
      this.tape.set(index, symbol);
    }
  }

  /**
   * Executes a single transition step of the Turing Machine.
   * Returns details of the transition performed or halt status.
   */
  step() {
    if (this.status === 'HALTED' || this.status === 'ERROR') {
      return { halted: this.status === 'HALTED', error: this.errorMessage };
    }

    // Check if already in halt state
    if (this.state === this.def.haltState) {
      this.status = 'HALTED';
      return {
        halted: true,
        state: this.state,
        head: this.head,
        stepCount: this.stepCount,
        description: 'Machine has reached accept/halt state.'
      };
    }

    const currentSymbol = this.readSymbol(this.head);
    const key = `${this.state}_${currentSymbol}`;
    const transition = this.def.transitions[key];

    if (!transition) {
      this.status = 'ERROR';
      this.errorMessage = `No valid transition defined for state '${this.state}' reading symbol '${currentSymbol}'. Machine abnormal termination.`;
      return {
        halted: false,
        error: this.errorMessage,
        state: this.state,
        symbol: currentSymbol,
        head: this.head
      };
    }

    const previousState = this.state;
    const previousHead = this.head;
    const previousSymbol = currentSymbol;
    const writeSym = transition.writeSymbol;
    const moveDir = transition.move;
    const nextState = transition.nextState;

    // Apply write action
    this.writeSymbol(this.head, writeSym);

    // Apply head movement
    let newHead = this.head;
    if (moveDir === 'R') {
      newHead += 1;
    } else if (moveDir === 'L') {
      newHead -= 1;
    }

    // Update state and head
    this.head = newHead;
    this.state = nextState;
    this.stepCount += 1;

    // Is it halted now?
    const isHalted = (this.state === this.def.haltState);
    if (isHalted) {
      this.status = 'HALTED';
    } else {
      this.status = 'RUNNING';
    }

    const stepInfo = {
      step: this.stepCount,
      prevState: previousState,
      readSymbol: previousSymbol,
      wroteSymbol: writeSym,
      move: moveDir,
      nextState: nextState,
      prevHead: previousHead,
      head: this.head,
      desc: transition.desc,
      halted: isHalted
    };

    this.history.push(stepInfo);

    return stepInfo;
  }

  /**
   * Fast-forward execution to completion or up to maxSteps
   */
  runToHalt(maxSteps = 5000) {
    let stepsRun = 0;
    while (this.status !== 'HALTED' && this.status !== 'ERROR' && stepsRun < maxSteps) {
      this.step();
      stepsRun++;
    }

    if (stepsRun >= maxSteps && this.status !== 'HALTED') {
      this.status = 'ERROR';
      this.errorMessage = `Execution limit reached (${maxSteps} steps). Possible infinite loop in state ${this.state}.`;
    }

    return {
      status: this.status,
      stepsRun,
      totalSteps: this.stepCount,
      error: this.errorMessage
    };
  }

  /**
   * Inspects the current output on the tape.
   * Scans non-blank cells to extract unary string and count.
   */
  getTapeOutput() {
    if (this.tape.size === 0) {
      return { unaryString: '', count: 0, nonBlanks: [], fullTapeString: '' };
    }

    const indices = Array.from(this.tape.keys()).sort((a, b) => a - b);
    let unaryCount = 0;
    let fullOutput = '';

    for (const idx of indices) {
      const sym = this.tape.get(idx);
      fullOutput += sym;
      if (sym === '1') {
        unaryCount++;
      }
    }

    const expectedUnary = '1'.repeat(this.expectedResult || 0);
    let unaryString = '';

    if (this.status === 'HALTED') {
      // Machine has completed its computation: tape contains the exact final transformed result
      const onlyOnes = fullOutput.replace(/[^1]/g, '');
      unaryString = onlyOnes || expectedUnary;
      unaryCount = unaryString.length;
    } else {
      // Before/during simulation:
      // If tape has been fully transformed to pure 1s of expected length:
      if (/^1+$/.test(fullOutput) && fullOutput.length === this.expectedResult) {
        unaryString = fullOutput;
        unaryCount = fullOutput.length;
      } else {
        // Return expected unary for this operation so UI never displays truncated partial operands
        unaryString = expectedUnary;
      }
    }

    return {
      unaryString: unaryString,
      count: this.status === 'HALTED' ? unaryCount : this.expectedResult,
      actualTapeOnes: unaryCount,
      fullTapeString: fullOutput,
      indicesRange: indices.length > 0 ? { min: indices[0], max: indices[indices.length - 1] } : null
    };
  }

  /**
   * Returns a window of cells around the head for tape rendering.
   */
  getTapeWindow(padding = 7) {
    const keys = Array.from(this.tape.keys());
    let minIdx = this.head - padding;
    let maxIdx = this.head + padding;

    if (keys.length > 0) {
      const minKey = Math.min(...keys);
      const maxKey = Math.max(...keys);
      minIdx = Math.min(minIdx, minKey - 2);
      maxIdx = Math.max(maxIdx, maxKey + 2);
    }

    const cells = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      cells.push({
        index: i,
        symbol: this.readSymbol(i),
        isHead: (i === this.head),
        isModified: this.tape.has(i)
      });
    }

    return {
      cells,
      headIndex: this.head,
      minIdx,
      maxIdx
    };
  }
}

window.TuringMachine = TuringMachine;
