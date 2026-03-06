# Coaching Readiness Assessment

## Summary

- **Total SLTs assessed**: 44
- **Distribution**: 7 Ready / 32 Needs Context / 5 Needs Human
- **Overview**: Claude is strong on pure Go fundamentals (debugging, type system, Cobra, profiling) and general Cardano conceptual knowledge. It is consistently weak on the niche Cardano Go libraries (gOuroboros, Bursa, Apollo, Adder) — it knows roughly what each does but cannot write or reliably evaluate code that uses their APIs. This is the dominant gap across the entire SLT set.

## Readiness by Module

| Module                                  | Ready | Needs Context | Needs Human | Notes                                                                 |
| --------------------------------------- | ----- | ------------- | ----------- | --------------------------------------------------------------------- |
| 099 - Intro to Go                       | 4     | 0             | 0           | Strong on Go fundamentals and basic Fiber API implementation          |
| 100 - Prerequisites + Tools             | 1     | 6             | 0           | Can explain Cardano well; niche library explanations are partial      |
| 101 - Interacting with the Cardano Node | 0     | 4             | 0           | gOuroboros API knowledge is uniformly partial                         |
| 102 - Building Simple Transactions      | 0     | 4             | 2           | Bursa and Apollo APIs are weak; conceptual Cardano knowledge is solid |
| 201 - Reacting to Chain Events          | 0     | 3             | 0           | Adder API knowledge is uniformly partial                              |
| 202 - Querying the Blockchain           | 0     | 4             | 1           | General indexing concepts strong; Adder storage API is weak           |
| 203 - Applications and Smart Contracts  | 0     | 4             | 2           | Transaction concepts strong; Apollo smart contract API is weak        |
| 204 - Serializing Data                  | 1     | 5             | 0           | CBOR/protobuf concepts strong; Cardano-specific tooling partial       |
| 301 - Debugging                         | 1     | 2             | 0           | Go profiling strong; cross-stack Cardano debugging partial            |

## Per-SLT Assessment

### Module: 099 - Intro to Go

| #     | SLT                                     | Conceptual | Code Demo | Assessment | Currency  | Overall       |
| ----- | --------------------------------------- | ---------- | --------- | ---------- | --------- | ------------- |
| 099.1 | Find and fix bugs using debugging tools | Strong     | Strong    | Strong     | Current   | Ready         |
| 099.2 | Work with Go's type system              | Strong     | Strong    | Strong     | Current   | Ready         |
| 099.3 | Build CLI tool with Cobra               | Strong     | Strong    | Strong     | Current   | Ready         |
| 099.4 | Create web API with Fiber               | Strong     | Strong    | Strong     | Current   | Ready         |

#### Gap Analysis

No blocking gaps for module 099 at this time.

---

### Module: 100 - Prerequisites + Tools of Cardano Go Development

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 100.1 | Describe Cardano, how it differs, what can be built | Strong | N/A | Strong | Current | Ready |
| 100.2 | Explain Ouroboros consensus | Partial | N/A | Partial | Uncertain | Needs Context |
| 100.3 | Explain why Bursa was built | Partial | N/A | Partial | Uncertain | Needs Context |
| 100.4 | Explain why Apollo was built | Partial | N/A | Partial | Uncertain | Needs Context |
| 100.5 | Explain why Adder was built | Partial | N/A | Partial | Uncertain | Needs Context |
| 100.6 | Explain why Cardano Up was built | Partial | N/A | Partial | Uncertain | Needs Context |
| 100.7 | Navigate course structure and set up dev environment | Partial | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 100.2: "I can explain how Ouroboros reaches consensus and why that matters for building on Cardano."**
- **Partial dimensions**: Conceptual Explanation — can explain PoS slot leaders, epochs, and the basic Ouroboros model, but would thin out at the third "why?" on mathematical guarantees or differences between Ouroboros Classic/Praos/Genesis/Leios. Learner Assessment — could catch clearly wrong statements but might miss subtle inaccuracies. Knowledge Currency — Ouroboros continues evolving (Leios in development).
- **What Claude would need**: IOG's current Ouroboros explainer or the relevant sections of the Cardano docs that cover the consensus variant the course targets. A summary of which Ouroboros variant is running on mainnet today.
- **Risk if coached without context**: Could conflate Ouroboros variants, give outdated information about the current consensus mechanism, or provide inaccurate details about security guarantees.

