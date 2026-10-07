/**
 * Formal Turing Machine Definitions for Unary Operations
 * 
 * Formal 7-Tuple: M = (Q, Σ, Γ, δ, q0, B, F)
 * - Q: Finite set of states
 * - Σ: Input alphabet { '1', 'B' }
 * - Γ: Tape alphabet { '1', 'B', '□', 'X', 'Y' }
 * - δ: Transition function Q × Γ → Q × Γ × { 'L', 'R', 'S' }
 * - q0: Start state
 * - B: Blank symbol '□'
 * - F: Set of final/halting states
 */

const BLANK_SYMBOL = '□';

// Unary Addition Turing Machine
// Problem: Given 1^m B 1^n, compute 1^(m+n)
// Algorithm:
// 1. In q0, scan right over 1s of operand 1 until separator 'B'.
// 2. Replace 'B' with '1' (now tape has m + n + 1 ones). Switch to q1.
// 3. In q1, scan right over 1s of operand 2 until reaching blank '□'.
// 4. Move Left to the rightmost '1', switch to q2.
// 5. In q2, erase the rightmost '1' by writing '□'. Now exactly m + n ones remain! Switch to q3.
// 6. In q3, rewind head left over all 1s until reaching blank '□'.
// 7. Move Right into the first '1' and halt in q_halt (ACCEPT).
const ADDITION_MACHINE = {
  id: 'addition',
  name: 'Unary Addition',
  formula: '1ᵐ B 1ⁿ ⟶ 1ᵐ⁺ⁿ',
  description: 'Simulates unary addition by turning the separator B into 1 and erasing one terminal 1 at the end.',
  startState: 'q0',
  haltState: 'q_halt',
  blankSymbol: BLANK_SYMBOL,
  inputAlphabet: ['1', 'B'],
  tapeAlphabet: ['1', 'B', BLANK_SYMBOL],
  states: [
    { id: 'q0', name: 'q0: Scan Operand 1', desc: 'Scan right over operand 1 until finding separator B' },
    { id: 'q1', name: 'q1: Scan Operand 2', desc: 'Replace B with 1 and scan right over operand 2 until blank □' },
    { id: 'q2', name: 'q2: Erase Terminal 1', desc: 'Move left to rightmost 1 and replace it with blank □' },
    { id: 'q3', name: 'q3: Rewind to Start', desc: 'Rewind left across the result 1s until left boundary □' },
    { id: 'q_halt', name: 'q_halt: Final / Accept', desc: 'Head parked at start of the sum 1ᵐ⁺ⁿ. Computation complete.' }
  ],
  // Transitions table: key is `${state}_${symbol}` -> { nextState, writeSymbol, move, description }
  transitions: {
    // State q0
    [`q0_1`]: {
      nextState: 'q0',
      writeSymbol: '1',
      move: 'R',
      desc: 'Scan right over 1 in operand 1'
    },
    [`q0_B`]: {
      nextState: 'q1',
      writeSymbol: '1',
      move: 'R',
      desc: 'Replace separator B with 1 (bridging operands), move Right'
    },

    // State q1
    [`q1_1`]: {
      nextState: 'q1',
      writeSymbol: '1',
      move: 'R',
      desc: 'Scan right over 1 in operand 2'
    },
    [`q1_${BLANK_SYMBOL}`]: {
      nextState: 'q2',
      writeSymbol: BLANK_SYMBOL,
      move: 'L',
      desc: 'Reached end of input (blank □). Step Left to rightmost 1'
    },

    // State q2
    [`q2_1`]: {
      nextState: 'q3',
      writeSymbol: BLANK_SYMBOL,
      move: 'L',
      desc: 'Erase extra 1 (write □) to adjust count to m+n. Move Left'
    },

    // State q3
    [`q3_1`]: {
      nextState: 'q3',
      writeSymbol: '1',
      move: 'L',
      desc: 'Rewind Left across the sum 1s'
    },
    [`q3_${BLANK_SYMBOL}`]: {
      nextState: 'q_halt',
      writeSymbol: BLANK_SYMBOL,
      move: 'R',
      desc: 'Hit left blank boundary. Step Right to first 1 and HALT'
    }
  }
};

