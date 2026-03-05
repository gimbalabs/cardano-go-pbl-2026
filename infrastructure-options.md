# Infrastructure Options for Cardano Go PBL

## Context

This document exists because **Demeter.run is discontinuing its cloud workspace and hosted node services**. Demeter was previously used in Gimbalabs courses for two reasons:

1. A pre-configured cloud dev environment (Go, tools, etc.)
2. Access to a running Cardano node

This document maps out viable alternatives for each of those needs, per lesson module.

---

## Understanding the Two Distinct Needs

Before picking alternatives, it helps to be precise about what "node access" means. There are two different protocol modes, and they have different requirements:

| Mode | Transport | Who can use it | What it gives you |
|---|---|---|---|
| **Node-to-Node (N2N)** | TCP over the internet | Anyone | ChainSync, BlockFetch, TxSubmission |
| **Node-to-Client (N2C)** | Unix socket, local only | Must run a node locally | LocalStateQuery, LocalTxMonitor, LocalTxSubmission |

**gOuroboros** and **Adder** use N2N by default — they can connect to any public Cardano relay node over TCP. N2C is only needed for queries against the local ledger state (e.g. "what UTxOs exist right now?") and for mempool access. In practice, most of those queries can be replaced by hosted REST APIs like Blockfrost.

---

## What is Ouroboros?

Ouroboros is Cardano's consensus protocol — the rules by which nodes agree on the state of the blockchain. The name also refers to the **network protocol family** nodes use to communicate, which is the part relevant to this course.

Ouroboros is made up of several **mini-protocols**, each with a specific job:

| Mini-protocol | What it does | Available via |
|---|---|---|
| ChainSync | Follow the chain, receive new blocks | N2N + N2C |
| BlockFetch | Download full block bodies | N2N |
| TxSubmission | Propagate transactions between nodes | N2N |
| LocalStateQuery | Query current ledger state (UTxOs, params) | N2C only |
| LocalTxSubmission | Submit a tx directly to your node | N2C only |
| LocalTxMonitor | Watch your node's mempool | N2C only |

**gOuroboros** is Blink Labs' Go implementation of this protocol family. **Adder** is built on top of it, using ChainSync (N2N) to follow the chain.

---

## Infrastructure Requirements by Module

### Module 101 — Interacting with the Cardano Node

| Lesson | What it needs | N2N sufficient? | Notes |
|---|---|---|---|
| 101.1 gOuroboros Starter Kit | Connect to a node, run ChainSync | Yes | Any public relay works |
| 101.2 Fetch specific blocks | ChainSync + BlockFetch | Yes | Any public relay works |
| 101.3 Check sync state | Chain tip awareness | Yes | Inferred from ChainSync — no LocalStateQuery needed |
| 101.4 Fetch mempool contents | LocalTxMonitor | **No** | **Only lesson that strictly requires a local node** |

### Module 102 — Building Simple Transactions

All lessons in Module 102 use **Blockfrost** as the chain context for Apollo. No node access is required. Students need a Blockfrost API key (free tier).

### Module 201 — Reacting to Chain Events (Adder)

Adder follows the chain via ChainSync over N2N. Any public Cardano relay suffices. No local node needed.

### Module 202 — Querying the Blockchain

The lesson content uses hosted REST APIs (Blockfrost, Koios) for query data. No node access required beyond what Module 201 established.

---

## Viable Options

### Option A: Public Cardano Relay Nodes (Free, No Account)

Public relay nodes are run by stake pools and IOHK/Intersect. They speak N2N and are accessible over TCP. Adder and gOuroboros can connect to them directly.

- **Cost:** Free
- **Setup:** Zero — just point to a relay address
- **Covers:** Modules 101.1, 101.2, 101.3, all of 201
- **Does not cover:** 101.4 (mempool)
- **Reliability:** Generally stable, but no SLA

