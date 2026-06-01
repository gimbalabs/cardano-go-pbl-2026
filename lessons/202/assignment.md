# Assignment 202: Hybrid Address Indexer

## Artifact

A Go indexer that maintains a queryable local store of all transactions for a watched address — backfilled with history from a query provider and kept current with live Adder events — with rollback handling and a written provider-selection rationale.

## Required Task

Extend the Adder pipeline from Module 201 into a small custom indexer that answers a question a live event stream alone cannot: *what is the complete transaction history of this address, past and present?*

Persist matched transactions to a local store (SQLite is fine), backfill the address's earlier history from a query provider at startup, and keep the store current by writing each live event as it arrives. Handle `chainsync.rollback` events so orphaned transactions don't linger. This is the seed of the **DNS CLI's "registry state" layer**: a local, queryable record of every on-chain event affecting a name — built once from history and maintained live thereafter.

Connect live data through your local **Dolos** Unix socket (ChainSync, magic `1`) and backfill history through **Blockfrost preprod** (or another provider you justify). Both run against Cardano Preprod.

## Additional Exploration

Put a query interface in front of your store: serve the combined history over an HTTP endpoint (e.g. a Fiber route from 099.4) so the indexer becomes a service, not just a script. As a second stretch, swap Blockfrost for **Koios** on the backfill path and note what changed — auth, response shape, rate limits — and which you'd choose for the DNS CLI.

## Deliverables

1. **Code** — public repo or gist with the runnable indexer (Adder live stream + persistent store + provider backfill + rollback handler). The README shows how to run it and names the watched address.
2. **Combined-data evidence** — captured query output (e.g. `sqlite3 indexer.db "SELECT source, block_height, slot, tx_hash ..."`) showing rows from **both** sources for the same address: live rows (`source=adder`, `slot` populated) *and* historical rows (`source=blockfrost`, `block_height` populated), with duplicates absent. Include one transaction hash so it can be cross-checked on [Cardanoscan Preprod](https://preprod.cardanoscan.io/).
3. **Provider rationale** — a short written note (in the README is fine) covering: what your indexer indexes and why a stored/query layer is needed beyond the live event handler; which provider you chose for backfill and its trade-offs against the alternatives (Blockfrost / Koios / Maestro / Kupo / DB Sync / Dolos).
4. **Course feedback (required):** Written feedback on Module 202's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 202.4).

## Assessment Criteria

- **SLT 202.1** — pass when the rationale explains what a blockchain indexer does and names at least one concrete trade-off of running one (infra, freshness, history depth, or cost).
- **SLT 202.2** — pass when the rationale identifies why the live event handler alone cannot answer the target question (history before startup) and justifies the query-based backfill.
- **SLT 202.3** — pass when the code persists live Adder events to a store and the submitted evidence shows data being **retrieved** (query output), not just written.
- **SLT 202.4** — pass when a query provider is chosen for backfill with stated trade-offs against at least one named alternative.
- **SLT 202.5** — pass when the query output shows **both** live (`source=adder`) and historical (`source=blockfrost`) rows for the same address in one store, deduplicated by `tx_hash`.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Generate a live row by sending a transaction to your watched address from the [preprod faucet](https://docs.cardano.org/cardano-testnets/tools/faucet) or another wallet *after* the pipeline is running — Adder tails from the tip.
- A Blockfrost preprod project ID starts with `preprod`; keep it in a `.env` file, never commit it.
- `INSERT OR IGNORE` on a `UNIQUE(tx_hash)` column is what dedupes the two sources — make sure your schema has it.
- Rollbacks are rare on preprod; you likely won't observe one in a session. The handler is graded for **correctness** (deletes rows with `slot >` the rollback slot), not for being triggered live.
- Adder **v0.36.0+** renames `filter/chainsync` to `filter/cardano` (identical API). Note your version from `go.mod`.
