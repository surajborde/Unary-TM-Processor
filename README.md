# Unary Mathematical Processor — Turing Machine Simulator
> **College Project: Theoretical Computer Science / Formal Languages & Automata Theory**  
> *A 100% Client-Side, Interactive Turing Machine Simulation for Unary Arithmetic Operations*

---

## 📌 Executive Summary & Objectives

The **Unary Mathematical Processor** is an interactive, browser-based simulator for deterministic single-tape **Turing Machines (TM)** designed to perform arithmetic operations in the **unary (base-1)** numeral system. 

Unlike basic calculators that merely compute values mathematically and present the answer, this application performs an authentic, formal **step-by-step state machine simulation**. The user observes every micro-transition $\delta(q, \sigma) = (q', \sigma', D)$, cell rewrite, tape movement, and state change in real time.

---

## 🚀 Key Features

1. **Dual Operation Modes**:
   - **Unary Addition**: Computes $1^m B 1^n \longrightarrow 1^{m+n}$ using the standard "Bridge & Erase" algorithm ($O(m+n)$ time, $O(1)$ auxiliary space).
   - **Unary Multiplication**: Computes $1^m B 1^n \longrightarrow 1^{m \times n}$ using nested replication loops and accumulator cleanup.

2. **Rigorous Input Validation**:
   - Strictly enforces the formal language format $L = \{ 1^m B 1^n \mid m \ge 1, n \ge 1 \}$.
   - Detects and rejects invalid inputs with clear contextual error messages:
     - Invalid digits/characters (e.g., `112B11`, `abc`)
     - Missing or multiple separators (e.g., `111`, `111BB11`)
     - Missing operands (e.g., leading `B111` or trailing `111B`)

3. **Virtual Mechanical Turing Tape**:
   - Infinite bilateral tape with index markers $(\dots, -2, -1, 0, 1, 2, 3, \dots)$.
   - Visually prominent mechanical head with glowing pointer, current state display, and active cell highlight.
   - Distinct color themes for symbols: `1` (Digit), `B` (Separator), `□` (Blank), `X` / `Y` (Marked operands in multiplication).
   - Auto-centering and smooth horizontal tracking.

4. **Real-Time Telemetry HUD**:
   - **Current State**: $q_0, q_1, q_2, q_3, q_{\text{halt}}$, etc.
   - **Read Symbol**: The symbol currently under the head.
   - **Head Position**: Integer tape index coordinate.
   - **Cycle / Step Count**: Total executed clock transitions.
   - **Transition Action**: Full formal transition string $\delta(q, \sigma) \to (q', \sigma', D)$ with plain-English explanation.
   - **Machine Status**: `READY`, `RUNNING`, `PAUSED`, `HALTED (ACCEPT)`, `ERROR / REJECT`.

5. **Interactive State Transition Matrix $\delta(Q, \Gamma)$**:
   - Complete 2D transition table showing all defined state-symbol mappings.
   - **Active Cell Glow**: The exact transition being evaluated pulses in bright neon amber/cyan in real time.
   - Accompanying state dictionary explaining each state's objective.

6. **Full Playback & Execution Controls**:
   - **Start / Run**: Automatic stepping with smooth animation.
   - **Single Step**: Step through one transition at a time for classroom or viva demonstrations.
   - **Pause / Stop**: Halt simulation mid-stream.
   - **Reset**: Reloads initial input onto tape, resetting head and step counter.
   - **Run to End (⚡ Fast-Forward)**: Executes to completion instantly and summarizes results.
   - **Speed Slider**: Real-time speed adjustment from 30ms (ultra-fast) to 1000ms (slow motion).
   - **Sound Effects Toggle**: Gentle synthesized audio tones using Web Audio API for head movement, writing, and completion chimes.

7. **Test Cases & Presets Suite**:
   - Clickable presets for addition (`1B1`, `11B1`, `111B11`, `1111B11`, `1111B111`).
   - Clickable presets for multiplication (`11B11`, `111B11`).
   - Clickable invalid cases (`112B11`, `111BB11`, `B111`, `111B`, `abc`, `111`) to demonstrate the validator.

8. **Mathematical Verification & Result Panel**:
   - Displays raw input, formal arithmetic expression, final unary output, and decimal tally verification.
   - Complexity statistics: total steps taken and tape cells utilized.

9. **Comprehensive Theory & Algorithm Documentation**:
   - Built-in educational tabs explaining unary notation, the 7-tuple model, addition algorithm, multiplication algorithm, and state dictionaries.

---

## 📐 Formal Automata Specifications

### 1. Formal 7-Tuple Model
A deterministic single-tape Turing Machine is formally defined as:
$$M = (Q, \Sigma, \Gamma, \delta, q_0, B, F)$$

Where:
- $Q$: Finite set of control states.
- $\Sigma = \{1, B\}$: Input alphabet.
- $\Gamma = \{1, B, \square, X, Y\}$: Tape alphabet (includes input symbols, blank $\square$, and helper markers).
- $\delta: Q \times \Gamma \to Q \times \Gamma \times \{L, R, S\}$: Transition function.
- $q_0 \in Q$: Start state.
- $B = \square$: Blank symbol.
- $F = \{q_{\text{halt}}\}$: Set of final / accepting states.

---

### 2. Unary Addition Algorithm
**Input:** $1^m B 1^n$ (e.g., `111B11` $\to 3 + 2$)  
**Output:** $1^{m+n}$ (e.g., `11111` $\to 5$)

#### Algorithm Phases:
1. **Bridging Phase ($q_0$):**
   - The head starts on the leftmost `1` of operand 1.
   - Scans right over `1`s until reading the separator `B`.
   - Replaces `B` with `1`, bridging the two operands into a contiguous block of $(m + 1 + n)$ ones.
   - Transitions to state $q_1$ and moves Right.
