# Limits of an Event Handler

In Module 201, you built event handlers with Adder that react to blockchain activity in real-time. That's powerful — but it only works for data that flows past *while your handler is running*. When you need to answer questions about the blockchain's current or historical state, event handlers are not enough. Knowing where this boundary falls helps you use the right tool for each job.

---

## Prerequisites

* Completed Module 201 (Reacting to Chain Events with Adder)
* Read Lesson 202.1 (The Role of an Indexer)

---

## What Event Handlers Can Do

An Adder event handler watches the chain tip and processes each block as it arrives. With the filters you built in Module 201, you can:

* Detect new transactions at a specific address
* Watch for tokens minted under a specific policy ID
* Track which stake pool produced each block
* React immediately — trigger a webhook, log an event, or update application state

This is real-time, forward-looking data. Your handler sees everything *from the moment it starts running*.

---

## What Event Handlers Cannot Do

Event handlers process a stream. They do not have memory of what came before, and they cannot look sideways at the broader ledger state. Here are concrete questions an event handler **cannot answer**:

**Historical questions:**
* "What transactions happened at this address last week?"
* "When was this token first minted?"

Your handler was not running last week. Even if it was, it did not store anything — events flow through and are gone.

**Current-state questions:**
* "What UTxOs exist at this address right now?"
* "What is the current datum at this script address?"

The current UTxO set is the result of every transaction since genesis. An event handler sees individual transactions, not the accumulated state they produce.

**Cross-event questions:**
* "How many unique addresses interacted with this contract today?"
* "What is the total value locked in this script?"

Answering these requires correlating data across many events. An event handler processes one event at a time with no built-in way to aggregate.

---

## The Boundary: Stream vs. State

The core distinction is:

| | Event Handler | Query |
|---|---|---|
| **Data** | Individual events as they arrive | Accumulated state or historical records |
| **Time** | Forward-looking from when it starts | Any point in past or present |
| **Scope** | One event at a time | Aggregations across many events |
| **Storage** | None — events flow through | Requires a database or external provider |

If your question can be answered by watching a single event as it arrives, an event handler is the right tool. If your question requires history, aggregation, or a snapshot of current state, you need a query — either from an external provider (Blockfrost, Koios, Kupo) or from a database you build yourself.

---

## Why This Matters for What's Next

Most real applications need both. An event handler tells you *something just happened*. A query tells you *what the world looks like now*. For example:

* Your handler detects a new transaction at a script address → you query the current UTxOs to decide how to respond
* Your handler detects a token mint → you query the full mint history to update a dashboard

In Lesson 202.3, you will add a storage layer to Adder so that events are persisted instead of lost. In 202.4 and 202.5, you will combine event data with queries from external providers. The pattern that emerges — **react with events, answer with queries** — is the foundation of most Cardano applications built with Go.

---

*Generated with Andamio Lesson Coach*
