# SLT 203.5: I Can Build a Transaction That Attaches Data to a New Output on the Blockchain

Every UTxO on Cardano can carry a piece of data called a **datum**. In 203.4 you used datums as a contract mechanism — locking funds so a validator could check them when spending. But datums have a broader use: they let any output carry structured, queryable data that anyone can read from the chain.

This lesson focuses on that broader use — attaching datums to outputs both with and without a contract address.

---

## Prerequisites

- Completed 203.1 (PlutusData construction from blueprints)
- Completed 203.4 (basic PayToContract usage)
- A funded preprod wallet

---

## Background: Two Ways to Store a Datum

Cardano supports two datum storage strategies, set when you create the output:

| Strategy | How it works | When to use |
|----------|-------------|-------------|
| **Inline datum** | Datum bytes stored directly in the UTxO output | Default choice — readable by scripts and off-chain tools without extra lookup |
| **Hash datum** | Only the datum hash stored in the output; full datum in the tx witness set | Legacy pattern — the spender must already know the datum to reconstruct it |

Apollo's `PayToContract` accepts a boolean `isInline` flag that controls this. For all modern contracts you should use inline datums.

---

## Use Cases for Datum-Carrying Outputs

Datums are not only for smart contracts. Common patterns include:

- **State outputs** — a contract's current state (counter, price, configuration) stored in the datum of a UTxO it controls
- **Oracle data** — an oracle service posts price data as a datum on a UTxO; other contracts reference it
- **NFT metadata** — project-specific metadata stored on-chain in a datum alongside the token

In this lesson you'll build both: a plain annotated output (data attached to a regular address) and a contract state output (data attached to a script address).

---

## Example 1: Datum on a Regular Address Output

A datum can be attached to any output, not just script addresses. This is useful for posting data on-chain that other contracts or off-chain indexers can read.

```go
package main

import (
    "encoding/hex"
    "fmt"

    "github.com/fxamacker/cbor/v2"
    "github.com/Salvionied/apollo"
    "github.com/Salvionied/apollo/serialization"
    "github.com/Salvionied/apollo/serialization/PlutusData"
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
    "github.com/Salvionied/apollo/constants"
)

// A simple on-chain record: { label: ByteArray, value: Int }
// Blueprint equivalent:
//   dataType: constructor, index: 0
//   fields: [{ dataType: "#bytes" }, { dataType: "#integer" }]
func buildRecord(label []byte, value int64) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121, // constructor 0
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: label},
            },
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.BigNum(value), // integer field
            },
        },
    }
}

func main() {
    bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
        constants.BLOCKFROST_BASE_URL_PREPROD,
        int(constants.PREPROD),
        "preprodYOUR_BLOCKFROST_KEY",
    )
    if err != nil {
        panic(err)
    }

    cc := apollo.NewEmptyBackend()
    apollob := apollo.New(&cc)
    SEED := "your mnemonic here"
    apollob, err = apollob.SetWalletFromMnemonic(SEED, constants.PREPROD)
    if err != nil {
        panic(err)
    }
    apollob, err = apollob.SetWalletAsChangeAddress()
    if err != nil {
        panic(err)
    }

    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // Build a datum carrying some structured data
    datum := buildRecord([]byte("temperature"), 2350) // e.g. 23.50°C × 100

    // AttachDatum adds the datum to the transaction witness set.
    // PayToAddressBech32 does not automatically attach datums — you must do it explicitly
    // when sending to a non-contract address.
    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        AttachDatum(&datum).
        PayToAddressBech32("addr_test1...RECEIVER_ADDRESS", 2_000_000).
        Complete()
    if err != nil {
        panic(err)
    }

    apollob = apollob.Sign()
    tx := apollob.GetTx()

    cborred, err := cbor.Marshal(tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("CBOR tx:", hex.EncodeToString(cborred))

    txId, err := bfc.SubmitTx(*tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("Tx hash:", hex.EncodeToString(txId.Payload))
}
```

> **Note on `AttachDatum` vs inline:** `AttachDatum` puts the datum in the **transaction witness set** — it's available on-chain for that transaction but not stored in the UTxO itself. To store the datum inside the UTxO (so it can be read later without the original transaction), use `PayToContract` with `isInline: true`.

