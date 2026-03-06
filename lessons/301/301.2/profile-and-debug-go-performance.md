# Use Go Profiling and Debugging Tools for Performance and Runtime Issues

In this lesson, you will diagnose runtime and performance problems in Go using `pprof`, benchmarks, tracing, and targeted debugging. The goal is to move from "it feels slow" to evidence-based fixes.

## Prerequisites

- Go 1.21+
- Familiarity with `go test`
- Basic understanding of goroutines and memory allocation

## What You Will Learn

1. How to capture CPU and memory profiles
2. How to benchmark critical code paths
3. How to use tracing for concurrency and scheduling insights
4. How to verify improvements without regressions

## Performance Debug Workflow

1. Define a measurable symptom (latency, CPU, memory, throughput)
2. Reproduce under controlled conditions
3. Capture profile/trace data
4. Identify top contributors
5. Apply one focused optimization
6. Re-measure and compare

## Step-by-Step Commands

### Step 1: Run Benchmarks

```bash
go test ./... -bench=. -benchmem
```

This gives baseline timing and allocation counts.

### Step 2: Capture CPU Profile

```bash
go test ./path/to/pkg -bench=BenchmarkHotPath -cpuprofile=cpu.out
```

Inspect profile:

```bash
go tool pprof -http=:0 cpu.out
```

Focus on cumulative time (`cum`) and hot call paths.

### Step 3: Capture Memory Profile

```bash
go test ./path/to/pkg -bench=BenchmarkHotPath -memprofile=mem.out

go tool pprof -http=:0 mem.out
```

Prioritize high-allocation paths in tight loops.

### Step 4: Use Execution Trace

```bash
go test ./path/to/pkg -run TestCriticalFlow -trace=trace.out
go tool trace trace.out
```

Trace helps uncover:

- Scheduler delays
- Goroutine contention
- Blocking on channels or mutexes
- Long GC pauses relative to workload

### Step 5: Validate Functional Correctness

After optimization:

```bash
go test ./...
```

Optimization without correctness is a regression.

## High-Value Optimization Targets

- Avoid repeated allocations in loops
- Reuse buffers where safe
- Reduce lock contention by narrowing critical sections
- Remove unnecessary reflection or conversions
- Batch expensive I/O operations

## Common Profiling Mistakes

- Optimizing before establishing a baseline
- Chasing low-impact hot spots outside target flows
- Comparing benchmark runs with different inputs/environments
- Ignoring variance and claiming tiny deltas as wins

## You'll Know You're Successful When

- You can show before/after benchmark numbers
- You can explain one root cause from a profile
- You can trace a runtime stall to a concrete blocking point
- Tests remain green after optimization changes

## Practice Tasks

1. Add a benchmark to one package in this repo and record baseline `ns/op` and `allocs/op`.
2. Use `pprof` to identify the hottest function and reduce its allocation count.
3. Capture a trace for one concurrency-heavy flow and document one actionable finding.

## Next Steps

- Apply this workflow to cross-stack debugging in SLT 301.1.
- Keep profile artifacts (`cpu.out`, `mem.out`, `trace.out`) attached to performance PRs for review.