// Unary Multiplication Turing Machine
// Problem: Given 1^m B 1^n, compute 1^(m*n)
// Extended Formal TM Algorithm:
// Alphabet: { '1', 'B', '□', 'X', 'Y' }
// 1. q_init: Traverse right past 1^m and 1^n, write boundary 'B' after 1^n: 1^m B 1^n B. Rewind to start.
// 2. q0: Look for next unmarked '1' in first operand:
//    - Read '1': Mark as 'X', move Right -> q1.
//    - Read 'B': No more '1's in operand 1. Jump to q_cleanup!
// 3. q1: Move right past operand 1 into operand 2 (pass separator 'B') -> q2.
// 4. q2: For each '1' in operand 2:
//    - Read '1': Mark as 'Y', move Right -> q3.
//    - Read 'B': All '1's in operand 2 copied for this X! Jump to q5 (restore Ys).
// 5. q3 & q4: Move right past operand 2, past second 'B', skip existing product '1's to blank '□'.
//    Write '1' in product region, move Left -> q_ret1/q_ret2.
// 6. q_ret: Rewind left back to operand 2 start, resume q2 to find next '1'.
// 7. q5: Rewind across operand 2, converting all 'Y's back to '1's. When reaching first 'B', jump to q6.
// 8. q6: Rewind across operand 1 until finding 'X'. Step Right back to q0!
// 9. q_cleanup: Erase all 'X's, first 'B', second operand '1's, and second 'B'. Park on product and halt!
const MULTIPLICATION_MACHINE = {
  id: 'multiplication',
  name: 'Unary Multiplication',
  formula: '1ᵐ B 1ⁿ ⟶ 1ᵐˣⁿ',
  description: 'Simulates unary multiplication using nested loops: for every 1 in operand 1 (marked X), replicates operand 2 (marked Y) into the product zone, then cleans up.',
  startState: 'q_init',
  haltState: 'q_halt',
  blankSymbol: BLANK_SYMBOL,
  inputAlphabet: ['1', 'B'],
  tapeAlphabet: ['1', 'B', 'X', 'Y', BLANK_SYMBOL],
  states: [
    { id: 'q_init', name: 'q_init: Setup Boundary', desc: 'Scan to right of input and append delimiter B for product accumulator' },
    { id: 'q_rewind_init', name: 'q_rewind_init: Rewind to Start', desc: 'Rewind left to blank boundary before operand 1' },
    { id: 'q0', name: 'q0: Select Next Multiplicand', desc: 'Find next unmarked 1 in operand 1, mark as X, or proceed to cleanup if done' },
    { id: 'q1', name: 'q1: Cross to Multiplier', desc: 'Pass remaining operand 1 and separator B into operand 2' },
    { id: 'q2', name: 'q2: Select Multiplier Unit', desc: 'Find next 1 in operand 2, mark as Y to copy, or reset if all units copied' },
    { id: 'q3', name: 'q3: Cross to Product Zone', desc: 'Move right past operand 2 and second separator B' },
    { id: 'q4', name: 'q4: Write Product Unit', desc: 'Skip existing product 1s to blank □, append 1 to accumulator' },
    { id: 'q_ret', name: 'q_ret: Return to Multiplier', desc: 'Rewind left past product and separator B back to operand 2' },
    { id: 'q5', name: 'q5: Restore Multiplier', desc: 'Reset all Y marks back to 1 for the next cycle' },
    { id: 'q6', name: 'q6: Rewind to Multiplicand', desc: 'Rewind left into operand 1 to find the last X mark' },
    { id: 'q_clean_left', name: 'q_clean_left: Erase Multiplicand', desc: 'Erase all X marks from operand 1' },
    { id: 'q_clean_right', name: 'q_clean_right: Erase Multiplier', desc: 'Erase operand 2 and separators' },
    { id: 'q_halt', name: 'q_halt: Final / Accept', desc: 'Head parked at start of the product 1ᵐˣⁿ. Computation complete.' }
  ],
  transitions: {
    // q_init: Scan right to blank and place boundary B
    [`q_init_1`]: { nextState: 'q_init', writeSymbol: '1', move: 'R', desc: 'Scan right past 1' },
    [`q_init_B`]: { nextState: 'q_init', writeSymbol: 'B', move: 'R', desc: 'Scan right past B' },
    [`q_init_${BLANK_SYMBOL}`]: { nextState: 'q_rewind_init', writeSymbol: 'B', move: 'L', desc: 'Append boundary B after operands, begin rewind' },

    // q_rewind_init: Rewind to start
    [`q_rewind_init_1`]: { nextState: 'q_rewind_init', writeSymbol: '1', move: 'L', desc: 'Rewind past 1' },
    [`q_rewind_init_B`]: { nextState: 'q_rewind_init', writeSymbol: 'B', move: 'L', desc: 'Rewind past B' },
    [`q_rewind_init_${BLANK_SYMBOL}`]: { nextState: 'q0', writeSymbol: BLANK_SYMBOL, move: 'R', desc: 'Hit left blank boundary. Step Right to operand 1' },

    // q0: Check next 1 in operand 1
    [`q0_1`]: { nextState: 'q1', writeSymbol: 'X', move: 'R', desc: 'Mark 1 in operand 1 with X, move to operand 2' },
    [`q0_B`]: { nextState: 'q_clean_left', writeSymbol: BLANK_SYMBOL, move: 'L', desc: 'All operand 1 units processed! Begin tape cleanup' },

    // q1: Move past operand 1 to operand 2
    [`q1_1`]: { nextState: 'q1', writeSymbol: '1', move: 'R', desc: 'Move past remaining 1s in operand 1' },
    [`q1_B`]: { nextState: 'q2', writeSymbol: 'B', move: 'R', desc: 'Cross first separator B into operand 2' },

    // q2: In operand 2, find next 1
    [`q2_Y`]: { nextState: 'q2', writeSymbol: 'Y', move: 'R', desc: 'Skip already-copied Y unit' },
    [`q2_1`]: { nextState: 'q3', writeSymbol: 'Y', move: 'R', desc: 'Mark 1 as Y to copy to product zone' },
    [`q2_B`]: { nextState: 'q5', writeSymbol: 'B', move: 'L', desc: 'All units of operand 2 copied for this X! Reset Y marks' },

    // q3: Move past operand 2 into product zone
    [`q3_1`]: { nextState: 'q3', writeSymbol: '1', move: 'R', desc: 'Move past 1 in operand 2' },
    [`q3_Y`]: { nextState: 'q3', writeSymbol: 'Y', move: 'R', desc: 'Move past Y in operand 2' },
    [`q3_B`]: { nextState: 'q4', writeSymbol: 'B', move: 'R', desc: 'Cross second separator B into product zone' },

    // q4: In product zone, find blank and write 1
    [`q4_1`]: { nextState: 'q4', writeSymbol: '1', move: 'R', desc: 'Skip existing product 1' },
    [`q4_${BLANK_SYMBOL}`]: { nextState: 'q_ret', writeSymbol: '1', move: 'L', desc: 'Append 1 to product zone! Move Left to return' },

    // q_ret: Rewind left back to operand 2
    [`q_ret_1`]: { nextState: 'q_ret', writeSymbol: '1', move: 'L', desc: 'Rewind past product 1' },
    [`q_ret_B`]: { nextState: 'q_ret_search', writeSymbol: 'B', move: 'L', desc: 'Cross second separator B back into operand 2' },

    // q_ret_search: Move left across operand 2 until first separator B
    [`q_ret_search_1`]: { nextState: 'q_ret_search', writeSymbol: '1', move: 'L', desc: 'Rewind past 1 in operand 2' },
    [`q_ret_search_Y`]: { nextState: 'q_ret_search', writeSymbol: 'Y', move: 'L', desc: 'Rewind past Y in operand 2' },
    [`q_ret_search_B`]: { nextState: 'q2', writeSymbol: 'B', move: 'R', desc: 'Hit first separator B. Step Right to scan next unit in operand 2' },

    // q5: Restore all Ys back to 1s in operand 2
    [`q5_Y`]: { nextState: 'q5', writeSymbol: '1', move: 'L', desc: 'Restore Y mark back to 1' },
    [`q5_1`]: { nextState: 'q5', writeSymbol: '1', move: 'L', desc: 'Move left across 1 in operand 2' },
    [`q5_B`]: { nextState: 'q6', writeSymbol: 'B', move: 'L', desc: 'Cross first separator B back into operand 1' },

    // q6: In operand 1, rewind until finding X
    [`q6_1`]: { nextState: 'q6', writeSymbol: '1', move: 'L', desc: 'Rewind past 1 in operand 1' },
    [`q6_X`]: { nextState: 'q0', writeSymbol: 'X', move: 'R', desc: 'Found last X mark. Step Right to test next unit' },

    // q_clean_left: Erase all X marks in operand 1
    [`q_clean_left_X`]: { nextState: 'q_clean_left', writeSymbol: BLANK_SYMBOL, move: 'L', desc: 'Erase X mark from operand 1' },
    [`q_clean_left_${BLANK_SYMBOL}`]: { nextState: 'q_clean_right', writeSymbol: BLANK_SYMBOL, move: 'R', desc: 'All X marks erased. Move right to clean operand 2' },

    // q_clean_right: Erase operand 2 and second B
    [`q_clean_right_${BLANK_SYMBOL}`]: { nextState: 'q_clean_right', writeSymbol: BLANK_SYMBOL, move: 'R', desc: 'Skip erased blank' },
    [`q_clean_right_1`]: { nextState: 'q_clean_right', writeSymbol: BLANK_SYMBOL, move: 'R', desc: 'Erase operand 2 symbol 1' },
    [`q_clean_right_B`]: { nextState: 'q_halt_park', writeSymbol: BLANK_SYMBOL, move: 'R', desc: 'Erase second separator B. Move into product zone' },

    // q_halt_park: Park head on first 1 of product
    [`q_halt_park_${BLANK_SYMBOL}`]: { nextState: 'q_halt', writeSymbol: BLANK_SYMBOL, move: 'S', desc: 'Product is zero or empty. Halt' },
    [`q_halt_park_1`]: { nextState: 'q_halt', writeSymbol: '1', move: 'S', desc: 'Head parked at start of product 1ᵐˣⁿ. HALT' }
  }
};

window.TM_MACHINES = {
  addition: ADDITION_MACHINE,
  multiplication: MULTIPLICATION_MACHINE,
  BLANK_SYMBOL: BLANK_SYMBOL
};
