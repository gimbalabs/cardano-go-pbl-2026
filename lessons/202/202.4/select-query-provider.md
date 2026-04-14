# Select the Right Query Provider for Your Application

In Lesson 202.2, you identified the boundary between event handlers and queries. In 202.3, you added storage to your Adder pipeline. Now you face a decision that every Cardano application developer has to make: where does query data come from?

This lesson surveys the options, works through the trade-offs, and explains why this course uses Dolos — then shows you a concrete benefit of that choice by adding rollback handling to the code you wrote in 202.3.

---

## Prerequisites

- Completed Lessons 202.1, 202.2, and 202.3
- Dolos running locally (see 099 — Setting Up Dolos)
- Your `event-address-filter/main.go` from 202.3 open and working

---

## Part 1: The Options

There is no single "correct" query provider for Cardano applications. The right choice depends on what data you need, how fresh it must be, and how much infrastructure you want to run. Here is an honest overview of what is available today.

### Hosted API Services

Someone else runs the indexer; you call their REST API.

| Service | Strengths | Limitations |
|---------|-----------|-------------|
| [Blockfrost](https://blockfrost.io) | Simple, well-documented, generous free tier | Rate limits, third-party dependency, no rollback notifications |
| [Koios](https://koios.rest) | Community-run, decentralised, open data | Variable latency, no rollback notifications |
| [Maestro](https://www.gomaestro.org) | Full UTxO queries, Plutus data, event streaming | Paid beyond free tier |

**When to choose:** Prototyping, testnets, moderate query volume, or when you cannot run local infrastructure.

**Key limitation for our use case:** hosted APIs respond to your requests — they do not push notifications when the chain rolls back. You would have to detect rollbacks yourself by polling.

### Self-Hosted Indexers (Non-Go)

Run alongside a Cardano node, build a local database you control.

| Indexer | Language | What it indexes |
|---------|----------|-----------------|
| [Kupo](https://github.com/CardanoSolutions/kupo) | Haskell | UTxO set — fast, lightweight, focused |
| [DB Sync](https://github.com/IntersectMBO/cardano-db-sync) | Haskell | Full chain history in PostgreSQL |
| [Oura](https://github.com/txpipe/oura) | Rust | Event pipeline with configurable sink outputs |

**When to choose:** You need full history, complex queries, or low latency and are comfortable running additional services.

**Key limitation:** None are written in Go. You control the infrastructure, but you're adding operational complexity and a language boundary.

### Dolos (Local, Go-Ecosystem)

Dolos is a Cardano data node that exposes three APIs from a single running process:

| Interface | What it gives you |
|-----------|------------------|
| Ouroboros Unix socket | ChainSync — what Adder connects to |
| gRPC (UTxORPC) | Current UTxO state queries — what's spendable at an address right now |
| Mini Blockfrost HTTP | Transaction history and chain metadata, compatible with the Blockfrost REST API |

**When to choose:** You are already running Dolos (you are — it's your Adder connection), you want local latency, and you want rollback notifications without polling.

---

## Part 2: Why This Course Uses Dolos

You are already running Dolos. Adder is already connected to it. That is not a coincidence — Dolos was chosen as the infrastructure for this course because one running process covers what multiple tools would otherwise require:

- Adder connects to it via the Ouroboros socket (Module 201 onwards)
- The mini Blockfrost endpoint lets you make Blockfrost-style REST queries against your local Dolos data — no API key needed, but limited to data Dolos has synced since your Mithril snapshot (not full history)
- In 202.5, you will use the hosted Blockfrost API to backfill historical data that Dolos does not hold

The local socket connection also means zero network latency between your indexer and its data source. And there is one more benefit that matters specifically because of the code you wrote in 202.3.

---

## Part 3: Rollbacks — and Why Your Choice of Provider Matters

In 202.3, we noted rollbacks briefly and deferred them. Here is why the choice of Dolos makes handling them straightforward.

### What is a rollback?

Occasionally the Cardano chain reorganises near the tip. A block (and its transactions) that appeared valid gets replaced by a competing fork. If your indexer stored those transactions, they are now on an orphaned fork — they do not exist on the canonical chain.

### How rollbacks are detected

The Ouroboros ChainSync protocol has rollback built in. When Dolos detects a fork, it emits a rollback message that Adder picks up and delivers to your pipeline as a `chainsync.rollback` event containing a slot number — the point the chain rolled back *to*.

A hosted REST API does not do this. It will eventually reflect the canonical chain in its responses, but it will not notify your application that the fork happened. You would have to detect the inconsistency yourself.

Because you are connected to Dolos via ChainSync, you get rollback events for free.

### The problem with your current 202.3 code

Your `event-address-filter/main.go` has two issues:

1. The event type filter only passes `chainsync.transaction` — rollback events are silently dropped before they reach `handleEvent`
2. `handleEvent` has no code to undo stored transactions when a rollback arrives

The good news: the `slot` column you already store is everything you need. A rollback event tells you "roll back to slot X" — so you delete every row with a slot greater than X.

---

## Step 1: Update the Event Filter

Open `cmd/event-address-filter/main.go`. The existing `filterEvent` only passes `chainsync.transaction`. Adder applies pipeline filters in series — so adding a second filter for `chainsync.rollback` would create an AND condition, meaning nothing passes both. Instead, combine both types into a single filter:

```go
filterEvent := filter_event.New(
    filter_event.WithTypes([]string{"chainsync.transaction", "chainsync.rollback"}),
)
p.AddFilter(filterEvent)
```

Both event type strings are defined in the Adder source — you can verify them at `~/go/pkg/mod/github.com/blinklabs-io/adder@v0.35.0/input/chainsync/chainsync.go`.

> **Two filters, two jobs**
> `filterEvent` and `filterChainsync` are doing different things. `filterEvent` is a gate on event type — it decides which kinds of events are allowed into the rest of the pipeline at all. `filterChainsync` is a gate on payload content — it inspects each transaction's outputs and passes only those involving your watched address. Rollback events have no outputs, so `filterChainsync` passes them straight through regardless of the address filter. The two filters are independent concerns working in series.

---

## Step 2: Handle the Rollback in `handleEvent`

In `handleEvent`, add a rollback check before the existing `TransactionEvent` assertion:

```go
func handleEvent(evt event.Event) error {

    // Handle rollbacks
    if rollback, ok := evt.Payload.(event.RollbackEvent); ok {
        slot := rollback.SlotNumber
        _, err := db.Exec(`DELETE FROM transactions WHERE slot > ?`, slot)
        if err != nil {
            return fmt.Errorf("failed to handle rollback: %w", err)
        }
        slog.Info("rolled back", "to_slot", slot)
        return nil
    }

    // Existing transaction handling below
    payload, ok := evt.Payload.(event.TransactionEvent)
    if !ok {
        return nil
    }
    // ... rest of function unchanged
```

**Two things worth noting here:**

First, `evt.Payload.(event.RollbackEvent)` is a Go type assertion. `evt.Payload` is typed as `any` — the Adder library uses this to carry different event types through the same pipeline. The two-value form `rollback, ok := ...` safely checks whether the payload is actually a `RollbackEvent` without risking a runtime panic. If it is, `ok` is `true` and `rollback` is the typed value. If not, execution falls through to the `TransactionEvent` check below.

Second, notice that `SlotNumber` comes directly from the payload — `rollback.SlotNumber` — unlike transaction handling where the slot lives in `evt.Context.(event.TransactionContext)`. Rollback events have no context object; the slot is on the payload itself. You can verify the struct definition at `~/go/pkg/mod/github.com/blinklabs-io/adder@v0.35.0/event/rollback.go`.

---

## Step 3: Run It

Make sure Dolos is running, then:

```bash
go run cmd/event-address-filter/main.go
```

You should see the same output as 202.3 — the rollback handler is now correct, but rollbacks on preprod are rare. You will probably not see one during a normal development session. That is expected. The code is correct; the event just does not occur often enough to trigger in testing.


---

## What Just Happened

You made a provider selection decision — Dolos — and saw a concrete consequence of it: rollback events arrive via ChainSync and your indexer can respond to them with a single DELETE query. The `slot` column was already there from 202.3. The only additions were a combined filter and four lines in the handler.

If you had chosen a hosted API instead, rollback detection would require polling and comparison logic. The choice of infrastructure shaped what your application can do.

---

## The Broader Point

Selecting a query provider is not just a performance or cost decision. It determines:

- What data you can access (current state vs. history vs. real-time events)
- Whether rollbacks are visible to your application
- How much infrastructure you are responsible for
- What your query interface looks like (REST, gRPC, SQL)

For this course, Dolos satisfies all four: it gives you real-time events (via ChainSync), rollback notifications (via ChainSync), current state queries (via mini Blockfrost), and keeps infrastructure to a single local process you are already running. In 202.5 you will reach beyond Dolos to hosted Blockfrost for full transaction history — data that a lightweight local node does not hold.

---

## Common Issues

### `event.RollbackEvent` not found
Ensure you are importing `"github.com/blinklabs-io/adder/event"` — `RollbackEvent` is defined there alongside `TransactionEvent` and `TransactionContext`.

### Dolos socket not found
Dolos is not running. Start it with `dolos daemon` from your Dolos directory and confirm `dolos.socket` appears.

---

## Practice Tasks

1. Add a log line before the DELETE that prints how many rows will be affected: query `SELECT COUNT(*) FROM transactions WHERE slot > ?` first and log the result
2. Think through: if your schema also stored transaction outputs (with their own rows), would the `slot` column on each output row be enough to handle rollbacks the same way?

---

## What's Next

- Lesson 202.5: Combine live event data with historical query data using Blockfrost
