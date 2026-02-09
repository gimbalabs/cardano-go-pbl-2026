# The Role of an Indexer

In Module 201, you learned how to use Adder to watch the blockchain in real-time — filtering events by type, address, policy ID, and pool ID. That's powerful, but it only covers what's happening *right now*. What about everything that already happened? What if your application needs to look up a specific UTxO, check the history of an address, or query the current state of a smart contract?

This is the role of an indexer: turning raw blockchain data into something you can query.

This lesson explains what indexers do, why they exist, and what the current landscape looks like — including where Go tooling stands today and what options are available right now.

---

## Prerequisites

Before this lesson, you should:

- Have completed Module 201 (Reacting to Chain Events with Adder)
- Understand the difference between blocks, transactions, and rollbacks
- Be comfortable reading Go code

No coding is required in this lesson.

---

## The Problem: Raw Blockchain Data is Not Queryable

A Cardano node stores the blockchain as a sequence of blocks. It speaks the Ouroboros protocol — you can follow the chain tip, fetch blocks, and submit transactions. But a node is **not a database**. You cannot ask it:

- "What are all the UTxOs at this address?"
- "Show me every transaction involving this policy ID in the last 24 hours"
- "What is the current datum at this script address?"

The node knows the current ledger state and can replay the chain, but it does not provide the kind of random-access queries that applications need.

This is the gap that indexers fill.

---

## But the Data Is All There

Here's the thing: a Cardano node stores the **full chain** — every block since genesis. None of the data is missing. The node speaks three Ouroboros mini-protocols:

- **ChainSync** — walk the chain block-by-block, from genesis to tip
- **LocalStateQuery** — query the *current* ledger state (current UTxO set, protocol parameters, stake distribution)
- **LocalTxSubmission** — submit transactions

If every indexer and hosted API vanished overnight, you could still retrieve any historical data. You would do it the same way indexers do: **replay the chain from genesis, one block at a time, using ChainSync.** Read each block, inspect each transaction, and check if it contains what you're looking for.

That's the only way. There is no "search by address" or "filter by policy ID" at the protocol level. LocalStateQuery gives you one shortcut — you can ask "what UTxOs exist *right now*?" without replaying the chain — but you cannot ask "what UTxOs existed at slot 50000?" or "show me every transaction involving this address." Those questions require walking the entire chain.

Think of it like a library where every book sits on the shelves, but there is no catalog, no search system, no index. To find a specific book, you start at shelf one and check every single one.

This is the key insight: **indexers don't add data — they add access patterns.** The blockchain is an append-only log. Indexers transform that log into something with random access. Without them, you still have all the data, but the only way to read it is sequentially from the beginning.

---

## What an Indexer Does

An indexer sits between the blockchain and your application. It:

1. **Follows the chain** — connects to a node and processes each block as it arrives (or replays from history)
2. **Extracts and transforms** — pulls out the specific data your application cares about
3. **Stores it in a queryable format** — writes to a database (PostgreSQL, SQLite, etc.) with indexes optimized for your access patterns
4. **Handles rollbacks** — when the chain rolls back, the indexer must undo its recent writes to stay consistent

```
Cardano Node
    ↓ (Ouroboros ChainSync)
Indexer
    ↓ (extract, transform, store)
Database (PostgreSQL, SQLite, etc.)
    ↓ (SQL, REST, GraphQL)
Your Application
```

The key insight is that **an indexer is an opinionated transformation of blockchain data**. Different indexers extract different things, store them differently, and expose different query interfaces. There is no single "correct" indexer — only indexers that are well-suited (or poorly-suited) to your use case.

---

## Where Adder Fits — and Where It Stops

In Module 201, you used Adder as a real-time event stream. Adder connects to a Cardano node via ChainSync and delivers filtered events to your application through its pipeline architecture:

```
Input (ChainSync) → Filters → Output (embedded, webhook, log, etc.)
```

Adder is excellent at **reacting to events as they happen**. But it is not a full indexer:

- It does not store data to a database
- It does not provide a query interface
- It does not maintain historical state

Think of Adder as the **input stage** of an indexer. It solves the hardest part — reliably following the chain and filtering relevant events — but leaves storage and querying to you.

This is by design. Adder is a library, not a product. It gives you the building blocks to construct exactly the indexer your project needs, without imposing a particular database or query model.

---

## The Current Landscape

The Cardano ecosystem has several indexing solutions. They range from hosted API services to self-hosted infrastructure, and most are not written in Go. Here's an honest overview of what's available:

### Hosted API Services

These are the fastest way to get queryable blockchain data. Someone else runs the indexer; you call their API.

