# SLT 204.4: I Can Modify Decoded CBOR Data Structures in Go and Re-encode Them for Use in Transactions

204.1 was decode-only. 204.3 was read-only. This lesson closes the loop: take a `PlutusData` you already pulled off the chain, change a field, and encode it back into CBOR you can hand to Apollo as a fresh datum or redeemer.

This is what every dApp does internally — read the current contract state, transform it, and post a new transaction that carries the new state forward.

---

## Prerequisites

- Completed 204.1 (decoding `PlutusData` from CBOR)
- Completed 203.4 (you have a real locked UTxO with an inline datum, or you can re-run 203.3)
- Apollo `^1.8.0`

---

## Background: Why Re-encode at All?

Datums are immutable once stored on a UTxO — you can't edit a datum in place. The standard pattern is:

1. **Read** the datum from the UTxO you are about to spend.
2. **Decode** it into a `PlutusData` value.
3. **Update** whichever field your business logic changes.
4. **Re-encode** the new value and attach it to a new output via `PayToContract`.

Step 3 is plain Go — you mutate fields on a struct. Steps 2 and 4 are `UnmarshalCBOR` and `MarshalCBOR` on `PlutusData`.

> **Round-trip rule:** if you decode and immediately re-encode without changes, the bytes must match. Apollo uses indefinite-length arrays for constructor fields exactly because Plutus does. Building a `PlutusDefArray` instead of `PlutusIndefArray` will produce different bytes and a different datum hash.

---

## The Example: Bumping a Counter Datum

Suppose the hello_world `Datum` from 203 was extended with a counter field:

```aiken
pub type Datum {
  owner: VerificationKeyHash,
  count: Int,
}
```

Blueprint: constructor 0, fields `[owner: #bytes, count: #integer]`.

You read the UTxO, increment `count`, lock the funds again at the same script address with the new datum.

---

## End-to-End: Decode → Mutate → Re-encode

```go
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/Salvionied/apollo/serialization/PlutusData"
)

// On-chain datum: { owner: <pkh>, count: 7 }.
const datumHex = "d8799f581c00000000000000000000000000000000000000000000000000000000" +
	"07ff"

func main() {
	raw, _ := hex.DecodeString(datumHex)

	// 1. Decode.
	var pd PlutusData.PlutusData
	if err := pd.UnmarshalCBOR(raw); err != nil {
		panic(err)
	}

	fields := pd.Value.(PlutusData.PlutusIndefArray)
	owner := fields[0].Value.([]byte)
	count := fields[1].Value.(*big.Int)
	fmt.Printf("Before: owner=%s count=%s\n", hex.EncodeToString(owner), count)

	// 2. Mutate. count = count + 1.
	newCount := new(big.Int).Add(count, big.NewInt(1))

	// 3. Rebuild a fresh PlutusData. Reuse owner bytes; replace the integer.
	newDatum := PlutusData.PlutusData{
		PlutusDataType: PlutusData.PlutusArray,
		TagNr:          121,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				PlutusDataType: PlutusData.PlutusBytes,
				Value:          owner,
			},
			PlutusData.PlutusData{
				PlutusDataType: PlutusData.PlutusInt,
				Value:          *newCount,
			},
		},
	}

	// 4. Encode.
	newBytes, err := newDatum.MarshalCBOR()
	if err != nil {
		panic(err)
	}
	fmt.Printf("After:  %s\n", hex.EncodeToString(newBytes))
}
```

Run it:

```bash
go run .
```

The output's `count` field shifts from `0x07` (7) to `0x08` (8). Everything else is byte-identical to the input.

---

## Wiring the New Datum Into a Transaction

The `newDatum` value drops straight into `PayToContract` (the same call you used in 203.3):

```go
apollob, _, err = apollob.
    AddLoadedUTxOs(walletUtxos...).
    CollectFrom(*scriptUtxo, redeemer).        // spend the old UTxO
    AttachV3Script(spendScript).
    AddRequiredSignerFromBech32(addr.String(), true, false).
    PayToContract(contractAddr, &newDatum, 5_000_000, true). // re-lock with bumped datum
    Complete()
```

This is the **state-machine pattern**: every interaction consumes a UTxO with the old state and creates a new UTxO with the new state, atomically. The validator typically enforces the transition rule — e.g. "new count must be old count + 1".

---

## Mutating Without Decoding the Whole Thing

If you only need to touch one field and want to skip the type assertions, you can use `Apollo`'s `Clone()` and edit the slice directly:

```go
mutated := pd.Clone()
fields := mutated.Value.(PlutusData.PlutusIndefArray)
fields[1] = PlutusData.PlutusData{
    PlutusDataType: PlutusData.PlutusInt,
    Value:          *new(big.Int).Add(fields[1].Value.(*big.Int), big.NewInt(1)),
}
mutated.Value = fields
```

`Clone()` deep-copies the `PlutusData`, so editing the local slice does not poke at the original — important if you keep the old value around for diffing or logging.

---

## Round-Trip Sanity Check

Always test your decode-mutate-encode pipeline against a known fixture:

```go
roundTripped, _ := newDatum.MarshalCBOR()
if !bytesEqual(roundTripped, expected) {
    panic("CBOR mismatch — datum hash will not match on-chain")
}
```

A single byte difference changes the datum's BLAKE2b hash. If your validator checks `Output.datum_hash`, the transaction will fail script execution even though the values look semantically identical.

---

## Common Errors

**`PlutusDefArray` instead of `PlutusIndefArray`** — Plutus constructors round-trip through indefinite arrays. Using the definite variant produces valid CBOR with a *different* hash.

**`Value: count` (passing `*big.Int` instead of `big.Int`)** — `PlutusInt` expects the dereferenced value. The `Clone()` helper preserves the right type for you; if you build manually, write `Value: *bigIntPointer`.

**Mutating `fields` after assigning to a new builder** — Go slices share backing arrays. If you keep a reference to `pd.Value.(PlutusData.PlutusIndefArray)` and mutate it, the original `pd` changes too. Use `Clone()` or copy the slice first.

**Forgetting that integers are arbitrary-precision** — `count: Int` in Aiken is `*big.Int` in Apollo, not `int64`. Adding via `new(big.Int).Add(...)` avoids overflow on values that legitimately exceed `int64`.

---

## Summary

- `pd.UnmarshalCBOR(raw)` → `PlutusData` you can poke at in Go.
- Mutate by replacing entries in `pd.Value.(PlutusData.PlutusIndefArray)` (or rebuilding the struct).
- `pd.MarshalCBOR()` → bytes ready for `PayToContract`, `CollectFrom`, or any other Apollo method.
- Round-trip without changes must produce identical bytes; if not, your encoding is non-canonical.

In 204.5 you will look at how protobuf — the schema language outside the Cardano binary world — describes data, and how to read it well enough to interpret events from API services.
