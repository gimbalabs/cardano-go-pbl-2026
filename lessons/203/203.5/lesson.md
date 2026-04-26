# SLT 203.5: I Can Build a Transaction That Passes Input Data to a Smart Contract Using a Redeemer

You have already used redeemers in 203.3 (locking) and 203.4 (spending). This lesson explains what a redeemer is structurally, the three common redeemer patterns you will encounter in blueprints, and exactly how to construct `PlutusData` in Apollo.

---

## Prerequisites

- Completed 203.1 (blueprint reading and `PlutusData` construction)
- Completed 203.4 (spend redeemer)
- A funded preprod wallet and Blockfrost API key

---

## Background: What Is a Redeemer?

A redeemer is the data your transaction passes to a script at execution time. Unlike a datum — set when the UTxO is created — the redeemer is chosen fresh each time you spend or mint.

Each redeemer in a transaction is a `Redeemer.Redeemer` struct with four fields:

| Field | Description |
|-------|-------------|
| `Tag` | `SPEND`, `MINT`, `CERT`, or `REWARD` — matches the script purpose |
| `Index` | Position of the input/policy in the sorted transaction |
| `Data` | The `PlutusData.PlutusData` built from the blueprint |
| `ExUnits` | Memory and CPU cost — Apollo estimates when set to zero |

Both `CollectFrom` and `MintAssetsWithRedeemer` take a `Redeemer.Redeemer`. The only difference is the `Tag`:

| Operation | Apollo method | `Tag` |
|-----------|--------------|-------|
| Spend from script | `CollectFrom(utxo, redeemer)` | `Redeemer.SPEND` |
| Mint with Plutus | `MintAssetsWithRedeemer(unit, redeemer)` | `Redeemer.MINT` |

---

## PlutusData Field Reference

`PlutusData.PlutusData` has three relevant fields:

| Field | Purpose |
|-------|---------|
| `PlutusDataType` | `PlutusData.PlutusArray` for constructor types, `PlutusData.PlutusBytes` for byte fields, `PlutusData.PlutusInt` for integer fields |
| `TagNr` | CBOR constructor tag. `121 + index` for index 0–6 |
| `Value` | `PlutusData.PlutusIndefArray{...}` for constructors; `[]byte` for bytes; `*big.Int` for integers |

---

## The hello_world Redeemers

The hello_world validator from 203.1 uses the same `Redeemer` type for both handlers, with different accepted values:

| Handler | Expected `msg` | `Tag` |
|---------|---------------|-------|
| `spend` | `"HelloSpendRedeemer"` | `Redeemer.SPEND` |
| `mint` | `"HelloMintRedeemer"` | `Redeemer.MINT` |

Blueprint: `Redeemer` is constructor 0, one `#bytes` field → tag 121.

For **spending** (used in 203.4):
```go
spendRedeemer := Redeemer.Redeemer{
    Tag: Redeemer.SPEND,
    Data: PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,
        TagNr:          121,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes,
                Value:          []byte("HelloSpendRedeemer"),
            },
        },
    },
    ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
}
```

For **minting** (used in 203.6):
```go
mintRedeemer := Redeemer.Redeemer{
    Tag: Redeemer.MINT,
    Data: PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,
        TagNr:          121,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes,
                Value:          []byte("HelloMintRedeemer"),
            },
        },
    },
    ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
}
```

---

## Three Redeemer Patterns

### Pattern 1: Simple record (hello_world uses this)

```aiken
pub type Redeemer {
  msg: ByteArray,
}
```

Blueprint: constructor 0, one `#bytes` field → tag 121.

```go
Redeemer.Redeemer{
    Tag: Redeemer.SPEND, // or Redeemer.MINT
    Data: PlutusData.PlutusData{
        PlutusDataType: PlutusData.PlutusArray,
        TagNr:          121,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                PlutusDataType: PlutusData.PlutusBytes,
                Value:          []byte("your-message"),
            },
        },
    },
    ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
}
```

### Pattern 2: Enum (multiple variants, no fields)

```aiken
pub type Action {
  Mint
  Burn
}
```

Blueprint:
```json
"Action": {
  "anyOf": [
    { "title": "Mint", "dataType": "constructor", "index": 0, "fields": [] },
    { "title": "Burn", "dataType": "constructor", "index": 1, "fields": [] }
  ]
}
```

Each variant is a constructor index with no fields. The tag carries all meaning.

```go
// Mint variant: constructor 0 → tag 121, empty fields
mintAction := PlutusData.PlutusData{
    PlutusDataType: PlutusData.PlutusArray,
    TagNr:          121,
    Value:          PlutusData.PlutusIndefArray{},
}

// Burn variant: constructor 1 → tag 122, empty fields
burnAction := PlutusData.PlutusData{
    PlutusDataType: PlutusData.PlutusArray,
    TagNr:          122,
    Value:          PlutusData.PlutusIndefArray{},
}
```

### Pattern 3: Multi-field record

```aiken
pub type TransferRedeemer {
  recipient: ByteArray,
  amount: Int,
}
```

Blueprint: constructor 0, fields: `[recipient: #bytes, amount: #integer]`.

```go
import "math/big"

transfer := PlutusData.PlutusData{
    PlutusDataType: PlutusData.PlutusArray,
    TagNr:          121,
    Value: PlutusData.PlutusIndefArray{
        PlutusData.PlutusData{
            PlutusDataType: PlutusData.PlutusBytes,
            Value:          recipientPkh,
        },
        PlutusData.PlutusData{
            PlutusDataType: PlutusData.PlutusInt,
            Value:          *big.NewInt(transferAmount),
        },
    },
}
```

---

## Common Errors

**`unknown field HasTag`** — the `PlutusData` struct uses `PlutusDataType`, not `HasTag`. Use `PlutusData.PlutusArray` for constructors and `PlutusData.PlutusBytes` for byte fields.

**`Wrong constructor index for enum variant`** — `Mint` is index 0 (tag 121) and `Burn` is index 1 (tag 122). Swapping them compiles but fails the on-chain pattern match silently.

**`Wrong field order`** — `PlutusIndefArray` is positional. Swapping fields in a multi-field redeemer produces valid CBOR but incorrect data.

---

## Summary

- Both `CollectFrom` and `MintAssetsWithRedeemer` take `Redeemer.Redeemer`. The `Tag` is `Redeemer.SPEND` or `Redeemer.MINT`.
- Constructor types: `PlutusDataType: PlutusData.PlutusArray`, `TagNr: 121 + index`.
- Byte fields: `PlutusDataType: PlutusData.PlutusBytes`, `Value: []byte{...}`.
- Enum variants: `PlutusIndefArray{}` — no fields, constructor index is the discriminator.
- `ExUnits{Mem: 0, Steps: 0}` — Apollo estimates these during `Complete()` with Blockfrost.

In 203.6 you will use the hello_world mint redeemer to mint tokens with the Plutus validator.