**SLT 100.3: "I can explain why Bursa was built and what problems it solves."**
- **Partial dimensions**: Conceptual Explanation — Bursa is known to be a Blink Labs Go library for Cardano wallet/key management, but exact problem statement, feature scope, and differentiators from alternatives are uncertain. Knowledge Currency — cannot name the version.
- **What Claude would need**: Bursa README or documentation page explaining its purpose, design goals, and the problem it was built to solve.
- **Risk if coached without context**: Could misstate Bursa's scope, confuse it with other wallet libraries, or fabricate features it doesn't have.

**SLT 100.4: "I can explain why Apollo was built and what problems it solves."**
- **Partial dimensions**: Same pattern as 100.3. Apollo is known as a Cardano transaction-building library in Go, but specific problem statements, feature differentiation, and design philosophy are uncertain.
- **What Claude would need**: Apollo README or documentation page.
- **Risk if coached without context**: Could misrepresent Apollo's capabilities or conflate it with other transaction libraries (e.g., Lucid, cardano-cli).

**SLT 100.5: "I can explain why Adder was built and what problems it solves."**
- **Partial dimensions**: Same pattern. Known as a chain indexing/following tool in Go, but specifics are uncertain.
- **What Claude would need**: Adder README or documentation page.
- **Risk if coached without context**: Could confuse Adder's scope with other indexers (Scrolls, Oura, db-sync) or misstate its architecture.

**SLT 100.6: "I can explain why Cardano Up was built and what problems it solves."**
- **Partial dimensions**: Believed to be a development environment setup tool, but less confident about its features and scope than the other Blink Labs tools.
- **What Claude would need**: Cardano Up README or documentation page.
- **Risk if coached without context**: Could fundamentally mischaracterize what this tool does.

**SLT 100.7: "I can navigate the course structure and set up my development environment for the modules ahead."**
- **Partial dimensions**: All — this SLT depends entirely on knowing the specific course structure, required tools, and setup steps.
- **What Claude would need**: The course's setup guide, prerequisites list, and repository structure.
- **Risk if coached without context**: Could give setup instructions that don't match the actual course environment.

---

### Module: 101 - Interacting with the Cardano Node

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 101.1 | Set up gOuroboros Starter Kit | Partial | Partial | Partial | Uncertain | Needs Context |
| 101.2 | Fetch specific blocks from a Node | Partial | Partial | Partial | Uncertain | Needs Context |
| 101.3 | Check Node sync progress | Partial | Partial | Partial | Uncertain | Needs Context |
| 101.4 | Fetch mempool information | Partial | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 101.1: "I can set up and run the gOuroboros Starter Kit to connect to a Cardano Node."**
- **Partial dimensions**: All four. gOuroboros is known to implement Ouroboros mini-protocols in Go (by Blink Labs), but the Starter Kit's structure, entry point, and configuration are unknown.
- **What Claude would need**: gOuroboros Starter Kit repository with README, including setup instructions and example connection code.
- **Risk if coached without context**: Could provide setup steps that don't match the actual kit, or fabricate configuration options.

**SLT 101.2: "I can fetch specific blocks from a remote Cardano Node."**
- **Partial dimensions**: Chain-sync and block-fetch mini-protocols are understood conceptually, but gOuroboros API calls for block fetching are unknown.
- **What Claude would need**: gOuroboros API reference or example code showing block fetching (ChainSync or BlockFetch protocol usage).
- **Risk if coached without context**: Could fabricate function names, get the chain-sync protocol flow wrong, or use patterns from a different library.

**SLT 101.3: "I can check how far a Cardano Node has synced with the blockchain."**
- **Partial dimensions**: Chain tip query concept is understood but not gOuroboros's specific API for this.
- **What Claude would need**: gOuroboros example showing chain tip query or local-state-query protocol usage.
- **Risk if coached without context**: Could confuse the mini-protocol used (local-state-query vs chain-sync tip) or invent wrong function signatures.

**SLT 101.4: "I can fetch information about pending transactions waiting in a Node's mempool."**
- **Partial dimensions**: The local-tx-monitor mini-protocol is known to exist for mempool queries, but gOuroboros's implementation of it is not.
- **What Claude would need**: gOuroboros API reference or example for local-tx-monitor / mempool queries.
- **Risk if coached without context**: Could get the protocol flow wrong or fabricate the API surface.