Preview and preprod relay addresses are publicly listed in the [Cardano documentation](https://book.play.dev.cardano.org/environments.html).

---

### Option B: Blockfrost (Hosted REST API)

[Blockfrost](https://blockfrost.io) provides a well-documented REST API covering UTxOs, transactions, protocol parameters, and transaction submission. Apollo has a built-in Blockfrost `ChainContext` — this is already used in lesson 102.2.

- **Cost:** Free tier (50k requests/day on up to 5 projects)
- **Setup:** Sign up, get API key, set in code
- **Covers:** All of Module 102, query lessons in 202
- **Does not cover:** Chain-following for Adder (that's N2N, not REST)
- **Reliability:** High — production-grade, widely used in the ecosystem

---

### Option C: Koios (Hosted REST API, No Key Required)

[Koios](https://koios.rest) is a community-run, decentralized REST API for Cardano. No account or API key is needed for basic use.

- **Cost:** Free (public endpoints)
- **Setup:** None
- **Covers:** Blockchain queries (same scope as Blockfrost)
- **Does not cover:** Chain-following for Adder
- **Reliability:** Good, but community-run with no SLA
- **Advantage over Blockfrost:** No signup required — useful for early lessons where key management is a distraction

---

### Option D: Dingo (Go Cardano Node, Self-Hosted)

[Dingo](https://github.com/blinklabs-io/dingo) is Blink Labs' Go implementation of a Cardano node. It speaks the same Ouroboros protocols as `cardano-node`, so all course tools work with it identically.

- **Cost:** Free (open source)
- **Requirements:** Go 1.23+, `make`, and significant disk space:
  - Preview: ~50 GB
  - Preprod: ~150 GB
  - Mainnet: ~400 GB
- **Bootstrapping:** Mithril snapshot support — students don't need to sync from genesis
- **Covers:** Everything, including 101.4 (mempool) via N2C
- **Current status:** Work in progress, under active development. Explicit warning on the repo. Plutus V1/V2 validation not yet implemented.
- **Best fit:** Preview network. Students with sufficient disk and a capable dev machine.

**Recommendation:** Present Dingo as the "full local stack" option for students who want it, not a hard requirement. As Dingo matures, it becomes the natural fit for an all-Go course.

---

### Option E: cardano-node via Docker (Stable Fallback)

The reference Haskell `cardano-node` is mature and production-tested. It can be run in Docker to reduce local setup friction.

- **Cost:** Free
- **Requirements:** Docker, same disk space as above
- **Covers:** Everything, including 101.4 (mempool)
- **Less elegant for a Go course**, but reliable if Dingo has issues

---

## Recommended Approach Per Module

| Module | Primary infrastructure | Fallback |
|---|---|---|
| 101.1–101.3 | Public Cardano relay (N2N) | Any relay — no account needed |
| 101.4 (mempool) | Dingo on Preview (local) | cardano-node in Docker |
| 102 | Blockfrost (free tier) | Koios |
| 201 | Public Cardano relay (N2N) | Same |
| 202 (queries) | Blockfrost or Koios | Either works |

**The cleanest story for students:**
> Use a public relay for chain-following, a Blockfrost key for queries and transactions, and optionally run Dingo locally for the full stack. No cloud workspace required — everything runs from a standard Go dev environment.

---

## Dev Environment (Replacing Demeter Workspaces)

Without Demeter's cloud workspace, students need a local Go environment. The prerequisites are minimal:

- Go 1.21+ (1.23+ if running Dingo)
- Git
- A terminal

No special tooling beyond standard Go development is required for most of the course. This is actually simpler than a cloud workspace dependency.

Consider pointing students to [the official Go install guide](https://go.dev/doc/install) as part of a revised prerequisites lesson.

---

## Open Questions for the Team

1. **101.4 (mempool):** Is this lesson a priority? If it's lower priority, it could be deferred until Dingo is more stable, eliminating the only hard local-node requirement.
2. **Dingo stability:** How close is Dingo to being stable enough for a course context? Worth checking directly with Blink Labs given the partnership.
3. **Preview vs Preprod:** Preview (~50 GB) is the lighter option for local nodes. Is there a reason the course uses Preprod — should we standardise on Preview where possible?
4. **Blockfrost key management:** Students will need to handle API keys. Worth a short note in the prerequisites about not committing keys to git (`.env` / environment variables).
