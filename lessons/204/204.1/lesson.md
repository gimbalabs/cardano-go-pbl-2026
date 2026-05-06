# SLT 204.1: I Can Extract Smart Contract Data (Datums and Redeemers) from Cardano's Binary Format (CBOR)

Every datum and redeemer that touches Cardano is **CBOR-encoded** before it reaches the chain. In Module 203 you built `PlutusData` values and Apollo silently encoded them for you. This lesson goes the other direction: take a raw CBOR byte string off the chain and decode it back into `PlutusData` you can inspect.

This is the skill behind every block explorer's "Datum" tab and every indexer that reasons about contract state.

---

## Prerequisites

- Completed Module 203 (you understand the shape of a `PlutusData` constructor)
- Familiarity with hex-encoded byte strings
- Apollo `^1.8.0`

---

## Background

**CBOR** ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949)) is a compact binary format. JSON-like values fit into ~30% of the bytes of equivalent JSON, with a defined encoding for tagged values, indefinite-length arrays, and arbitrary-precision integers — all of which Plutus uses.

A datum and a redeemer are just `PlutusData` values, so they share one CBOR shape:

| Plutus value | CBOR encoding |
|--------------|---------------|
| Constructor (`Datum {...}`) | Tagged array — tag = `121 + index` |
| `ByteArray` | Major type 2 (byte string) |
| `Int` | Major type 0/1 (positive/negative integer) |
| `List` | Major type 4 (array) |
| `Map` | Major type 5 (map) |

Apollo's `PlutusData` struct has a `UnmarshalCBOR([]byte) error` method. Hand it the raw bytes and it walks the CBOR stream, populating `PlutusDataType`, `TagNr`, and `Value` for you.

---

## The CBOR You Will Decode

Take the lock UTxO from 203.3. Its inline datum encodes `Datum { owner: <pkh> }` — constructor 0, one `#bytes` field. The on-chain CBOR (hex) looks like:

```
d8799f581c00000000000000000000000000000000000000000000000000000000ff
```

Reading byte by byte:

| Bytes | Meaning |
|-------|---------|
| `d8 79` | CBOR tag `121` — constructor index 0 |
| `9f` | Indefinite-length array start |
| `58 1c` | Byte string of length 28 |
| `00...00` | The 28-byte payment key hash |
| `ff` | Indefinite-length array break |

Everything you saw in 203.1 is right here, in 33 bytes.

---

## Setup

```bash
mkdir 204-decode && cd 204-decode
go mod init 204-decode
go get github.com/Salvionied/apollo
```

---

## Decoding a Datum

```go
package main

import (
	"encoding/hex"
	"fmt"

	"github.com/Salvionied/apollo/serialization/PlutusData"
)

func main() {
	// Inline datum bytes from a script UTxO (the 203.3 lock output).
	cborHex := "d8799f581c00000000000000000000000000000000000000000000000000000000ff"

	raw, err := hex.DecodeString(cborHex)
	if err != nil {
		panic(err)
	}

	var pd PlutusData.PlutusData
	if err := pd.UnmarshalCBOR(raw); err != nil {
		panic(err)
	}

	// Top-level constructor: PlutusArray + TagNr 121 (constructor index 0).
	fmt.Printf("Type:  %d\n", pd.PlutusDataType)
	fmt.Printf("TagNr: %d\n", pd.TagNr)

	// Value is PlutusIndefArray — pull the first (and only) field.
	fields := pd.Value.(PlutusData.PlutusIndefArray)
	owner := fields[0].Value.([]byte)

	fmt.Printf("owner: %s\n", hex.EncodeToString(owner))
}
```

Run it:

```bash
go run .
```

Expected output:

```
Type:  6
TagNr: 121
owner: 0000000000000000000000000000000000000000000000000000000000000000
```

`PlutusType` `6` is the constant for constructor types — Apollo uses an integer enum internally; constructors land at index `6`.

---

## Decoding a Redeemer

Redeemers come off the chain in the same shape. From the 203.4 unlock transaction, the spend redeemer hex is:

```
d8799f5212 48656c6c6f5370656e6452656465656d6572 ff
```

(spaces added for readability; the payload is the UTF-8 bytes of `"HelloSpendRedeemer"`).

```go
cborHex := "d8799f5212" + hex.EncodeToString([]byte("HelloSpendRedeemer")) + "ff"

raw, _ := hex.DecodeString(cborHex)

var pd PlutusData.PlutusData
_ = pd.UnmarshalCBOR(raw)

msg := pd.Value.(PlutusData.PlutusIndefArray)[0].Value.([]byte)
fmt.Println("msg:", string(msg)) // "HelloSpendRedeemer"
```

The decode path is identical to a datum. `PlutusData` does not distinguish them — only the transaction body does, via the `Tag` field on `Redeemer.Redeemer`.

---

## Where the Bytes Come From

You will rarely type CBOR hex by hand. In practice you fetch them:

| Source | How to read it |
|--------|---------------|
| **Inline datum on a UTxO** | `bfc.Utxos(addr)` returns UTxOs with `Output.Datum` populated; serialise `*PlutusData` via `MarshalCBOR()` if needed |
| **Datum hash + witness** | Query Blockfrost `/scripts/datum/{hash}/cbor` |
| **Redeemer in a confirmed tx** | Adder events expose the `Redeemers` field on Plutus transactions (see 204.3) |
| **Block explorer** | Cardanoscan and CExplorer show raw CBOR on the Datum / Redeemer tabs |

---

## Decoding Mistakes That Bite

**Wrong type assertion** — if the datum has an integer field, `Value` is `*big.Int`, not `[]byte`. Use a `switch` on `PlutusDataType` before asserting.

```go
switch field.PlutusDataType {
case PlutusData.PlutusBytes:
    b := field.Value.([]byte)
case PlutusData.PlutusInt:
    n := field.Value.(*big.Int)
case PlutusData.PlutusArray:
    children := field.Value.(PlutusData.PlutusIndefArray)
}
```

**Definite vs indefinite arrays** — Plutus emits indefinite arrays (`9f ... ff`). Apollo decodes both, but if you re-encode and the validator expects indefinite, the canonical hash will not match. Always rebuild with `PlutusIndefArray`.

**Untagged data is not a constructor** — only tagged arrays decode as constructors. A bare `[a, b]` (CBOR major type 4) is a list, not a `Datum`.

---

## Summary

- `PlutusData.UnmarshalCBOR(raw []byte) error` decodes any datum or redeemer.
- `TagNr - 121 = constructor index`. `Value` holds the fields (or the primitive payload).
- The same decoder works for datums, redeemers, and any nested `PlutusData`.
- Type-assert `Value` based on `PlutusDataType`, not on what you assume the shape is.

In 204.2 you will compile a parameterised validator and apply an `OutputReference` to it before deployment.