---

### Module: 102 - Building Simple Transactions

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 102.1 | Create a wallet with Bursa | Partial | Weak | Weak | Uncertain | Needs Human |
| 102.2 | Build a simple transaction with Apollo | Partial | Weak | Partial | Uncertain | Needs Human |
| 102.3 | Sign a transaction manually and programmatically | Strong | Partial | Partial | Uncertain | Needs Context |
| 102.4 | Submit a transaction with gOuroboros | Partial | Partial | Partial | Uncertain | Needs Context |
| 102.5 | Set a validity time window | Strong | Partial | Partial | Uncertain | Needs Context |
| 102.6 | Add metadata to a transaction | Strong | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 102.1: "I can create a wallet with Bursa."**
- **Weak dimensions**: Code Demonstration — cannot name a single Bursa function or describe its API shape (library import? CLI? both?). Learner Assessment — without knowing what correct Bursa code looks like, cannot distinguish correct from incorrect submissions.
- **What Claude would need**: Bursa API reference showing wallet creation functions, key generation, and address derivation. Example code of a complete wallet creation flow.
- **Risk if coached without context**: Would almost certainly fabricate function names and API patterns. A learner could submit completely wrong code and it might be accepted.

**SLT 102.2: "I can build a simple transaction with Apollo."**
- **Weak dimension**: Code Demonstration — cannot write Apollo's transaction builder API. Function signatures for creating inputs, outputs, calculating fees, or building a transaction body are unknown.
- **What Claude would need**: Apollo API reference for transaction building. A complete example of building a simple ADA transfer transaction in Go with Apollo.
- **Risk if coached without context**: Would fabricate transaction builder API calls. Could teach patterns from Lucid (TypeScript) or cardano-cli that don't apply to Apollo.

**SLT 102.3: "I can sign a transaction manually and programmatically."**
- **Partial dimensions**: Code Demonstration — Ed25519 signing and Go's crypto primitives are known, but the Cardano-specific signing step (which library, what format, how witnesses attach) is uncertain. Knowledge Currency — depends on which library handles signing.
- **What Claude would need**: Example code showing both manual signing (raw crypto) and programmatic signing (via Apollo or Bursa) of a Cardano transaction in Go.
- **Risk if coached without context**: Could get the witness format wrong or use incorrect library calls for attaching signatures to transactions.

**SLT 102.4: "I can submit a transaction to a node with gOuroboros."**
- **Partial dimensions**: The local-tx-submission mini-protocol is understood but not gOuroboros's specific submission API.
- **What Claude would need**: gOuroboros API reference or example for transaction submission (local-tx-submission protocol).
- **Risk if coached without context**: Could fabricate the submission function signature or get the serialization format wrong.

**SLT 102.5: "I can set a time window that controls when a transaction is valid."**
- **Partial dimensions**: Cardano validity intervals (slot-based) are well understood, but Apollo's API for setting them is not.
- **What Claude would need**: Apollo API reference showing how to set `invalidBefore` and `invalidHereafter` (or equivalent) on a transaction.
- **Risk if coached without context**: Could explain the concept perfectly but give wrong Apollo code for setting the interval.

**SLT 102.6: "I can add simple metadata to a transaction."**
- **Partial dimensions**: Same pattern — strong on the Cardano metadata concept (label numbers, JSON metadata, auxiliary data) but Apollo's metadata API is unknown.
- **What Claude would need**: Apollo API reference showing how to attach metadata to a transaction.
- **Risk if coached without context**: Correct conceptual explanation but fabricated code example.

---

### Module: 201 - Reacting to Chain Events

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 201.1 | Set up Adder Starter Kit | Partial | Partial | Partial | Uncertain | Needs Context |
| 201.2 | Configure Adder to connect to a Node | Partial | Partial | Partial | Uncertain | Needs Context |
| 201.3 | Filter events by type, address, policy, pool | Partial | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 201.1: "I can set up and run the Adder Starter Kit to watch blockchain events."**
- **Partial dimensions**: All. Adder is known as a chain-following/indexing framework by Blink Labs but the Starter Kit's structure and setup are unknown.
- **What Claude would need**: Adder Starter Kit repository with README and setup instructions.
- **Risk if coached without context**: Could fabricate setup steps or configuration that doesn't match reality.