---

## Example 2: Inline Datum on a Script Address (Contract State)

This is the pattern from 203.4 but now with a focus on the datum itself — a more complex multi-field type.

Imagine a contract that tracks a simple counter. The Aiken type would be:

```aiken
pub type CounterDatum {
  count: Int,
  owner: ByteArray,
}
```

Blueprint:
```json
"CounterDatum": {
  "dataType": "constructor",
  "index": 0,
  "fields": [
    { "title": "count",  "dataType": "#integer" },
    { "title": "owner",  "dataType": "#bytes"   }
  ]
}
```

Note the field order: `count` first, `owner` second. Your Go code must match this exactly.

```go
// BuildCounterDatum constructs the CounterDatum.
// Blueprint: constructor 0, fields: [count: #integer, owner: #bytes]
// Field order is positional — count must come before owner.
func buildCounterDatum(count int64, owner []byte) PlutusData.PlutusData {
    return PlutusData.PlutusData{
        TagNr:  121,
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            // Field 0: count (integer)
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.BigNum(count),
            },
            // Field 1: owner (bytes)
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: owner},
            },
        },
    }
}
```

Sending to the contract with an inline datum:

```go
datum := buildCounterDatum(0, walletPkh)

apollob, err = apollob.
    AddLoadedUTxOs(utxos...).
    PayToContract(
        contractAddress, // Address.Address of the script
        &datum,
        3_000_000, // lovelace
        true,      // isInline = true: datum stored in the UTxO
    ).
    Complete()
```

---

## Datum Field Types: Quick Reference

| Aiken type | Blueprint `dataType` | Go value |
|-----------|----------------------|----------|
| `ByteArray` | `"#bytes"` | `serialization.ByteString{Bytes: []byte{...}}` |
| `Int` | `"#integer"` | `serialization.BigNum(n)` |
| `Bool` (True) | `constructor, index: 1` | `PlutusData{TagNr: 122, HasTag: true, Value: PlutusIndefArray{}}` |
| `Bool` (False) | `constructor, index: 0` | `PlutusData{TagNr: 121, HasTag: true, Value: PlutusIndefArray{}}` |
| Nested record | `constructor, index: N` | Nested `PlutusData` with its own `TagNr` and `Value` |

---

## Step-by-Step Build

### Step 0: Setup

```bash
mkdir 203_5-datums && cd 203_5-datums
go mod init 203_5-datums
go get github.com/Salvionied/apollo
```

### Step 1: Build and run Example 1

Run the regular-address datum transaction. View it on the explorer and inspect the **datum** tab on the output — you should see your CBOR-encoded data.

### Step 2: Decode what you see

The explorer will show raw CBOR. Decode it mentally or with a CBOR tool:

```
d87980   → constructor 0, empty fields
d8799f   → constructor 0, indefinite array follows
```

Match what you see to what you built.

### Step 3: Build Example 2

Swap in a script address and use `PayToContract` with `isInline: true`. Verify the datum appears directly on the UTxO in the explorer (not just in the witness set).

---

## Common Errors

**`Datum not visible on output`** — if you used `AttachDatum` instead of `PayToContract(..., true)`, the datum is in the witness set of that transaction but not stored on the UTxO. Future transactions cannot read it from the chain state.

**`Wrong field order`** — if your blueprint lists `count` before `owner`, reversing them in Go will produce a valid CBOR value but the wrong one. The script will decode it and read `count` as bytes and `owner` as an integer, which will fail type checks inside the validator.

**`BigNum vs ByteString confusion`** — `#integer` fields must use `serialization.BigNum`, not `ByteString`. Passing bytes where an integer is expected produces a CBOR type mismatch that the script will reject.

---

## Summary

- Any Cardano output can carry a datum — not only script addresses.
- `isInline: true` stores the datum in the UTxO itself (preferred). `AttachDatum` adds it to the witness set of the current transaction only.
- Field order in `PlutusIndefArray` must exactly match the blueprint's `fields` array.
- Use `serialization.BigNum` for `#integer` fields and `serialization.ByteString` for `#bytes` fields.

In 203.6 you'll pass a redeemer into a smart contract — the other side of the datum/redeemer pair.