2. **Terminal Scan Phase ($q_1$):**
   - Scans right over the second operand's `1`s until reading the first blank cell $\square$.
   - Transitions to state $q_2$ and moves Left to point at the rightmost `1`.
3. **Balancing Phase ($q_2$):**
   - Replaces the rightmost `1` with blank $\square$.
   - This subtracts the extra `1` introduced during Phase 1, leaving exactly $m + n$ ones!
   - Transitions to state $q_3$ and moves Left.
4. **Rewind & Park Phase ($q_3$):**
   - Rewinds left over all remaining `1`s until reading the left boundary blank $\square$.
   - Moves one step Right to park cleanly on the first `1` of the result.
   - Transitions to $q_{\text{halt}}$ (ACCEPT).

#### Transition Table for Addition:
| State | Read '1' | Read 'B' | Read '□' (Blank) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **q0** | $(q_0, 1, R)$ | $(q_1, 1, R)$ | — | Scan operand 1; replace $B$ with $1$ |
| **q1** | $(q_1, 1, R)$ | — | $(q_2, \square, L)$ | Scan operand 2 until right blank |
| **q2** | $(q_3, \square, L)$ | — | — | Erase terminal $1$ to balance count |
| **q3** | $(q_3, 1, L)$ | — | $(q_{\text{halt}}, \square, R)$ | Rewind left to start of result |
| **q_halt** | — | — | — | Halt & Accept |

---

### 3. Unary Multiplication Algorithm
**Input:** $1^m B 1^n$ (e.g., `11B111` $\to 2 \times 3$)  
**Output:** $1^{m \times n}$ (e.g., `111111` $\to 6$)

#### Algorithm Overview:
Multiplication is computed via repeated addition:
1. **$q_{\text{init}}$:** Append a second delimiter `B` after the input: $1^m B 1^n B \square$. Rewind to start.
2. **$q_0$ (Outer Loop):** Pick the next unmarked `1` in operand 1 and mark it as `X`. If all 1s are marked (reads `B`), proceed to tape cleanup.
3. **$q_1 \to q_2$ (Inner Loop):** Move into operand 2. For each unmarked `1`:
   - Mark as `Y`.
   - Travel to the product zone (past the second `B`) and append a `1` to the product accumulator.
   - Return to operand 2 and find the next unmarked `1`.
4. **$q_5 \to q_6$ (Reset):** Once all 1s of operand 2 are processed, restore all `Y` marks back to `1`, rewind to the first operand, and repeat for the next `X`.
5. **$q_{\text{clean\_left}} \to q_{\text{clean\_right}}$:** Erase `X` marks, separators, and operand 2. Park on the first `1` of the product and halt in $q_{\text{halt}}$.

---

## 📁 Project Structure

```
Unary-TM-Processor/
├── index.html           # Main semantic HTML5 interface
├── css/
│   └── style.css        # Dark technical AI theme, animations, HUD layout
├── js/
│   ├── machines.js      # Formal TM transition tables & state definitions
│   ├── turing-machine.js# Pure deterministic TM simulation engine
│   ├── sound.js         # Web Audio API synthesized sound generator
│   └── app.js           # UI event controllers, tape renderer, animations
└── README.md            # Comprehensive project documentation & theory
```

---

## 🛠️ How to Run the Project

### Option 1: Direct File Launch (No Server Needed)
Simply double-click [`index.html`](file:///Users/surajborde/Unary-TM-Processor/index.html) or open it in any modern browser (Chrome, Firefox, Safari, Edge).
- **Zero backend required.**
- **Zero build steps required.**
- **Zero npm dependencies required.**

### Option 2: Using Any Lightweight HTTP Server
If running via a local web server:
```bash
# Using Python 3:
python3 -m http.server 8080

# Or using Node.js:
npx serve .
```
Then navigate to `http://localhost:8080`.

---

## 🧪 Verification & Test Cases

| Input | Meaning | Machine | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| `1B1` | $1 + 1$ | Addition | `11` (2) | Verified ✓ |
| `11B1` | $2 + 1$ | Addition | `111` (3) | Verified ✓ |
| `111B11` | $3 + 2$ | Addition | `11111` (5) | Verified ✓ |
| `1111B11` | $4 + 2$ | Addition | `111111` (6) | Verified ✓ |
| `1111B111` | $4 + 3$ | Addition | `1111111` (7) | Verified ✓ |
| `11B11` | $2 \times 2$ | Multiplication | `1111` (4) | Verified ✓ |
| `111B11` | $3 \times 2$ | Multiplication | `111111` (6) | Verified ✓ |
| `112B11` | Invalid character '2' | Validator | Rejected with descriptive error | Verified ✓ |
| `111BB11` | Double separator 'BB' | Validator | Rejected with descriptive error | Verified ✓ |
| `B111` | Missing operand 1 | Validator | Rejected with descriptive error | Verified ✓ |
| `111B` | Missing operand 2 | Validator | Rejected with descriptive error | Verified ✓ |
| `abc` | Non-unary letters | Validator | Rejected with descriptive error | Verified ✓ |

---

## 🎓 Academic Demonstration Highlights
- **Theoretical Rigor**: Directly aligns with standard textbooks (*Introduction to Automata Theory, Languages, and Computation* by Hopcroft, Motwani & Ullman; *Introduction to the Theory of Computation* by Michael Sipser).
- **Interactive State Matrix**: Evaluators can watch the active cell in the transition matrix light up on every clock cycle.
- **Copyable Trace Log**: Step-by-step logs can be copied directly to the clipboard for lab records or report submission.
- **Professional Aesthetics**: Sleek dark lab theme with glowing HUD indicators and authentic mechanical tape presentation.
