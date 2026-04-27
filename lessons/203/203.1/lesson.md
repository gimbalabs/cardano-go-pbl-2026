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

The `plutus.json` blueprint ([CIP-57](https://cips.cardano.org/cip/CIP-57)) is the bridge. Aiken generates it automatically when you run `aiken build`. It describes every validator's datum, redeemer schema and parameter formation if applicable in a format your Go code can read.

---

## The Example Contract: Hello World

we would continue to use this aiken code till the end of this module

```aiken
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
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
    let must_say_hello = redeemer.msg == "HelloSpendRedeemer"
    let must_be_signed = list.has(self.extra_signatories, owner)
    must_say_hello? && must_be_signed?
  }

  mint(
    redeemer: Redeemer,
    _policy_id: PolicyId,
    _self: Transaction,
  ) {
    redeemer.msg == "HelloMintRedeemer"
  }

  else(_) {
    fail
  }
}

```

- **`Datum`** — one field: `owner`, a 28-byte public key hash
- **`Redeemer`** — one field: `msg`, a byte array

The spend handler unlocks funds when the transaction is signed by `owner` (from the datum) and the redeemer `msg` is `"HelloSpendRedeemer"`. The mint handler allows minting when the redeemer `msg` is `"HelloMintRedeemer"`.

---

## Layer 1 → Layer 2: Aiken to Blueprint

Running `aiken build` produces `plutus.json`. Here is the exact output:

```json
{
  "preamble": {
    "title": "emmanuel/lesson203_3",
    "description": "Aiken contracts for project 'emmanuel/lesson203_3'",
    "version": "0.0.0",
    "plutusVersion": "v3",
    "compiler": {
      "name": "Aiken",
      "version": "v1.1.21+unknown"
    },
    "license": "Apache-2.0"
  },
  "validators": [
    {
      "title": "lesson203_1.hello_world.spend",
      "datum": {
        "title": "datum",
        "schema": {
          "$ref": "#/definitions/lesson203_1~1Datum"
        }
      },
      "redeemer": {
        "title": "redeemer",
        "schema": {
          "$ref": "#/definitions/lesson203_1~1Redeemer"
        }
      },
      "compiledCode": "59015201010029800aba2aba1aab9faab9eaab9dab9a488888966002664464653001300637540032259800980298041baa002899192cc004c03800a0071640306eb8c030004c024dd50014590074c024012601200491112cc004cdc3a4004009132332233006004159800980518069baa0018acc004cdc79bae3010300e375400891011248656c6c6f5370656e6452656465656d657200899199119801001000912cc00400629422b30013371e6eb8c04c00400e2946266004004602800280790121bac301130123012301230123012301230123012300f375400c6eb8c040c038dd5180818071baa0018a504031164030601c002601c601e00260166ea80162b3001300700489919802001099b8f375c601c60186ea800922011148656c6c6f4d696e7452656465656d657200375c601a60166ea80162c80490090c020c024004c020008c00cdd50039b874800229344d95900101",
      "hash": "837ff340bc109fd82aa73724d0f8234cf84a7da1cfa84f0378b74f89"
    },
    {
      "title": "lesson203_1.hello_world.mint",
      "redeemer": {
        "title": "redeemer",
        "schema": {
          "$ref": "#/definitions/lesson203_1~1Redeemer"
        }
      },
      "compiledCode": "59015201010029800aba2aba1aab9faab9eaab9dab9a488888966002664464653001300637540032259800980298041baa002899192cc004c03800a0071640306eb8c030004c024dd50014590074c024012601200491112cc004cdc3a4004009132332233006004159800980518069baa0018acc004cdc79bae3010300e375400891011248656c6c6f5370656e6452656465656d657200899199119801001000912cc00400629422b30013371e6eb8c04c00400e2946266004004602800280790121bac301130123012301230123012301230123012300f375400c6eb8c040c038dd5180818071baa0018a504031164030601c002601c601e00260166ea80162b3001300700489919802001099b8f375c601c60186ea800922011148656c6c6f4d696e7452656465656d657200375c601a60166ea80162c80490090c020c024004c020008c00cdd50039b874800229344d95900101",
      "hash": "837ff340bc109fd82aa73724d0f8234cf84a7da1cfa84f0378b74f89"
    },
    {
      "title": "lesson203_1.hello_world.else",
      "redeemer": {
        "schema": {}
      },
      "compiledCode": "59015201010029800aba2aba1aab9faab9eaab9dab9a488888966002664464653001300637540032259800980298041baa002899192cc004c03800a0071640306eb8c030004c024dd50014590074c024012601200491112cc004cdc3a4004009132332233006004159800980518069baa0018acc004cdc79bae3010300e375400891011248656c6c6f5370656e6452656465656d657200899199119801001000912cc00400629422b30013371e6eb8c04c00400e2946266004004602800280790121bac301130123012301230123012301230123012300f375400c6eb8c040c038dd5180818071baa0018a504031164030601c002601c601e00260166ea80162b3001300700489919802001099b8f375c601c60186ea800922011148656c6c6f4d696e7452656465656d657200375c601a60166ea80162c80490090c020c024004c020008c00cdd50039b874800229344d95900101",
      "hash": "837ff340bc109fd82aa73724d0f8234cf84a7da1cfa84f0378b74f89"
    }
  ],
  "definitions": {
    "ByteArray": {
      "dataType": "bytes"
    },
    "aiken/crypto/VerificationKeyHash": {
      "title": "VerificationKeyHash",
      "dataType": "bytes"
    },
    "lesson203_1/Datum": {
      "title": "Datum",
      "anyOf": [
        {
          "title": "Datum",
          "dataType": "constructor",
          "index": 0,
          "fields": [
            {
              "title": "owner",
              "$ref": "#/definitions/aiken~1crypto~1VerificationKeyHash"
            }
          ]
        }
      ]
    },
    "lesson203_1/Redeemer": {
      "title": "Redeemer",
      "anyOf": [
        {
          "title": "Redeemer",
          "dataType": "constructor",
          "index": 0,
          "fields": [
            {
              "title": "msg",
              "$ref": "#/definitions/ByteArray"
            }
          ]
        }
      ]
    }
  }
}
```

### Reading the Blueprint

| Field                         | Meaning                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `validators[].title`          | Fully qualified validator name (e.g. `hello_world.spend`). Use Ctrl+F to find it.                                         |
| `validator[].datum.schema`    | Reference into `definitions` for the type shape, use cmd + click or ctrl + click to quickly access the datum definitions  |
| `validator[].redeemer.schema` | AReference into `definitions` for the type shape. use cmd + click or ctrl + click to quickly access the datum definitions |
| `compiledCode`                | Hex-encoded CBOR script — the actual on-chain code.                                                                       |
| `hash`                        | Script hash. For spending validators: forms the script address. For minting validators: the policy ID.                    |
| `definitions`                 | All type definitions used by datums and redeemers.                                                                        |

NOTE: In the case of parameterized validators, neither the compiled code nor its script hash is considered final until the parameters are fully applied. you would learn this in next Module lesson 204.2

### Code

```go
package main

import (
    "fmt"

    "github.com/Salvionied/apollo/serialization/PlutusData"
)

func BuildDatum(owner []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,
        TagNr:          121,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes,
                Value:          owner,
            },
        },
    }
}

func BuildRedeemer(msg []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,
        TagNr:          121,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes,
                Value:          msg,
            },
        },
    }
}

func main() {
    ownerPkh := make([]byte, 28)
    datum := BuildDatum(ownerPkh)
    redeemer := BuildRedeemer([]byte("HelloSpendRedeemer"))

    fmt.Printf("Datum TagNr: %d\n", datum.TagNr)
    fmt.Printf("Redeemer TagNr: %d\n", redeemer.TagNr)
}
```

### Understanding Type Definitions

| Blueprint field             | What it means                                                              |
| --------------------------- | -------------------------------------------------------------------------- |
| `"dataType": "constructor"` | A record type. Encodes as a Plutus `Constr` (CBOR-tagged structure).       |
| `"index": 0`                | Constructor variant. Single-variant types are always `0`.                  |
| `"fields": [...]`           | Ordered list of fields. **Order must match exactly.**                      |
| `"#bytes"`                  | Byte array → `PlutusData{PlutusDataType: PlutusBytes, Value: []byte{...}}` |

---

## Layer 2 → Layer 3: Blueprint to Go and reading plutus.json

- If you look closely at the plutus.json, find definitions["lesson203_1/Datum"]. Here's what you'll see:

```json
"lesson203_1/Datum": {
  "title": "Datum",
  "anyOf": [
    {
      "title": "Datum",
      "dataType": "constructor",
      "index": 0,
      "fields": [
        {
          "title": "owner",
          "$ref": "#/definitions/aiken~1crypto~1VerificationKeyHash"
        }
      ]
    }
  ]
}
```

Now follow the $ref for the owner field into definitions["aiken/crypto/VerificationKeyHash"]:

```json
"aiken/crypto/VerificationKeyHash": {
  "title": "VerificationKeyHash",
  "dataType": "bytes"
}
```

So working backwards, the complete picture is:

dataType: "constructor" → wrap everything in a PlutusArray with a CBOR tag
index: 0 → tag number is 121 (see the constructor index table below)
fields: [owner] → one field, a #bytes type, encoded as PlutusBytes

```go
func BuildDatum(owner []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,  // "dataType": "constructor"
        TagNr:          121,                      // "index": 0 → tag 121
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes, // "dataType": "bytes"
                Value:          owner,
            },
        },
    }
}
```

The same exact reading process applies to BuildRedeemer, find definitions["lesson203_1/Redeemer"], trace the $ref for the msg field, observe it is also #bytes, and you get the same structure with a different payload `([]byte("HelloSpendRedeemer"))`.

you can also use the same pattern to find these other types

## Other PlutusData Types

`#bytes` and `#constructor` are just two of the primitive types that can appear in a blueprint field. When reading any `definitions` block, you may encounter:

| Blueprint `dataType` | What it represents        | Go encoding                                                             |
| -------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `"integer"`          | Whole number              | `PlutusData{PlutusDataType: PlutusBigInt, Value: big.NewInt(n)}`           |
| `"list"`             | Ordered sequence of items | `PlutusData{PlutusDataType: PlutusArray, Value: PlutusIndefArray{...}}` |
| `"map"`              | Key-value pairs           | `PlutusData{PlutusDataType: PlutusMap, Value: ...}`                     |

### Constructor Index → CBOR Tag

| Constructor index | CBOR tag |
| ----------------- | -------- |
| 0                 | 121      |
| 1                 | 122      |
| N (0–6)           | 121 + N  |

Single-variant record types are always index 0, tag 121.

---

## The Three-Layer Trace

```
Aiken source             Blueprint (plutus.json)           Go (Apollo)
──────────────────       ──────────────────────────        ─────────────────────
pub type Datum {    →    "dataType": "constructor"   →    PlutusData{
  owner:                 "index": 0                         PlutusDataType: PlutusArray,
    VerificationKeyHash  "fields": [{                       TagNr: 121,
}                          "dataType": "#bytes"             Value: PlutusIndefArray{
                         }]                                  PlutusData.PlutusData{
                                                                  PlutusDataType: PlutusData.PlutusBytes,
                                                                  Value:          owner,
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

**String vs bytes** — `"HelloSpendRedeemer"` must be passed as `[]byte("HelloSpendRedeemer")`. The blueprint type is `#bytes`, not a string. A Go string and a byte slice serialize differently in CBOR.

---

## Summary

- Aiken compiles validator types into `plutus.json` (CIP-57).
- Each type is `constructor` + `index` + ordered `fields`.
- In Go: `PlutusData` with tag `121 + index` and a `PlutusIndefArray` of fields in exact order.
- `compiledCode` is what runs on-chain. `hash` is the validator's identity (script address or policy ID).

In 203.2 you will mint tokens with a native script. In 203.3–203.6 you will use these exact `PlutusData` structures to interact with the hello_world validator — locking, unlocking, and minting.
