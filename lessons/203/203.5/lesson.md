# SLT 203.5: I Can Build a Transaction That Attaches Data to a New Output on the Blockchain

Every UTxO on Cardano can carry a **datum** — structured data stored alongside the value. In 203.4 you used datums as a contract mechanism: the validator read the datum to decide whether to release funds. But datums have a broader use: any output at any address can carry on-chain data that contracts or off-chain indexers can read.

This lesson covers both patterns: a datum in the transaction witness set (attached to a regular output) and an inline datum stored directly in a UTxO.

---

## Prerequisites

- Completed 203.1 (`PlutusData` construction from blueprints)
- Completed 203.4 (basic `PayToContract` usage)
- A funded preprod wallet and Blockfrost API key

---

## Background: Two Datum Storage Strategies

| Strategy | How it works | When to use |
|----------|-------------|-------------|
| **Inline datum** | Datum bytes stored in the UTxO output itself | Default. Scripts and indexers can read it without extra lookup. |
| **Witness set datum** | Full datum in the transaction witness set; only hash in the output | Legacy pattern. Datum is available only for that transaction, not in UTxO state. |

`PayToContract(address, &datum, lovelace, isInline)` controls this via the last argument. Use `true` for inline.

---

## PlutusData Integer Fields

Integer fields in a blueprint (`"dataType": "#integer"`) are stored in `PlutusData.Value` as `big.Int`. Import `math/big` and use `*big.NewInt(n)`:

```go
import "math/big"

PlutusData.PlutusData{
    HasTag: false,
    Value:  *big.NewInt(2350),
}
```

---

## Setup

```bash
mkdir 203-datums && cd 203-datums
go mod init 203-datums
go get github.com/Salvionied/apollo
```

---

## Example 1: Datum Attached to a Regular Address Output

You can attach a datum to any output, including your own wallet address. The datum travels in the transaction witness set — it is visible on-chain for that transaction but is **not** stored in the UTxO itself.

```go
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/constants"
	"github.com/Salvionied/apollo/serialization"
	"github.com/Salvionied/apollo/serialization/PlutusData"
	"github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
)

const (
	BLOCKFROST_KEY   = "preprodYOUR_KEY_HERE"
	MNEMONIC         = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
	RECEIVER_ADDRESS = "addr_test1YOUR_RECEIVER_ADDRESS"
)

// buildRecord constructs a datum: { label: ByteArray, value: Int }
// Blueprint equivalent: constructor 0, fields: [#bytes, #integer]
// Integer fields use big.Int — import "math/big" and use *big.NewInt(n).
func buildRecord(label []byte, value int64) PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  121,
		HasTag: true,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				HasTag: false,
				Value:  serialization.ByteString{Bytes: label},
			},
			PlutusData.PlutusData{
				HasTag: false,
				Value:  *big.NewInt(value),
			},
		},
	}
}

func main() {
	bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
		constants.BLOCKFROST_BASE_URL_PREPROD,
		int(constants.PREPROD),
		BLOCKFROST_KEY,
	)
	if err != nil {
		panic(err)
	}

	apollob := apollo.New(&bfc)
	apollob, err = apollob.SetWalletFromMnemonic(MNEMONIC, constants.PREPROD)
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

	datum := buildRecord([]byte("temperature"), 2350) // represents 23.50°C × 100

	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		AttachDatum(&datum).
		PayToAddressBech32(RECEIVER_ADDRESS, 2_000_000).
		Complete()
	if err != nil {
		panic(err)
	}

	apollob = apollob.Sign()
	txId, err := apollob.Submit()
	if err != nil {
		panic(err)
	}

	fmt.Println("Tx hash:", hex.EncodeToString(txId.Payload))
}
```

After confirming, open the transaction on the explorer and inspect the datum tab on the output — you will see the CBOR-encoded record.

---

## Example 2: Inline Datum on a Script Address

This extends the lock pattern from 203.4 with a multi-field datum to show how field order matters.

Aiken type:

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

Field order: `count` first, `owner` second. Your Go code must match this exactly.

```go
import "math/big"

// buildCounterDatum: constructor 0, fields: [count: #integer, owner: #bytes]
// count must come before owner — field order is positional, not named.
func buildCounterDatum(count int64, owner []byte) PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  121,
		HasTag: true,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				HasTag: false,
				Value:  *big.NewInt(count),
			},
			PlutusData.PlutusData{
				HasTag: false,
				Value:  serialization.ByteString{Bytes: owner},
			},
		},
	}
}
```

Sending to a script address with an inline datum:

```go
walletPkh := apollob.GetWallet().GetAddress().PaymentPart // []byte
datum := buildCounterDatum(0, walletPkh)

apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    PayToContract(
        contractAddress, // Address.Address — built with Address.AddressFromBytes(...)
        &datum,
        3_000_000,
        true, // isInline: datum stored in the UTxO, not just the witness set
    ).
    Complete()
```

---

## Datum Field Types: Quick Reference

| Aiken type | Blueprint `dataType` | Go value in `PlutusData.Value` |
|-----------|----------------------|--------------------------------|
| `ByteArray` | `"#bytes"` | `serialization.ByteString{Bytes: []byte{...}}` |
| `Int` | `"#integer"` | `*big.NewInt(n)` from `math/big` |
| `Bool` (True) | `constructor, index: 1` | `PlutusData{TagNr: 122, HasTag: true, Value: PlutusIndefArray{}}` |
| `Bool` (False) | `constructor, index: 0` | `PlutusData{TagNr: 121, HasTag: true, Value: PlutusIndefArray{}}` |
| Nested record | `constructor, index: N` | Nested `PlutusData` with its own `TagNr` and `PlutusIndefArray` |

---

## Common Errors

**`Datum not visible on UTxO`** — `AttachDatum` puts the datum in the witness set of the current transaction only. It is not stored in the UTxO. Use `PayToContract(..., true)` to store it in the UTxO state.

**`Wrong field order`** — `PlutusIndefArray` is positional. Swapping `count` and `owner` in Go produces valid CBOR but the wrong data. The validator decodes them by position — it will read `count` as bytes and `owner` as an integer and fail.

**`Value: big.Int vs ByteString confusion`** — `#integer` fields must use `*big.NewInt(n)`. Passing `ByteString` where an integer is expected produces a CBOR type mismatch.

---

## Summary

- Any Cardano output can carry a datum, not only script addresses.
- `isInline: true` stores the datum in the UTxO (preferred). `AttachDatum` adds it to the current transaction's witness set only.
- Field order in `PlutusIndefArray` must exactly match the blueprint's `fields` array.
- `#integer` fields use `*big.NewInt(n)` from `math/big`. `#bytes` fields use `serialization.ByteString{Bytes: ...}`.

In 203.6 you will look at redeemers in more depth — enum types and multi-field redeemers.
