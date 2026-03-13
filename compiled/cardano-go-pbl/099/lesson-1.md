# Find and Fix Bugs in a Go Program Using Debugging Tools

In this lesson, you will use a practical debugging workflow for Go code: reproduce the bug, narrow the scope, inspect state, and confirm the fix. You will work with built-in Go tooling (`go test`, `go test -race`, `go vet`) and `delve` for step debugging.

## Prerequisites

- Go 1.21+ installed
- Terminal access
- Basic familiarity with functions, tests, and structs in Go

## What You Will Learn

1. How to classify common Go bugs quickly
2. How to reproduce failures with tests before changing code
3. How to inspect state with `dlv` and verify concurrency issues with `-race`
4. How to confirm fixes using a repeatable checklist

## Debugging Workflow

Use this sequence every time:

1. Reproduce the bug reliably
2. Write or run a failing test
3. Add minimal instrumentation (logs or temporary assertions)
4. Step through with `dlv` if state is unclear
5. Run static checks (`go vet`)
6. Run race checks (`go test -race`) when concurrency is involved
7. Apply a minimal fix and rerun the full suite

## Step-by-Step Practice

### Step 1: Reproduce a Failure

Run tests with verbose output:

```bash
go test ./... -v
```

If tests pass but behavior is still wrong, create a focused test for the bug before editing production code.

### Step 2: Isolate the Failing Case

Run only one test while iterating:

```bash
go test ./... -run TestName -v
```

This keeps feedback tight and avoids noisy output.

### Step 3: Use the Race Detector

For flakes, crashes, or odd shared-state behavior:

```bash
go test ./... -race
```

If a race is reported, fix synchronization before anything else. Race warnings indicate undefined behavior and can invalidate other debugging results.

### Step 4: Run Static Analysis

Use `go vet` to catch suspicious patterns:

```bash
go vet ./...
```

`go vet` does not prove correctness, but it often catches issues early (format string mistakes, unreachable code patterns, copied lock values, etc.).

### Step 5: Step Debug with Delve

Run a test under `delve`:

```bash
dlv test ./path/to/pkg -- -test.run TestName
```

Useful commands inside `dlv`:

```text
b file.go:42      # set breakpoint
c                 # continue
n                 # next line
s                 # step into
p variableName    # print variable
bt                # backtrace
```

Focus on one question at a time: "What value is wrong?" then "Where did it become wrong?"

### Step 6: Apply Minimal Fix and Confirm

After fixing, run the validation sequence:

```bash
go test ./...
go test ./... -race
go vet ./...
```

If all pass, you have a high-confidence fix.

## Common Bug Patterns in Go

- Nil pointer dereference: usually missed initialization or unchecked error
- Off-by-one loops: index logic errors in slices/arrays
- Ignored errors: `_` assignment hides real failure causes
- Goroutine leaks: work started but never canceled or joined
- Data races: unsynchronized read/write on shared memory

## You'll Know You're Successful When

- You can make a bug fail on demand
- You can explain root cause in one sentence
- You can show the exact test that protects against regression
- `go test`, `go test -race`, and `go vet` all pass after the fix

## Practice Tasks

1. Create a small failing unit test for a logic bug, then fix it.
2. Introduce a deliberate data race in a toy program, detect it with `-race`, and fix it with proper synchronization.
3. Use `dlv` to inspect a variable through multiple function calls and identify where it diverges from expectation.

## Next Steps

- Continue to SLT 099.2 to strengthen type-system debugging and design.
- Reuse this workflow in Module 301 when debugging performance and runtime behavior.
