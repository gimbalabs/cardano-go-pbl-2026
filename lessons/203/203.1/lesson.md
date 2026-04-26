# SLT 203.1: I Can Trace How a Type Defined in Aiken Appears in a Blueprint File and in Go Code

Before you can interact with a smart contract using Apollo, you need to understand how contract's types are exposed after compilation and how you translate them into Go code. Aiken source code does not run on-chain, it compiles into a CBOR-encoded script. Your Go code must construct data that exactly matches this compiled structure, or the validator will reject the transaction.

This lesson traces a single Aiken type through three layers:

1. **Aiken source** — where the type is defined
2. **Blueprint** (`plutus.json`) — the machine-readable contract interface
3. **Go code** — how you represent that type as `PlutusData` in Apollo

---

## Prerequisites

- Completed Module 202 (basic Apollo transactions)
- Familiarity with what a smart contract is: funds locked by a script, unlocked by meeting conditions
- No Aiken experience required — you are reading Aiken output, not writing it

---

## Background

When your Go program sends data to a Cardano smart contract either as a datum or redeemer that data must be CBOR-encoded in exactly the right structure. The contract was compiled from Aiken source that defines precise types. If your Go code sends a differently-shaped value, the transaction will fail or the validator will reject it on-chain.

The `plutus.json` blueprint ([CIP-57](https://cips.cardano.org/cip/CIP-57)) is the bridge. Aiken generates it automatically when you run `aiken build`. It describes every validator's datum and redeemer schema in a format your Go code can read.

---

## The Example Contract: Hello World

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

- **`Datum`** — one field: `owner`, a 28-byte public key hash
- **`Redeemer`** — one field: `msg`, a byte array

The contract unlocks funds only when the transaction is signed by `owner` AND the redeemer message is `"Hello, World!"`.

---

## Layer 1 → Layer 2: Aiken to Blueprint

Running `aiken build` produces `plutus.json`. Here is the relevant excerpt:

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
        "schema": { "$ref": "#/definitions/hello_world~1Datum" }
      },
      "redeemer": {
        "title": "redeemer",
        "schema": { "$ref": "#/definitions/hello_world~1Redeemer" }
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
        { "title": "owner", "dataType": "#bytes" }
      ]
    },
    "hello_world/Redeemer": {
      "title": "Redeemer",
      "dataType": "constructor",
      "index": 0,
      "fields": [
        { "title": "msg", "dataType": "#bytes" }
      ]
    }
  }
}
```

### Reading the Blueprint

| Field | Meaning |
|-------|---------|
| `validators[].title` | Fully qualified validator name (e.g. `hello_world.spend`). Use Ctrl+F to find it. |
| `datum.schema` / `redeemer.schema` | Reference into `definitions` for the type shape. |
| `compiledCode` | Hex-encoded CBOR script — the actual on-chain code. |
| `hash` | Script hash. For spending validators: forms the script address. For minting validators: the policy ID. |
| `definitions` | All type definitions used by datums and redeemers. |

### Understanding Type Definitions

| Blueprint field | What it means |
|----------------|---------------|
| `"dataType": "constructor"` | A record type. Encodes as a Plutus `Constr` (CBOR-tagged structure). |
| `"index": 0` | Constructor variant. Single-variant types are always `0`. |
| `"fields": [...]` | Ordered list of fields. **Order must match exactly.** |
| `"#bytes"` | Byte array → `serialization.ByteString{Bytes: []byte{...}}` |
| `"#integer"` | Integer → `*big.NewInt(n)` from `math/big` |

---

## Layer 2 → Layer 3: Blueprint to Go

### Constructor Index → CBOR Tag

| Constructor index | CBOR tag |
|-------------------|----------|
| 0 | 121 |
| 1 | 122 |
| N (0–6) | 121 + N |

Single-variant record types are always index 0, tag 121.

### Code

```go
package main

import (
    "fmt"

    "github.com/Salvionied/apollo/serialization"
    "github.com/Salvionied/apollo/serialization/PlutusData"
)

// BuildDatum constructs the Datum for hello_world.
// Blueprint: hello_world/Datum — constructor 0, fields: [owner: #bytes]
func BuildDatum(owner []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121,
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: owner},
            },
        },
    }
}

// BuildRedeemer constructs the Redeemer for hello_world.
// Blueprint: hello_world/Redeemer — constructor 0, fields: [msg: #bytes]
// msg must be []byte("Hello, World!") to satisfy the contract.
func BuildRedeemer(msg []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121,
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
    ownerPkh := make([]byte, 28) // replace with real 28-byte payment key hash
    datum := BuildDatum(ownerPkh)
    redeemer := BuildRedeemer([]byte("Hello, World!"))

    fmt.Printf("Datum TagNr: %d\n", datum.TagNr)
    fmt.Printf("Redeemer TagNr: %d\n", redeemer.TagNr)
}
```

---

## The Three-Layer Trace

```
Aiken source             Blueprint (plutus.json)           Go (Apollo)
──────────────────       ──────────────────────────        ─────────────────────
pub type Datum {    →    "dataType": "constructor"   →    PlutusData{
  owner:                 "index": 0                         TagNr: 121,
    VerificationKeyHash  "fields": [{                       Value: PlutusIndefArray{
}                          "dataType": "#bytes"               PlutusData{
                         }]                                    Value: ByteString{...},
                                                            },
                                                          }}
```

---

## What to Look for in Any Blueprint

1. What is the `title` of the validator I need? (e.g. `hello_world.spend`)
2. Does it have a `datum`? Follow the `$ref` into `definitions`.
3. Does it have a `redeemer`? Same — follow the `$ref`.
4. What is the `dataType`? (`constructor`, `list`, `map`, `bytes`, `integer`)
5. What is the `index`? → CBOR tag = 121 + index.
6. What are the `fields`? You must match this order exactly in Go.

---

## Common Errors

**Wrong constructor index** — for enum types, each variant has a different `index`. Sending index 0 when the contract expects index 1 will fail on-chain.

**Wrong field order** — Plutus constructors are positional. Your `PlutusIndefArray` must match the blueprint's `fields` array order exactly.

**String vs bytes** — `"Hello, World!"` must be passed as `[]byte("Hello, World!")`. The blueprint type is `#bytes`, not a string.

---

## Summary

- Aiken compiles validator types into `plutus.json` (CIP-57).
- Each type is `constructor` + `index` + ordered `fields`.
- In Go: `PlutusData` with tag `121 + index` and a `PlutusIndefArray` of fields in exact order.
- `compiledCode` is what runs on-chain. `hash` is the validator's identity (script address or policy ID).

In 203.2 you will use these types to mint tokens with a native script.