| Service | Query Interface | Key Strengths |
|---------|----------------|---------------|
| [Blockfrost](https://blockfrost.io) | REST API | Simple, well-documented, generous free tier |
| [Maestro](https://www.gomaestro.org) | REST API | Full UTxO queries, Plutus data, event streaming |
| [Koios](https://koios.rest) | REST API | Community-run, decentralized, open data |

**Practical considerations:**
- Free tiers have rate limits that may not suit production workloads
- You depend on a third party for uptime and data freshness
- Latency varies — a local indexer will always be faster
- Ideal for prototyping, testnets, and applications with moderate query volume

### Self-Hosted Indexers (Non-Go)

These run alongside your Cardano node and build a local database you control.

| Indexer | Language | What It Indexes |
|---------|----------|-----------------|
| [Kupo](https://github.com/CardanoSolutions/kupo) | Haskell | UTxO set — fast, focused, lightweight |
| [Oura](https://github.com/txpipe/oura) | Rust | Event pipeline — similar concept to Adder, with sink outputs |
| [Carp](https://github.com/dcSpark/carp) | Rust | General purpose — PostgreSQL-backed, flexible |
| [DB Sync](https://github.com/IntersectMBO/cardano-db-sync) | Haskell | Everything — full chain history in PostgreSQL |

**Practical considerations:**
- You control the infrastructure, data freshness, and query performance
- Requires running and maintaining a Cardano node
- DB Sync is comprehensive but resource-heavy (100+ GB database, hours to sync)
- Kupo is lightweight but only indexes the UTxO set
- These are mature, production-tested tools — but none are written in Go

### Go Ecosystem: What Exists Today

From a Go perspective, the picture is honest but evolving:

- **Adder** — Reliable chain-following and event filtering, but no storage layer. You build the rest yourself.
- **gOuroboros** — Low-level Ouroboros protocol implementation. Adder is built on top of it. You *could* build an indexer directly on gOuroboros, but Adder already provides the ergonomic layer for this.
- **Dingo** — A full Cardano node implementation in Go, currently under heavy development. Dingo includes UTxO tracking with pluggable storage backends (SQLite, PostgreSQL, BadgerDB) and supports LocalStateQuery. When mature, it could serve as both node and query layer — an all-Go stack. But it is not production-ready yet.

**The practical reality:** If you are building a Go application today and need to query historical blockchain data, you will use a hosted API (Blockfrost, Maestro, Koios) or run a non-Go indexer (Kupo, DB Sync) alongside your node. The Go ecosystem provides the event-streaming layer (Adder) and the transaction-building layer (Apollo), but the query layer is still emerging.

This is not a limitation to work around — it's the current state of the ecosystem, and knowing it helps you make good architectural decisions.

---

## Practical Concerns for Choosing an Indexer

When selecting an indexing approach for a project, consider these factors:

### 1. What Data Do You Actually Need?

Not every application needs a full chain history. Ask yourself:

- Do you only need UTxOs at specific addresses? → Kupo or a hosted API may suffice
- Do you need full transaction history? → DB Sync or a comprehensive hosted API
- Do you only need real-time events going forward? → Adder alone might be enough
- Do you need a custom subset of chain data? → Build your own with Adder + a database

### 2. Latency and Freshness

- **Hosted APIs** introduce network latency (typically 50-200ms per request) and may lag a few seconds behind the chain tip
- **Local indexers** provide near-instant queries but require infrastructure
- **Adder** delivers events in real-time as blocks arrive — no lag

For applications where seconds matter (DEX bots, arbitrage), local infrastructure wins. For dashboards and explorers, hosted APIs are usually fine.

### 3. Cost and Complexity

| Approach | Infrastructure Cost | Operational Complexity |
|----------|-------------------|----------------------|
| Hosted API (free tier) | None | None |
| Hosted API (paid) | Monthly subscription | None |
| Kupo + Node | ~50 GB disk, moderate RAM | Run and maintain two services |
| DB Sync + Node | ~200 GB disk, high RAM | Run and maintain two services, long initial sync |
| Custom (Adder + your DB) | Your database + Node | You build and maintain the indexer |

### 4. Rollback Handling

Any indexer that stores data must handle chain rollbacks correctly. When the blockchain rolls back (which happens occasionally, especially across epoch boundaries), the indexer must undo its recent writes.

- Hosted APIs handle this for you
- Self-hosted indexers like Kupo and DB Sync handle it internally
- If you build your own with Adder, **you are responsible for rollback handling** — this is a non-trivial concern that Module 201 introduced but that becomes critical when you persist data

---

## The Emerging Go Stack

The direction the Blink Labs Go ecosystem is heading looks like this:

```
Cardano Network
    ↕
Dingo (Go node — in development)
    ↕
    ├── Adder (event streaming + filtering)
    │     ↓
    │   Your custom storage layer
    │     ↓
    │   Your application queries your DB
    │
    ├── Apollo (transaction building)
    │
    └── Bursa (wallet / key management)
```

Today, you substitute `cardano-node` (Haskell) for Dingo and use hosted APIs or non-Go indexers for the query layer. As Dingo matures and gains LocalStateQuery support, more of this stack will be achievable in pure Go.

The lessons in this module work with the tools available today: Adder for event capture and storage, and external providers for queries that Adder cannot serve.

---

## Summary

- A Cardano node is not a database — indexers bridge the gap between raw chain data and queryable application data
- Adder is the event-streaming layer: it follows the chain and delivers filtered events, but does not store or query data
- The Go ecosystem does not yet have a full indexing + query solution, but the pieces are being built (Adder, Dingo, gOuroboros)
- Today, Go developers pair Adder with hosted APIs (Blockfrost, Maestro, Koios) or self-hosted non-Go indexers (Kupo, DB Sync) for queries
- Choosing an indexing approach depends on what data you need, how fresh it must be, and how much infrastructure you want to manage

You now have the conceptual grounding to make informed decisions about blockchain data access — which is exactly what the rest of this module will put into practice.

---

## What's Next

- Understand the limits of event handlers and when you need a general query (Lesson 202.2)
- Store and retrieve data using Adder (Lesson 202.3)
- Select the right query provider for your application (Lesson 202.4)
- Enrich event data with query data (Lesson 202.5)

---

*Generated with Andamio Lesson Coach*
