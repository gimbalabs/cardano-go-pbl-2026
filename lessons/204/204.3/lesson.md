# SLT 204.3: I Can Read a Blockchain Event and Identify the Smart Contract Interaction Inside It

In Module 201 you used **Adder** to watch the chain. Each event Adder hands you is a JSON envelope with a `transactionCbor` payload — the entire transaction, byte for byte. Most events are plain transfers. A few are smart-contract interactions, and that is what this lesson is about: filtering for them, then decoding the CBOR enough to pull out the **redeemer** that drove the contract.

You will use **Adder** for the event stream and **Apollo's `PlutusData.UnmarshalCBOR`** (from 204.1) to interpret the contract data inside it.

---

## Prerequisites

- Completed Module 201 (Adder set up against a node)
- Completed 204.1 (decoding `PlutusData` from CBOR)
- Adder ≥ `0.27`, Apollo ≥ `1.8.0`
- A Cardano node socket or remote node address (see Module 101)

---

## Background: What Lives Inside a Plutus Transaction

A Cardano transaction is a CBOR map. The two fields that signal a smart-contract interaction:

| Field | What it tells you |
|-------|-------------------|
| `witness_set.plutus_v3_scripts` (key 6) | One or more Plutus V3 scripts attached |
| `witness_set.redeemers` (key 5) | Redeemer for each script execution — `{tag, index, data, ex_units}` |

If a transaction has either, a contract was invoked. The redeemer's `data` field is exactly the `PlutusData` you decoded in 204.1.

Adder does not decode this for you. It hands you the raw CBOR and lets you choose how deep to look.

---

## Setup

```bash
mkdir 204-events && cd 204-events
go mod init 204-events
go get github.com/blinklabs-io/adder
go get github.com/Salvionied/apollo
```

You will need access to a Cardano node — a public preprod relay works (see [Module 101](../../101/intro.md)) or a local Dolos node.

---

## Run Adder With a Transaction Filter

The fastest way to feel this end-to-end is the `adder` CLI. Filter by your validator's policy ID (the `hash` field from `plutus.json`) and emit JSON to stdout:

```bash
adder \
  -input chainsync \
  -input-chainsync-network preprod \
  -input-chainsync-address backbone.cardano-preprod.iohk.io:3001 \
  -filter-type input.transaction \
  -filter-policy <YOUR_POLICY_ID> \
  -output log
```

When your 204.2 mint lands, Adder prints an envelope like:

```json
{
  "type": "input.transaction",
  "context": { "slotNumber": 12345678, "transactionHash": "..." },
  "payload": {
    "transactionCbor": "84a4...",
    "outputs": [...],
    "fee": 234567
  }
}
```

`transactionCbor` is the whole signed transaction. The next step decodes it.

---

## Decode the Redeemer From a Stream Event

This Go program embeds Adder as a library, sets the same filter, and decodes each transaction's first redeemer using Apollo.