**SLT 201.2: "I can configure Adder to connect to a Cardano Node."**
- **Partial dimensions**: Adder's configuration format (YAML? TOML? Go code? environment variables?) is unknown.
- **What Claude would need**: Adder configuration reference showing node connection settings.
- **Risk if coached without context**: Could invent a configuration format that doesn't exist.

**SLT 201.3: "I can use Adder to filter blockchain events by type, address, policy, or stake pool."**
- **Partial dimensions**: Chain event filtering concept is understood but Adder's filtering API or configuration is not.
- **What Claude would need**: Adder documentation showing event filtering capabilities and configuration syntax.
- **Risk if coached without context**: Could fabricate filter syntax or miss available filter types.

---

### Module: 202 - Querying the Blockchain

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 202.1 | Explain indexers and evaluate trade-offs | Strong | N/A | Strong | Uncertain | Needs Context |
| 202.2 | Choose query-based approach over event handler | Strong | N/A | Partial | Current | Needs Context |
| 202.3 | Store and retrieve data using Adder | Partial | Weak | Weak | Uncertain | Needs Human |
| 202.4 | Select the right query provider | Partial | N/A | Partial | Uncertain | Needs Context |
| 202.5 | Combine live event data with historical query data | Partial | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 202.1: "I can explain what a blockchain indexer does and evaluate trade-offs for using one in my application."**
- **Partial dimension**: Knowledge Currency — the Cardano indexer landscape (db-sync, Scrolls, Ogmios, Kupo, Blockfrost) is known but the Go-specific options and their current state may have changed.
- **What Claude would need**: Current list of Cardano indexer options accessible from Go, with trade-off comparison.
- **Risk if coached without context**: Could recommend deprecated indexers or miss new Go-native options.

**SLT 202.2: "I can identify when an event handler isn't enough and choose a query-based approach instead."**
- **Partial dimension**: Learner Assessment — the architectural reasoning is universal, but evaluating a student's answer requires knowing Adder's specific capabilities and limitations.
- **What Claude would need**: Adder documentation on what it can and cannot index, and when you need a separate query provider.
- **Risk if coached without context**: Could accept or reject student reasoning based on incorrect assumptions about Adder's capabilities.

**SLT 202.3: "I can store and retrieve data using Adder."**
- **Weak dimensions**: Code Demonstration — no knowledge of Adder's storage API. Unknown whether it uses an embedded database, external DB, or custom storage backend. Learner Assessment — cannot evaluate what cannot be written.
- **What Claude would need**: Adder API reference for data storage and retrieval. Example code showing the storage flow.
- **Risk if coached without context**: Would fabricate the entire storage mechanism. Could teach patterns from a completely different system.

**SLT 202.4: "I can select the right query provider for my application."**
- **Partial dimensions**: Some providers are known but the Go-specific integration landscape is uncertain.
- **What Claude would need**: Comparison of Cardano query providers available for Go applications, with integration examples.
- **Risk if coached without context**: Could recommend providers that don't have good Go client libraries.

**SLT 202.5: "I can combine live event data with historical query data to build a more complete picture of blockchain activity."**
- **Partial dimensions**: The architectural pattern is understood but not the specific Adder + query provider integration.
- **What Claude would need**: Example code showing Adder events combined with a query provider in a Go application.
- **Risk if coached without context**: Could describe the pattern correctly in the abstract but give wrong integration code.

---

### Module: 203 - Applications and Smart Contracts

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 203.1 | Trace Aiken type to blueprint to Go code | Partial | Partial | Partial | Uncertain | Needs Context |
| 203.2 | Mint/burn with native script | Strong | Partial | Partial | Uncertain | Needs Context |
| 203.3 | Mint/burn with validator script | Partial | Weak | Partial | Uncertain | Needs Human |
| 203.4 | Unlock tokens from smart contract | Partial | Weak | Partial | Uncertain | Needs Human |
| 203.5 | Attach data to output (datum) | Strong | Partial | Partial | Uncertain | Needs Context |
| 203.6 | Pass input data via redeemer | Strong | Partial | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 203.1: "I can trace how a type defined in Aiken appears in a blueprint file and in Go code."**
- **Partial dimensions**: Aiken is known to produce CIP-57 blueprints, but the exact mapping from Aiken types to blueprint JSON to Go struct representations is uncertain. Aiken also evolves frequently.
- **What Claude would need**: An example showing an Aiken type definition, the resulting blueprint JSON, and the corresponding Go type used in Apollo or another library.
- **Risk if coached without context**: Could get the type mapping wrong, especially for complex types (unions, option types, nested records).

