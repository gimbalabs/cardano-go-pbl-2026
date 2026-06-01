# Assignment 101: Node Inspector CLI

## Artifact

A small multi-command Go CLI, built on gOuroboros, that connects to a Cardano node and reports on it: current chain tip and sync state, the contents of a specific block, and the node's pending mempool.

## Required Task

Using the gOuroboros Starter Kit as your starting point, build a command-line tool that talks directly to a Cardano node over the Ouroboros protocols. Give it commands that each exercise a different mini-protocol:

- **tip / sync** — connect via ChainSync and report the chain tip and how far the node has synced.
- **block** — fetch a specific block via BlockFetch and print its identifying fields (slot, hash, transaction count).
- **mempool** — query the node's pending transactions via LocalTxMonitor.

This is the node-interaction plumbing the **DNS CLI** sits on: before it can register or resolve a name, it needs to reach a node, know the chain is current, read blocks, and see what's pending. A Cobra structure here also carries straight over from 099.3.

The first three commands run over **Node-to-Node (N2N)** against a public **preprod** relay (magic `1`) — e.g. `preprod-node.world.dev.cardano.org:3001` (more relays in the [Cardano environments list](https://book.play.dev.cardano.org/environments.html)). The `mempool` command uses **Node-to-Client (N2C)** over a local Unix socket and therefore **requires a local node** — Dingo (Preview, magic `2`) or cardano-node in Docker. If you don't run a local node, complete the first three commands against a relay and note the mempool command as infra-blocked.

## Additional Exploration

Close the loop with submission: send a transaction (reuse your Module 102 wallet/builder, or the starter kit's TxSubmission path) and have your `mempool` command show it sitting in the local node's mempool *before* it's included in a block. As a lighter stretch, point `tip` at two different relays and observe whether they report the same tip slot.

## Deliverables

1. **Code** — public repo or gist with the runnable CLI (gOuroboros, multi-command). The README lists each command and how to run it.
2. **Runtime evidence** — captured terminal output for each capability:
   - **tip/sync** — connection established plus the reported chain tip and sync state.
   - **block** — a specific block's slot, hash, and transaction count.
   - **mempool** — the query result (pending transaction hashes, or an explicit "mempool empty").
   Include the tip slot/block hash so it can be cross-checked on [Cardanoscan Preprod](https://preprod.cardanoscan.io/).
3. **Connection note** — for each command, which access mode and endpoint you used (public relay over N2N vs. local node over N2C) and the network magic.
4. **Course feedback (required):** Written feedback on Module 101's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 101.2).

## Assessment Criteria

- **SLT 101.1** — pass when the code connects to a node via gOuroboros (ChainSync, N2N) and the output shows a live connection.
- **SLT 101.2** — pass when the code fetches a *specific* block via BlockFetch and the output shows that block's identifying fields (slot, hash).
- **SLT 101.3** — pass when the program reports the node's sync state — the chain tip and how far the node has synced toward it.
- **SLT 101.4** — pass when the program queries the mempool via LocalTxMonitor against a local node and the output shows the result (pending tx hashes or an explicit empty mempool). _Requires a local node; if infra-blocked, the learner must show the working code and a clear account of the blocker._
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Network magic: preprod = `1`, preview = `2`, mainnet = `764824073` (do not target mainnet).
- **101.4 is the only part that needs a local node.** Dingo is the all-Go option (Preview, ~50 GB, Mithril snapshot bootstrap); cardano-node in Docker is the stable fallback. Both expose the N2C socket LocalTxMonitor needs.
- Preprod mempool is often empty between transactions — the Additional Exploration (submit your own tx) is the reliable way to see a non-empty result.
- _Lesson content for Module 101 is not yet written; this assignment is drafted from the SLTs and `infrastructure-options.md`. Reconcile command names and APIs against the lessons once they exist._