```go
package main

import (
	"context"
	"encoding/hex"
	"fmt"

	"github.com/blinklabs-io/adder/event"
	filterEvent "github.com/blinklabs-io/adder/filter/event"
	"github.com/blinklabs-io/adder/input/chainsync"
	"github.com/blinklabs-io/adder/pipeline"
	"github.com/blinklabs-io/adder/plugin/output/embedded"

	"github.com/Salvionied/apollo/serialization/PlutusData"
	"github.com/fxamacker/cbor/v2"
)

const (
	NETWORK    = "preprod"
	NODE_ADDR  = "backbone.cardano-preprod.iohk.io:3001"
	POLICY_ID  = "YOUR_POLICY_ID_HEX"
)

// Minimal Conway transaction shape — only the parts we care about.
// Tx is a 4-element array: [body, witness_set, is_valid, auxiliary_data].
// The witness_set is a CBOR map; redeemers live at key 5 in Conway.
type tx struct {
	_           struct{} `cbor:",toarray"`
	Body        cbor.RawMessage
	WitnessSet  map[uint64]cbor.RawMessage
	IsValid     bool
	AuxiliaryData cbor.RawMessage
}

// A redeemer is a 4-element array in the witness set: [tag, index, data, ex_units].
// Conway also supports a map encoding; this example handles the array form.
type redeemer struct {
	_       struct{} `cbor:",toarray"`
	Tag     uint8
	Index   uint64
	Data    cbor.RawMessage // the PlutusData bytes
	ExUnits cbor.RawMessage
}

func main() {
	in := chainsync.New(
		chainsync.WithNetwork(NETWORK),
		chainsync.WithAddress(NODE_ADDR),
	)

	filter := filterEvent.New(
		filterEvent.WithTypes([]string{"input.transaction"}),
	)

	out := embedded.New(embedded.WithCallbackFunc(func(evt event.Event) error {
		payload, ok := evt.Payload.(map[string]any)
		if !ok {
			return nil
		}
		txHex, _ := payload["transactionCbor"].(string)
		raw, err := hex.DecodeString(txHex)
		if err != nil {
			return nil
		}

		var t tx
		if err := cbor.Unmarshal(raw, &t); err != nil {
			return nil
		}

		// witness_set key 5 = redeemers. Absent → not a Plutus interaction.
		redeemerBytes, ok := t.WitnessSet[5]
		if !ok {
			return nil
		}

		var redeemers []redeemer
		if err := cbor.Unmarshal(redeemerBytes, &redeemers); err != nil {
			return nil
		}

		for _, r := range redeemers {
			var pd PlutusData.PlutusData
			if err := pd.UnmarshalCBOR(r.Data); err != nil {
				continue
			}
			fmt.Printf("tx=%s tag=%d idx=%d ctor=%d\n",
				payload["transactionCbor"].(string)[:16],
				r.Tag, r.Index, pd.TagNr-121,
			)

			// Pull the first field if the redeemer is the hello_world shape.
			if fields, ok := pd.Value.(PlutusData.PlutusIndefArray); ok && len(fields) > 0 {
				if msg, ok := fields[0].Value.([]byte); ok {
					fmt.Printf("  msg = %q\n", msg)
				}
			}
		}
		return nil
	}))

	p := pipeline.New()
	p.AddInput(in)
	p.AddFilter(filter)
	p.AddOutput(out)

	if err := p.Start(); err != nil {
		panic(err)
	}
	<-context.Background().Done()
}
```

Run it (point your wallet at the same policy ID and submit the 204.2 mint):

```bash
go run .
```

Output when the mint hits a block:

```
tx=84a40081825820...  tag=1 idx=0 ctor=0
  msg = "OneShot"
```

`tag=1` is the Conway encoding for `Mint`. `ctor=0` is the constructor index from the blueprint. `msg` is the decoded byte field.

---

## What Each Decoding Step Bought You

| Step | What you knew before | What you knew after |
|------|---------------------|---------------------|
| `cbor.Unmarshal(raw, &tx)` | Hex blob | Body / witness set / aux as separate fields |
| Look up `WitnessSet[5]` | "Maybe a Plutus tx?" | Confirmed: contains redeemers |
| `cbor.Unmarshal(..., &redeemers)` | A bag of redeemer bytes | Tag, index, exUnits per redeemer |
| `pd.UnmarshalCBOR(r.Data)` | Opaque `PlutusData` bytes | Constructor index + typed fields |

The exact same drill works for **datums on outputs** (key 0 of an `output_with_datum`), **inline scripts** (key 6 / 7 of the witness set for V2 / V3), and any other CBOR blob you pull off a chain event.

---

## Identifying the Interaction

Once you have decoded `pd`, you can identify which contract action ran:

| You see | Likely interaction |
|---------|-------------------|
| `tag=0` (spend), `ctor=0`, msg = `"HelloSpendRedeemer"` | 203.4 unlock |
| `tag=1` (mint), `ctor=0`, msg = `"HelloMintRedeemer"` | 203.6 mint |
| `tag=1`, no msg checked, parameter UTxO in inputs | 204.2 one-shot mint |

The redeemer alone narrows it; cross-checking the policy ID (which you already filtered on) pins it.

---

## Common Errors

**`cbor: cannot unmarshal map into Go value of type tx`** — Conway transactions are arrays, not maps. The `toarray` struct tag is required.

**Witness key not `5`** — earlier eras put redeemers at different keys. For Conway txs you are filtering by recent slots, so `5` is correct. For pre-Babbage txs, consult the era's CDDL (you will do exactly this in 204.6).

**Redeemers as a map, not an array** — Conway supports both encodings. If `cbor.Unmarshal(..., &redeemers)` fails, decode into `map[redeemerKey]redeemerValue` instead. Most wallets still emit the legacy array form.

---

## Summary

- Adder gives you `transactionCbor`. Everything past that is your decoder.
- Plutus interactions are detectable from the witness set: `plutus_*_scripts` keys plus `redeemers` (key `5` in Conway).
- Each redeemer's `data` is a `PlutusData` blob you decode with `pd.UnmarshalCBOR` from 204.1.
- The constructor index and the field bytes together tell you exactly which validator path executed.

In 204.4 you will go the other direction — take a decoded `PlutusData`, mutate a field, and re-encode it for use in your own transaction.