**SLT 203.2: "I can build a transaction that mints or burns tokens using a native script (no smart contract required)."**
- **Partial dimensions**: Code Demonstration and Assessment — Cardano native scripts (multisig, timelocks) and minting policy structure are well understood, but the Apollo API calls to construct this transaction are unknown.
- **What Claude would need**: Apollo API reference for building minting transactions with native scripts. Complete example code.
- **Risk if coached without context**: Perfect conceptual explanation but fabricated code.

**SLT 203.3: "I can build a transaction that mints or burns tokens using a validator script (smart contract)."**
- **Weak dimension**: Code Demonstration — script-based minting requires specific Apollo API calls for attaching script witnesses, redeemers, and collateral. This code cannot be written.
- **What Claude would need**: Apollo API reference for script-based minting transactions. Example code showing script witness attachment, redeemer construction, and collateral handling.
- **Risk if coached without context**: Would fabricate critical transaction-building code. Errors in script transactions can lock or burn funds.

**SLT 203.4: "I can build a transaction that unlocks tokens held by a smart contract."**
- **Weak dimension**: Code Demonstration — spending from a script address requires constructing the correct datum, redeemer, and script reference. The Apollo API calls for this are unknown.
- **What Claude would need**: Apollo API reference for spending script UTxOs. Example code showing datum provision, redeemer attachment, and script reference inclusion.
- **Risk if coached without context**: Same as 203.3 — fabricated code for fund-sensitive operations.

**SLT 203.5: "I can build a transaction that attaches data to a new output on the blockchain."**
- **Partial dimensions**: Code Demonstration — inline datums and datum hashes are well understood but Apollo's API for attaching them is unknown.
- **What Claude would need**: Apollo API reference for creating outputs with inline datums or datum hashes.
- **Risk if coached without context**: Could explain the concept well but give wrong Apollo code for datum attachment.

**SLT 203.6: "I can build a transaction that passes input data to a smart contract using a redeemer."**
- **Partial dimensions**: Same pattern — strong conceptual knowledge of redeemers, uncertain Apollo API.
- **What Claude would need**: Apollo API reference for constructing and attaching redeemers to transaction inputs.
- **Risk if coached without context**: Could explain redeemers perfectly but give wrong code for constructing them in Go.

---

### Module: 204 - Serializing Data

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 204.1 | Extract datums/redeemers from CBOR | Strong | Partial | Partial | Uncertain | Needs Context |
| 204.2 | Compile parameterized smart contract | Partial | Partial | Partial | Uncertain | Needs Context |
| 204.3 | Read blockchain event, identify smart contract interaction | Partial | Partial | Partial | Uncertain | Needs Context |
| 204.4 | Modify and re-encode CBOR in Go | Strong | Partial | Partial | Uncertain | Needs Context |
| 204.5 | Read protobuf spec and interpret data | Strong | Strong | Strong | Current | Ready |
| 204.6 | Use CDDL spec for Cardano transaction structure | Partial | N/A | Partial | Current | Needs Context |

#### Gap Analysis

**SLT 204.1: "I can extract smart contract data (datums and redeemers) from Cardano's binary format (CBOR)."**
- **Partial dimensions**: Code Demonstration — Go CBOR libraries (fxamacker/cbor) are known but Cardano's specific CBOR struct definitions and extraction patterns may use library-specific wrappers. Assessment — general CBOR decoding can be checked but Cardano-specific encoding requirements might be missed.
- **What Claude would need**: Example code showing CBOR decoding of Cardano datums and redeemers in Go, including the Go struct definitions that map to on-chain data.
- **Risk if coached without context**: Could teach generic CBOR decoding that doesn't account for Cardano's specific encoding conventions (e.g., indefinite-length arrays, constructor tags).

