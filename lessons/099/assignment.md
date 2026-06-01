# Assignment 099: Address Balance Toolkit

## Artifact

A single small Go project that calculates a Cardano address balance from a set of UTxOs and exposes it two ways — as a multi-command Cobra CLI and as a Fiber HTTP API — with the balance logic sitting behind an interface and covered by tests.

## Required Task

Welcome to the course — this is your first project. You won't touch a Cardano node yet; the goal here is to get comfortable building real Go programs, because everything later in the course is built on these foundations. By the end you'll have a small working tool that is, quite literally, the skeleton of the **DNS CLI** you'll grow over the rest of the course.

Build one project that ties the module together:

- Model a `UTxO` as a struct and compute an address's total balance, with the calculation depending on a small `UTxOLoader` **interface** rather than a concrete data source (099.2). Ship an in-memory fake loader so the whole thing runs with no external services.
- Write a test that **reproduces and then fixes** a balance bug — the classic one where a loop *replaces* the running total instead of accumulating it. Show the test failing, then passing after your fix, and name the tool you used to find it (`go test`, a print, `dlv`, `go vet`, or `-race`) (099.1).
- Expose the balance through a **Cobra CLI** with at least two subcommands (e.g. `balance --address <addr>` and `version`) and a persistent `--json` flag, returning a clear error on missing input (099.3).
- Expose the same balance through a **Fiber API** — `GET /health` and `GET /balance/:address` returning JSON (099.4).

The CLI and the API should both call the *same* balance service over the *same* loader interface — that's the "parts fit together" idea in 099.2 made concrete.

## Additional Exploration

Add a second `UTxOLoader` that reads UTxOs from a JSON file (or stdin) and a flag to pick which loader to use. This is exactly how the course will later swap your fake loader for a real Cardano data source — so doing it now means the rest of the course just plugs in. As a lighter stretch, write a concurrent version of the balance sum and run `go test -race` to prove it's safe.

## Deliverables

1. **Code** — public repo or gist with the runnable project: `UTxO` struct, `UTxOLoader` interface, balance service, in-memory fake loader, tests, the Cobra CLI, and the Fiber API. README says how to run the CLI and the server.
2. **Test evidence** — captured `go test ./...` output showing your balance tests pass, **including** the regression test for the accumulation bug. Add one line naming which debugging tool located the bug and why.
3. **Running evidence** — captured output showing both surfaces return the same balance:
   - CLI: `balance --address <addr>` plain, and again with `--json`.
   - API: `curl` responses from `/health` and `/balance/:address`.
4. **Course feedback (required):** Written feedback on Module 099's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 099.3).

## Assessment Criteria

- **SLT 099.1** — pass when a regression test reproduces a balance bug (submission shows it failing, then passing after the fix) and the learner names the debugging tool they used.
- **SLT 099.2** — pass when the balance logic depends on a `UTxOLoader` interface and a fake/in-memory loader is substituted in tests without changing the service code.
- **SLT 099.3** — pass when the CLI runs at least two subcommands with a flag and returns a clear, deterministic error on invalid input (e.g. missing `--address`).
- **SLT 099.4** — pass when the Fiber server starts and `/health` plus a balance route return correct JSON for a given address.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- **No Cardano node, network, keys, or testnet needed** — this module is pure Go, run entirely against your in-memory fake loader. (The network magic / preprod rules from later modules do not apply here.)
- Keep the project layout from the lessons: a thin `main.go`, commands under `cmd/`, app logic under `internal/`. You'll reuse this exact structure when the CLI gains Cardano commands.
- Hold on to this repo — later modules replace the fake loader with real chain-backed loaders (gOuroboros, Adder, Blockfrost), turning this skeleton into the DNS CLI.
- This is the on-ramp: if you can finish this, you're ready for the rest of the course. Aim for "working and clear," not clever.
