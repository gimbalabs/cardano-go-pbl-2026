# SLT 203.1: I Can Trace How a Type Defined in Aiken Appears in a Blueprint File and in Go Code

Before interacting with a smart contract using Apollo, you must understand how its interface is exposed after compilation and translated into usable Go code. The point is Aiken source code does not run on-chain it is compiled into a CBOR-encoded script. Your Go code must construct data that exactly matches this compiled structure, or the validator will reject the transaction.

This lesson traces a single Aiken type through three layers:

1. The **Aiken source** — where the type is defined
2. The **blueprint** (`plutus.json`) — the human and machine readable contract interface
3. The **Go code** — how you represent that type as `PlutusData` in Apollo

By the end of this lesson, you will be able to read a `plutus.json` file, identify the datum and redeemer types, and write the corresponding Go structs that Apollo needs to build a valid transaction.

---

## Prerequisites

- Completed Module 102 (basic Apollo transactions)
- A passing familiarity with what a smart contract is (funds locked by a script, unlocked by meeting conditions)
- No Aiken experience required — you are reading Aiken, not writing it

---

## Background: The Type Problem

When your Go program sends data to a Cardano smart contract whether as a datum or a redeemer that data must be **CBOR-encoded in exactly the right structure**. The contract was compiled from Aiken source code that defines precise types. If your Go code sends a differently-shaped value, the transaction will either fail to build or the validator will reject it on-chain.