**SLT 204.2: "I can compile a smart contract that accepts parameters at deployment time."**
- **Partial dimensions**: Conceptual — parameterized contracts (applying parameters to UPLC) are understood but the Go tooling for this is uncertain. Code Demonstration — which library handles script parameter application in Go is unknown.
- **What Claude would need**: Example showing how to take a parameterized Aiken contract, apply parameters, and produce a final script hash in Go.
- **Risk if coached without context**: Could describe the concept correctly but give wrong tooling instructions.

**SLT 204.3: "I can read a blockchain event and identify the smart contract interaction inside it."**
- **Partial dimensions**: Cardano transaction structure is well understood but the Adder event format is uncertain.
- **What Claude would need**: Adder event data structure documentation showing how transactions are represented and where script interactions appear.
- **Risk if coached without context**: Could teach the right concepts using the wrong data access patterns.

**SLT 204.4: "I can modify decoded CBOR data structures in Go and re-encode them for use in transactions."**
- **Partial dimensions**: Code Demonstration — fxamacker/cbor round-tripping is known but Cardano-specific struct definitions may require custom marshaling. Assessment — general CBOR patterns can be checked but Cardano-specific tag requirements might be missed.
- **What Claude would need**: Example code showing CBOR decode-modify-reencode workflow for Cardano data in Go, including any custom CBOR tags or encoding requirements.
- **Risk if coached without context**: Could produce code that decodes correctly but re-encodes in a format the chain rejects.

**SLT 204.6: "I can use the CDDL specification as a reference to understand the structure of Cardano transaction data."**
- **Partial dimensions**: Conceptual — CDDL is known to define CBOR structures and Cardano publishes CDDL specs for the ledger, but deep practice in reading complex CDDL is limited. Assessment — basic interpretation can be checked but subtleties in Cardano's CDDL might be missed.
- **What Claude would need**: The Cardano ledger CDDL spec file with a guided walkthrough of key transaction structures.
- **Risk if coached without context**: Could misread CDDL rules for complex types (maps, tagged unions, optional fields) and teach incorrect structure interpretations.

---

### Module: 301 - Debugging

| # | SLT | Conceptual | Code Demo | Assessment | Currency | Overall |
|---|-----|-----------|-----------|------------|----------|---------|
| 301.1 | Diagnose cross-stack blockchain bugs | Partial | Partial | Partial | Uncertain | Needs Context |
| 301.2 | Use Go profiling and debugging tools | Strong | Strong | Strong | Current | Ready |
| 301.3 | Identify community resources for Cardano Go | Partial | N/A | Partial | Uncertain | Needs Context |

#### Gap Analysis

**SLT 301.1: "I can diagnose and fix bugs that span blockchain interactions, not just Go code."**
- **Partial dimensions**: Conceptual — general debugging and blockchain interaction patterns are understood, but diagnosing cross-cutting issues (transaction failures due to script evaluation errors, phase-2 validation failures, incorrect CBOR) requires specific Cardano Go tooling knowledge. Assessment — subtle cross-stack errors specific to the Blink Labs libraries might be missed.
- **What Claude would need**: Common error patterns and debugging workflows when using gOuroboros/Apollo/Adder together. Examples of real cross-stack bugs and their solutions.
- **Risk if coached without context**: Could teach general debugging principles that don't address the specific failure modes of the Cardano Go stack.

**SLT 301.3: "I can identify the right community resources, documentation, and support channels for troubleshooting Cardano Go development."**
- **Partial dimensions**: Some Cardano community resources are known (Cardano Forum, IOG Discord, developer portal) but the specific Go development channels and Blink Labs community resources are uncertain.
- **What Claude would need**: Current list of Cardano Go community resources: Blink Labs Discord/GitHub, Go-specific Cardano channels, relevant documentation sites.
- **Risk if coached without context**: Could point learners to generic Cardano resources while missing the Go-specific community, or link to dead/outdated channels.

---

## Lesson Prioritization

### Tier 1: Build First

SLTs rated Ready. These can be turned into lessons immediately.

