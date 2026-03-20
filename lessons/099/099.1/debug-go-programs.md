# Find and Fix a Go Bug by Following the Evidence

In this lesson, you will debug one small Go program all the way from a wrong result to a verified fix. The program calculates the balance of a Cardano address from a slice of UTxOs. Instead of starting with a list of tools, you will start with a broken result and use each tool only when it answers a specific question.

## Prerequisites

- Go 1.21+
- Terminal access
- Basic familiarity with Go functions, structs, and tests

## What You Will Learn

1. How to turn a vague bug report into a reproducible failing test
2. How to narrow a Go bug before changing code
3. How to inspect live state with `dlv`
4. When `go vet` and `go test -race` are useful, and when they are not

## The Problem

Suppose you have a small service that should total the lovelace held by one address.

We will keep one running system for the whole lesson:

```text
Address -> Loader -> []UTxO -> BalanceService -> Total balance
```

The domain model is simple:

```go
type UTxO struct {
    TxHash   string
    Index    uint32
    Lovelace int64
}
```

Here is the buggy service:

```go
type BalanceService struct{}

func (s BalanceService) Total(utxos []UTxO) int64 {
    var total int64
    for _, utxo := range utxos {
        total = utxo.Lovelace
    }
    return total
}
```

If the address has three UTxOs worth `2_000_000`, `3_000_000`, and `5_000_000` lovelace, the correct total is `10_000_000`. This code returns `5_000_000`.

That is a good debugging problem because:

- the result is clearly wrong
- the program is small enough to inspect directly
- the same workflow scales to larger services later

## Step-by-Step Practice

### Step 1: Reproduce the Bug with a Focused Test

Do not start by editing production code. First, make the failure repeatable:

```go
func TestBalanceServiceTotal(t *testing.T) {
    svc := BalanceService{}

    utxos := []UTxO{
        {TxHash: "a", Index: 0, Lovelace: 2_000_000},
        {TxHash: "b", Index: 1, Lovelace: 3_000_000},
        {TxHash: "c", Index: 2, Lovelace: 5_000_000},
    }

    got := svc.Total(utxos)
    want := int64(10_000_000)

    if got != want {
        t.Fatalf("got %d, want %d", got, want)
    }
}
```

Run only the test that proves the bug:

```bash
go test ./... -run TestBalanceServiceTotal -v
```

This first step answers one question: "Can I make the bug fail on demand?"

If the answer is no, you are not ready to debug yet.

### Step 2: Try the Smallest Possible Observation

Your first attempt should be small and temporary.

For example, you might log the value seen in each loop iteration:

```go
func (s BalanceService) Total(utxos []UTxO) int64 {
    var total int64
    for _, utxo := range utxos {
        fmt.Println("before:", total, "current:", utxo.Lovelace)
        total = utxo.Lovelace
    }
    return total
}
```

This often tells you enough to spot a simple bug. Here it reveals that `total` is being replaced on each loop instead of increased.

That is a useful first move because it is cheap. It becomes a weak move when:

- the function is called too many times
- the bad value appears long before the failure shows up
- you need to inspect state across several stack frames

### Step 3: Use `dlv` When the Value Path Is Unclear

When one print statement is not enough, stop guessing and inspect the program state directly.

`dlv` is Delve, the standard debugger used with Go programs. It lets you pause execution, inspect variables, and move through code one line at a time.

You usually need to install it yourself:

```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

After installation, make sure your Go bin directory is on your `PATH` so the `dlv` command is available in the terminal.

Run the test under Delve:

```bash
dlv test ./path/to/pkg -- -test.run TestBalanceServiceTotal
```

Inside `dlv`, set a breakpoint on the loop and step through one iteration at a time:

```text
b balance.go:8
c
n
p total
p utxo
```

Just enough command background for this lesson:

- `b balance.go:8` sets a breakpoint, which means "pause when execution reaches this line"
- `c` continues running until the next breakpoint
- `n` runs the next line without diving into another function call
- `p total` prints the current value of `total`

Questions to answer while stepping:

1. What is `total` before this line runs?
2. What is `utxo.Lovelace` on this iteration?
3. Does the line update `total` the way I expect?

That is the real value of a debugger in Go. It is not for "debugging in general." It is for answering a precise state question when logs are no longer enough.

### Step 4: Apply the Smallest Correct Fix

Once the root cause is visible, fix only that behavior:

```go
func (s BalanceService) Total(utxos []UTxO) int64 {
    var total int64
    for _, utxo := range utxos {
        total += utxo.Lovelace
    }
    return total
}
```

Run the same focused test again:

```bash
go test ./... -run TestBalanceServiceTotal -v
```

Only after the targeted test passes should you widen validation:

```bash
go test ./...
```

## Weak vs Better Debugging Moves

Weak move:

- Read the code, guess the bug, and edit immediately.

Better move:

- Write or run one failing test, inspect the wrong state, then change only the code that caused it.

Why the second approach is better:

- you know the bug was real before the fix
- you have a regression test after the fix
- you avoid mixing diagnosis with random code changes

## When to Use `go vet` and `go test -race`

These tools are important, but they answer specific questions.

Use `go vet` when you suspect suspicious code patterns such as:

- bad format strings
- copied lock values
- unreachable or mistaken constructs that static analysis can spot

Run:

```bash
go vet ./...
```

Use `go test -race` when the bug smells like shared-state trouble:

- flaky tests
- inconsistent totals across runs
- goroutines reading and writing the same data

Run:

```bash
go test ./... -race
```

In this lesson's bug, `-race` is not the main tool because the problem is deterministic and local. That is the rule of thumb:

- use `go test` to reproduce the bug
- use `dlv` when the state path is unclear
- use `go vet` for suspicious code patterns
- use `-race` for concurrency symptoms

## Rule of Thumb

Do not open with every Go debugging tool at once.

Start with the smallest question you can answer:

1. Can I reproduce the bug?
2. Which value is wrong?
3. Where does it become wrong?
4. Which tool answers that specific question fastest?

That sequence is more reliable than memorizing a checklist.

## You'll Know You're Successful When

- You can turn a wrong balance result into a failing test before editing code
- You can explain why the bug returned the last UTxO amount instead of the total
- You can use `dlv` to inspect `total` and `utxo` inside the loop
- You know when `go vet` and `go test -race` are relevant and when they are not

## Practice Tasks

1. Change the bug so the function skips the first UTxO, then write a test that proves the new failure before fixing it.
2. Modify `Total` to return `(int64, error)` and add a bug where an error is ignored. Use a test to catch it, then confirm the fix.
3. Build a version of the balance calculation that uses goroutines and a shared accumulator without synchronization. Run `go test -race`, then fix the race.

## Next Steps

- Continue to lesson `099.2`, where you improve the design of the same balance-calculation code once it is correct.
- Reuse this debugging workflow in later modules when your programs become concurrent, networked, or harder to inspect by sight alone.