The `plutus.json` blueprint (defined by [CIP-57](https://cips.cardano.org/cip/CIP-57)) is the bridge. Aiken generates it automatically when you run `aiken build`. It describes every validator's datum and redeemer schema in a JSON format that off-chain tools — including your Go code — can read.

Your job as the off-chain developer is to read that schema and reproduce the type precisely in Go.

---

## The Example Contract: Hello World

We'll use the canonical Aiken "Hello, World!" validator. Here is the full Aiken source:

```aiken
// validators/hello_world.ak

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

pub type Datum {
  owner: VerificationKeyHash,
}

pub type Redeemer {
  msg: ByteArray,
}

validator hello_world {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(Datum { owner }) = datum
    let must_say_hello = redeemer.msg == "Hello, World!"
    let must_be_signed = list.has(self.extra_signatories, owner)
    must_say_hello? && must_be_signed?
  }
}
```

Two things to notice:

- **`Datum`** — a record with one field: `owner`, typed as `VerificationKeyHash` (28-byte public key hash)
- **`Redeemer`** — a record with one field: `msg`, typed as `ByteArray`

The contract unlocks funds only when the transaction is signed by `owner` AND the redeemer message is `"Hello, World!"`.

---

## Layer 1 → Layer 2: Aiken to Blueprint

Running `aiken build` produces `plutus.json`. Here is the relevant excerpt for this validator to the offchain, this is what helps your Go code communicate with the written Aiken code:

```json
{
  "preamble": {
    "title": "hello-world",
    "version": "0.0.0",
    "plutusVersion": "v3"
  },
  "validators": [
    {
      "title": "hello_world.spend",
      "datum": {
        "title": "datum",
        "schema": {
          "$ref": "#/definitions/hello_world~1Datum"
        }
      },
      "redeemer": {
        "title": "redeemer",
        "schema": {
          "$ref": "#/definitions/hello_world~1Redeemer"
        }
      },
      "compiledCode": "5901...",
      "hash": "abc123..."
    }
  ],
  "definitions": {
    "hello_world/Datum": {
      "title": "Datum",
      "dataType": "constructor",
      "index": 0,
      "fields": [
        {
          "title": "owner",
          "dataType": "#bytes"
        }
      ]
    },
    "hello_world/Redeemer": {
      "title": "Redeemer",
      "dataType": "constructor",
      "index": 0,
      "fields": [
        {
          "title": "msg",
          "dataType": "#bytes"
        }
      ]
    }
  }
}
```

### Reading the Blueprint

There are key fields in `plutus.json` you must understand to correctly interact with a validator:

| Field | Meaning |
|------|--------|
| `validators` | List of compiled validators available for use which is all functions that start with the keyword **validator** in your aiken code. |
| `validators.title` | Fully qualified validator name with validator purpose, this is helpful to check for each validator data, quick `ctrl+F` then search your validator name to find associated data (e.g. `hello_world.spend`)|
| `datum.schema` | Reference to the datum type definition in `definitions`. |
| `redeemer.schema` | Reference to the redeemer type definition in `definitions`. |
| `compiledCode` | CBOR-encoded Plutus script. This is the **actual on-chain code** executed by the validator. |
| `hash` | Script hash derived from `compiledCode`. Used to form script addresses if a spending validator and policyId if a minting validator also used to identify the validator on-chain. |
| `definitions` | All type definitions used by the contract (datum, redeemer, etc.). |

---

### Understanding Type Definitions

Each referenced type in `definitions` describes how data must be encoded:

| Blueprint field | What it means |
|----------------|---------------|
| `"dataType": "constructor"` | A product type (record). Encodes as a Plutus `Constr` (CBOR-tagged structure). |
| `"index": 0` | Constructor index (variant). Single-variant types are always `0`. |
| `"fields": [...]` | Ordered list of fields. **Order must be preserved exactly.** |
| `"#bytes"` | Raw byte array → `[]byte` in Go |
| `"#integer"` | Integer → `int64` in Go |

---

### Key Takeaways

- `compiledCode` is what actually runs on-chain — not your Aiken source.
- `hash` (script hash) is the validator’s on-chain identity.
- `definitions` specify the **exact shape of datum and redeemer**.
- Your Go code must construct data that matches these definitions **exactly**, including constructor index and field order.

---

## Layer 2 → Layer 3: Blueprint to Go

Apollo represents Plutus data using types from the `serialization` and `PlutusData` packages. The core types are:

- **`PlutusData.PlutusData`** — the top-level wrapper for any on-chain value
- **`PlutusData.PlutusIndefArray`** — an ordered list of fields (the constructor's contents)
- **`serialization.ByteString`** — a byte array field

Here is how you translate the blueprint types above into Go:

```go
package main

import (
    "github.com/Salvionied/apollo/serialization"
    "github.com/Salvionied/apollo/serialization/PlutusData"
)

// BuildDatum constructs the Datum for the hello_world validator.
//
// Blueprint: hello_world/Datum
//   dataType: constructor, index: 0
//   fields:   [{ title: "owner", dataType: "#bytes" }]
//
// owner is a 28-byte verification key hash derived from a wallet address.
func BuildDatum(owner []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121,  // constructor index 0 → CBOR tag 121
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: owner},
            },
        },
    }
}

// BuildRedeemer constructs the Redeemer for the hello_world validator.
//
// Blueprint: hello_world/Redeemer
//   dataType: constructor, index: 0
//   fields:   [{ title: "msg", dataType: "#bytes" }]
//
// msg must be the UTF-8 bytes of "Hello, World!" to satisfy the contract.
func BuildRedeemer(msg []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121,  // constructor index 0 → CBOR tag 121
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: msg},
            },
        },
    }
}

func main() {
    // Example: build both values for a hello_world transaction
    ownerPubKeyHash := []byte{ /* 28 bytes from your wallet */ }
    datum    := BuildDatum(ownerPubKeyHash)
    redeemer := BuildRedeemer([]byte("Hello, World!"))

    _ = datum
    _ = redeemer
    // You'll pass these into Apollo's transaction builder in 203.4
}
```

### Constructor Index → CBOR Tag

The blueprint gives you `"index": N`. Plutus encodes that index as a CBOR tag using this rule:

| Constructor index | CBOR tag |
|-------------------|----------|
| 0 | 121 |
| 1 | 122 |
| 2 | 123 |
| N (0–6) | 121 + N |

For the vast majority of single-variant record types you'll encounter, the answer is **tag 121**. Multi-variant types (enums) use higher indices — you'll see those in later lessons.

---

## The Three-Layer Trace, Summarised

```
Aiken source             Blueprint (plutus.json)           Go (Apollo)
────────────             ───────────────────────           ───────────
pub type Datum {    →    "dataType": "constructor"   →    PlutusData{
  owner:                 "index": 0                         TagNr: 121,
    VerificationKeyHash  "fields": [{                       Value: PlutusIndefArray{
}                          "dataType": "#bytes"               PlutusData{
                         }]                                    Value: ByteString{...}
                                                            }
                                                          }}
```

---

## What to Look for in Any Blueprint

When you encounter a new contract, open its `plutus.json` and work through these questions:

1. **What is the `title` of the validator I need?** (e.g. `hello_world.spend`)
2. **Does it have a `datum`?** Follow the `$ref` into `definitions`.
3. **Does it have a `redeemer`?** Same — follow the `$ref`.
4. **What is the `dataType`?** (`constructor`, `list`, `map`, `bytes`, `integer`)
5. **What is the `index`?** → CBOR tag = 121 + index.
6. **What are the `fields`?** You must match this order exactly in Go.

---

## Common Errors

**Wrong constructor index** — if a type has multiple variants, each has a different `index`. Sending index 0 when the contract expects index 1 will cause the validator to reject the transaction.

**Wrong field order** — Plutus constructors are positional, not named. The blueprint lists fields in order; your `PlutusIndefArray` must match that order exactly.

**String vs bytes** — `"Hello, World!"` must be passed as `[]byte("Hello, World!")`. The blueprint type is `#bytes`, not a string.

---

## Summary

- Aiken compiles your validator types into a `plutus.json` blueprint (CIP-57).
- The blueprint describes each datum and redeemer as `constructor` + `index` + ordered `fields`.
- In Apollo, you reproduce that as a `PlutusData` with CBOR tag `121 + index` and a `PlutusIndefArray` of field values in the correct order.
- Constructor index 0 → CBOR tag 121. This is the most common case.

In the next lesson (203.2) you'll build a transaction that mints tokens using a native script — no datum or redeemer required. The type-tracing skills from this lesson become essential when you reach validator-based minting (203.3) and script spending (203.4).