| # | SLT | Module | Rationale |
|---|-----|--------|-----------|
| 099.1 | Find and fix bugs using debugging tools | 099 | Go debugging (delve, go vet, race detector) is core knowledge, stable, well-documented |
| 099.2 | Work with Go's type system | 099 | Go type system (interfaces, structs, generics) is core knowledge, stable |
| 099.3 | Build CLI tool with Cobra | 099 | Cobra is mature, stable, widely used — correct code and evaluation are reliable |
| 099.4 | Create web API with Fiber | 099 | Basic Fiber routing and server scaffolding are stable and covered by current lesson context |
| 100.1 | Describe Cardano and how it differs | 100 | Cardano fundamentals (eUTxO, native tokens, PoS) are well-established and stable |
| 204.5 | Read protobuf spec and interpret data | 204 | Protocol Buffers is a mature, stable standard with excellent Go support |
| 301.2 | Use Go profiling and debugging tools | 301 | Go pprof, trace, benchmarks are core knowledge, stable |

### Tier 2: Build with Context

SLTs rated Needs Context. These can be built once supplementary materials are gathered.

| # | SLT | Module | Context Needed |
|---|-----|--------|---------------|
| 100.2 | Explain Ouroboros consensus | 100 | Current Ouroboros variant explainer |
| 100.3 | Explain why Bursa was built | 100 | Bursa README/docs |
| 100.4 | Explain why Apollo was built | 100 | Apollo README/docs |
| 100.5 | Explain why Adder was built | 100 | Adder README/docs |
| 100.6 | Explain why Cardano Up was built | 100 | Cardano Up README/docs |
| 100.7 | Navigate course structure, set up dev env | 100 | Course setup guide |
| 101.1 | Set up gOuroboros Starter Kit | 101 | gOuroboros Starter Kit repo + README |
| 101.2 | Fetch specific blocks from Node | 101 | gOuroboros block fetching example |
| 101.3 | Check Node sync progress | 101 | gOuroboros chain tip query example |
| 101.4 | Fetch mempool information | 101 | gOuroboros local-tx-monitor example |
| 102.3 | Sign transaction manually and programmatically | 102 | Cardano tx signing example in Go |
| 102.4 | Submit transaction with gOuroboros | 102 | gOuroboros tx submission example |
| 102.5 | Set validity time window | 102 | Apollo validity interval API |
| 102.6 | Add metadata to transaction | 102 | Apollo metadata API |
| 201.1 | Set up Adder Starter Kit | 201 | Adder Starter Kit repo + README |
| 201.2 | Configure Adder to connect to Node | 201 | Adder configuration reference |
| 201.3 | Filter events by type/address/policy/pool | 201 | Adder filtering documentation |
| 202.1 | Explain indexers, evaluate trade-offs | 202 | Current Go-accessible Cardano indexer comparison |
| 202.2 | Choose query-based over event handler | 202 | Adder capability/limitation docs |
| 202.4 | Select right query provider | 202 | Go Cardano query provider comparison |
| 202.5 | Combine live and historical data | 202 | Integration example code |
| 203.1 | Trace Aiken type to blueprint to Go | 203 | Aiken-to-Go type mapping example |
| 203.2 | Mint/burn with native script | 203 | Apollo native script minting example |
| 203.5 | Attach data to output (datum) | 203 | Apollo datum attachment API |
| 203.6 | Pass input data via redeemer | 203 | Apollo redeemer API |
| 204.1 | Extract datums/redeemers from CBOR | 204 | Cardano CBOR decoding example in Go |
| 204.2 | Compile parameterized smart contract | 204 | Go tooling for script parameterization |
| 204.3 | Read event, identify smart contract interaction | 204 | Adder event structure documentation |
| 204.4 | Modify and re-encode CBOR | 204 | Cardano CBOR round-trip example in Go |
| 204.6 | Use CDDL spec for tx structure | 204 | Cardano ledger CDDL spec + walkthrough |
| 301.1 | Diagnose cross-stack blockchain bugs | 301 | Common Cardano Go error patterns |
| 301.3 | Identify community resources | 301 | Current Cardano Go community resource list |

### Tier 3: Defer

SLTs rated Needs Human. These require human expert input before lesson creation.

