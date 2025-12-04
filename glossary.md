# Cardano Go Development Glossary

A glossary of terms used throughout the Cardano Go PBL (Project-Based Learning) Course). All definitions relate directly to Cardano, Go, Cardano-Go tooling, and the concepts required by the outline.

---

## A

### Adder

A Go-based event handler and blockchain indexer library built by Blink Labs. Used to:

* watch the chain in real time,
* filter events by address, policy ID, pool ID, or transaction type,
* store and retrieve indexed data,
* support applications that need to react to chain activity.

### Adder Starter Kit

A template project demonstrating how to configure Adder, connect it to a node, and filter or store chain events.

### Address

A Bech32-encoded identifier used to receive ADA or multi-assets. Required when building or filtering transactions.

### Apollo

A Go library for building, balancing, and finalizing Cardano transactions. Provides a fluent builder API:

```go
apolloBE.
  AddLoadedUTxOs(...).
  PayToAddressBech32(...).
  AddRequiredSigner(...).
  Complete()
```

---

## B

### Bech32

The human-readable encoding format used for Cardano addresses. Used throughout Bursa, Apollo, and Adder.

### Block

A batch of transactions produced by Ouroboros consensus. In Cardano Go development, blocks can be:

* fetched over Node-to-Node,
* inspected for metadata,
* filtered in Adder event streams.

### Bursa

A Go-based CLI wallet and programmatic signing tool. Used to:

* generate and manage keys,
* inspect and list UTxOs,
* sign transactions manually or programmatically,
* create simple wallets for development.

---

## C

### CBOR (Concise Binary Object Representation)

Binary format used for encoding Cardano transactions, datums, redeemers, scripts, and blocks. Essential for:

* serializing transactions,
* decoding transaction bodies,
* reading datums and redeemers.

### CDDL (Concise Data Definition Language)

A specification format used to describe CBOR structures—such as Cardano transaction layout. Helpful for understanding Module 204.

### CIP (Cardano Improvement Proposal)

Formal specification used to define standards in Cardano. Relevant primarily for transaction formats and serialization.

### Cobra

A Golang CLI framework used in Module 099 to build command-line tools like the DNS CLI.

### Complete()

The final method in Apollo's transaction builder that assembles all transaction components (inputs, outputs, metadata, witnesses) into a valid transaction.

### Cardano Up

A Go-based tool that automates installation and environment setup for Cardano node components. Simplifies onboarding for new developers.

---

## D

### Datum

A piece of on-chain data attached to a UTxO. Used for:

* storing state,
* interacting with validator scripts,
* reading deserialized CBOR.

### Deserialization

Turning CBOR bytes into Go structures. Essential for understanding transaction internals.

---

## E

### Event Handler

Adder’s system for reacting to new blockchain events (e.g., UTxOs spent, tokens minted, transactions included in a block).

---

## F

### Fiber

A Go web framework used in Module 099 to build REST APIs.

### Filtering

The act of selecting specific chain data using Adder based on:

* address,
* policy ID,
* pool ID,
* transaction type.

---

## G

### Gimbalabs Way of Learning

Goes with module 100.7 - I know how this course works and about to get hands dirty

### gOuroboros

A Go library enabling:

* Node-to-Node communication (fetching blocks),
* Node-to-Client communication (mempool, sync status),
* submitting transactions.

This is core to Modules 101 and 102.

---

## H

### Hash

Hex-encoded digest identifying:

* transactions,
* blocks,
* scripts,
* policy IDs.

---

## I

### Indexer

A system—like Adder—that transforms blockchain data into an application-friendly, queryable format. Needed when global or historical data must be retrieved.

---

## M

### Metadata (Transaction Metadata)

Additional key/value data included in a transaction. Built using Apollo.

### Mempool

A node’s temporary collection of unconfirmed transactions. Queried via Node-to-Client.

---

## N

### Nabu

[Nabu on X](https://x.com/NabuVPN)

### Native Script

A simple rule-based script (no Plutus) used for minting and burning tokens using conditions such as required signatures or time locks.

### Node-to-Client (N2C)

Local communication interface used for querying mempool status, chain sync, and submitting transactions.

### Node-to-Node (N2N)

Peer-to-peer protocol used to:

* fetch blocks,
* observe network data,
* sync with a remote node.

---

## O

### Ouroboros

Cardano’s proof-of-stake consensus protocol. Concepts include:

* epochs and slots,
* block production,
* stake pools.

---

## P

### Parameterized validator script

for module 204.2

### Policy ID

The identifier for a multi-asset minting policy. Used heavily in filtering and in mint/burn scripts.

### Protobuf

Serialization format used for many Node-to-Node and Node-to-Client messages. in 204.5

---

## R

### Redeemer

Input provided to a validator script when spending a UTxO controlled by that script. Key for unlocking script-locked tokens.

### Rollback

A temporary reversal of part of the blockchain when the node switches to a better chain fragment. Applications using Adder or gOuroboros must handle rollbacks by:

* reverting previously indexed events,
* re-applying events from the new chain,
* ensuring state reflects the canonical chain.

### Rollbacks (Event Handling)

In event-driven systems like Adder, rollbacks can:

* invalidate previously processed events,
* require removing stored state related to orphaned blocks,
* trigger reprocessing of transactions from the accepted chain.

Understanding rollbacks is essential for any long-running Cardano Go application.

---

## S

### Script / Validator Script

A program (Plutus or native) controlling how UTxOs can be spent.

### Serialization

Encoding Go data structures into CBOR or protobuf for sending to a node.

### Slot

A discrete time unit in Ouroboros. Validity intervals use slots.

### Sync State

Indicates how close a node is to tip of chain. Queried via N2C or N2N.

---

## T

### Transaction

A signed structure defining:

* consumed UTxOs,
* created UTxOs,
* metadata,
* required signatures,
* optional scripts.

### Transaction Builder

Apollo’s pattern for composing transactions step by step.

---

## U

### UTxO (Unspent Transaction Output)

The fundamental state model of Cardano. Used in:

* Bursa (loading UTxOs),
* Apollo (consuming and producing UTxOs),
* Adder (monitoring changes),
* script interactions.

---

## V

### Validity Interval

The time range (expressed in slots) during which a transaction is valid.

---

## W

### Wallet (Bursa)

A programmatic wallet for:

* key management,
* signing,
* generating addresses,
* listing UTxOs.