| # | SLT | Module | Reason for Deferral |
|---|-----|--------|-------------------|
| 102.1 | Create wallet with Bursa | 102 | Cannot write or evaluate Bursa code — API surface entirely unknown |
| 102.2 | Build simple transaction with Apollo | 102 | Cannot write Apollo transaction builder code — core API unknown |
| 202.3 | Store and retrieve data using Adder | 202 | Cannot write or evaluate Adder storage code — storage mechanism unknown |
| 203.3 | Mint/burn with validator script | 203 | Script-based minting requires specific Apollo API knowledge not available; errors can lock/burn funds |
| 203.4 | Unlock tokens from smart contract | 203 | Script spending requires specific Apollo API knowledge; fund-sensitive operation |

## Context Shopping List

Consolidated, deduplicated list of resources needed to move SLTs from Needs Context or Needs Human to Ready.

| Resource                                                        | Type                        | SLTs Unlocked                                                               | Priority   |
| --------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- | ---------- |
| Apollo API reference + transaction building examples            | Docs + Example Code         | 102.2, 102.3, 102.5, 102.6, 203.2, 203.3, 203.4, 203.5, 203.6, 204.1, 204.4 | **High**   |
| gOuroboros API reference + Starter Kit repo                     | Docs + Example Code         | 101.1, 101.2, 101.3, 101.4, 102.4                                           | **High**   |
| Adder documentation + Starter Kit repo                          | Docs + Example Code         | 201.1, 201.2, 201.3, 202.2, 202.3, 202.5, 204.3                             | **High**   |
| Bursa API reference + wallet creation example                   | Docs + Example Code         | 102.1, 102.3                                                                | **Medium** |
| Blink Labs library READMEs (Bursa, Apollo, Adder, Cardano Up)   | Docs                        | 100.3, 100.4, 100.5, 100.6                                                  | **Medium** |
| Aiken-to-Go type mapping example (type → blueprint → Go struct) | Example Code                | 203.1, 204.2                                                                | **Medium** |
| Cardano Go query provider comparison (current state)            | Docs                        | 202.1, 202.4                                                                | **Medium** |
| Cardano ledger CDDL specification + guided walkthrough          | Docs                        | 204.6                                                                       | **Medium** |
| Current Ouroboros consensus explainer                           | Docs                        | 100.2                                                                       | **Low**    |
| Course setup guide and repo structure                           | Docs                        | 100.7                                                                       | **Low**    |
| Common Cardano Go cross-stack error patterns                    | Example Code + Human Review | 301.1                                                                       | **Low**    |
| Current Cardano Go community resource list                      | Human Review                | 301.3                                                                       | **Low**    |

Priority is determined by leverage — resources that unlock the most SLTs rank highest.

## Set-Level Observations

- **Strength clusters**: Pure Go skills (099, 301.2) and stable Cardano concepts (100.1, 204.5) are solidly Ready. These represent the bookends of the course — general programming and general standards knowledge. The middle of the curriculum (where Go meets Cardano-specific libraries) is where readiness drops sharply.

- **Weakness clusters**: The Blink Labs library ecosystem (gOuroboros, Bursa, Apollo, Adder) is the single dominant weakness. Every SLT that involves writing or evaluating code using these libraries falls to Needs Context or Needs Human. This is not surprising — these are niche libraries with limited public documentation and small training data footprints.

- **Critical path**: The Apollo API reference is the highest-leverage item on the Context Shopping List. It unlocks or contributes to 11 SLTs spanning three modules (102, 203, 204). The gOuroboros and Adder documentation are tied for second, each unlocking 5–7 SLTs. Obtaining these three library references would move the assessment from 7 Ready to potentially 30+ Ready.

- **Sequencing implications**: The readiness pattern closely mirrors the course sequence — earlier modules (099, 100) are more Ready, and readiness degrades as the course deepens into library-specific work. This suggests the natural module order is already well-aligned with a "build what you can, gather context as you go" strategy. However, Module 204 (Serializing Data) has more partial-but-close SLTs than Module 203, suggesting 204 might be easier to unlock than 203 despite coming later in the sequence.

- **Confabulation risk zones**: The highest confabulation risk is in Modules 102 and 203, where Claude has strong conceptual knowledge of what a transaction *should* look like but weak knowledge of how Apollo constructs it. This is the most dangerous combination — it could produce plausible-looking code examples that use non-existent functions or wrong parameter orders, and a learner would have no way to know without trying to compile it. The five "Needs Human" SLTs all share this pattern.
