# SLT 203.6: I Can Build a Transaction That Passes Input Data to a Smart Contract Using a Redeemer

You have already used redeemers in 203.3 (minting) and 203.4 (spending). This lesson goes deeper: the three common redeemer patterns from a blueprint, and the exact difference in how Apollo accepts them for minting vs spending.

---

## Prerequisites

- Completed 203.1 (blueprint reading), 203.3 (minting redeemers), 203.4 (spending redeemers)
- A funded preprod wallet and Blockfrost API key

---

## Background: What Is a Redeemer?

A redeemer is the data your transaction passes to a script at execution time. Unlike a datum — which is set when the UTxO is created — the redeemer is chosen fresh each time you spend or mint.

Each redeemer in a transaction has four parts:

| Field | Description |
|-------|-------------|
| `Tag` | `SPEND`, `MINT`, `CERT`, or `REWARD` — matches the script purpose |
| `Index` | Position of the input/policy in the sorted transaction |
| `Data` | The `PlutusData` built from the blueprint |
| `ExUnits` | Memory and CPU cost — Apollo estimates this when `CollectFrom` or `MintAssetsWithRedeemer` is used |

### API Difference: Minting vs Spending

| Method | Second parameter | Notes |
|--------|-----------------|-------|
| `MintAssetsWithRedeemer(unit, data)` | `PlutusData.PlutusData` | Apollo wraps it into a `Redeemer` internally |
| `CollectFrom(utxo, redeemer)` | `Redeemer.Redeemer` | You construct the full struct with `Tag: Redeemer.SPEND` |

---

## Three Redeemer Patterns

### Pattern 1: Simple record (most common)

```aiken
pub type Redeemer {
  msg: ByteArray,
}
```

Blueprint: constructor 0, one `#bytes` field.

For **minting** (`MintAssetsWithRedeemer`):
```go
mintRedeemer := PlutusData.PlutusData{
    TagNr:  121,
    HasTag: true,
    Value: PlutusData.PlutusIndefArray{
        PlutusData.PlutusData{
            HasTag: false,
            Value:  serialization.ByteString{Bytes: []byte("Hello, World!")},
        },
    },
}
```

For **spending** (`CollectFrom`):
```go
spendRedeemer := Redeemer.Redeemer{
    Tag: Redeemer.SPEND,
    Data: PlutusData.PlutusData{
        TagNr:  121,
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: []byte("Hello, World!")},
            },
        },
    },
    ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
}
```

### Pattern 2: Enum (multiple variants)

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

Each variant is a different constructor index with no fields. The tag alone carries the meaning.

```go
// Mint variant: constructor 0 → tag 121, no fields
mintAction := PlutusData.PlutusData{
    TagNr:  121,
    HasTag: true,
    Value:  PlutusData.PlutusIndefArray{},
}

// Burn variant: constructor 1 → tag 122, no fields
burnAction := PlutusData.PlutusData{
    TagNr:  122,
    HasTag: true,
    Value:  PlutusData.PlutusIndefArray{},
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
    TagNr:  121,
    HasTag: true,
    Value: PlutusData.PlutusIndefArray{
        PlutusData.PlutusData{
            HasTag: false,
            Value:  serialization.ByteString{Bytes: recipientPkh},
        },
        PlutusData.PlutusData{
            HasTag: false,
            Value:  *big.NewInt(transferAmount),
        },
    },
}
```

---

## Full Example: Enum Redeemer for Controlled Minting

```aiken
// validators/controlled_mint.ak

pub type MintAction {
  Mint
  Burn
}

validator controlled_mint(owner: ByteArray) {
  mint(redeemer: MintAction, _policy_id: ByteArray, self: Transaction) {
    list.has(self.extra_signatories, owner) &&
    when redeemer is {
      Mint -> True
      Burn -> True
    }
  }
}
```

> This validator takes a parameter (`owner`). Parameterized validators must have the parameter applied before use — the compiled `plutus.json` must contain the version with the owner baked in. Applying parameters is covered in Module 204. For now, compile the validator with a hardcoded owner for testing.

```go
package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/constants"
	"github.com/Salvionied/apollo/serialization/PlutusData"
	"github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
)

const (
	BLOCKFROST_KEY = "preprodYOUR_KEY_HERE"
	MNEMONIC       = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
)

type Blueprint struct {
	Validators []struct {
		Title        string `json:"title"`
		CompiledCode string `json:"compiledCode"`
		Hash         string `json:"hash"`
	} `json:"validators"`
}

func loadScript(path, title string) (PlutusData.PlutusV3Script, string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}
	var bp Blueprint
	if err := json.Unmarshal(data, &bp); err != nil {
		return nil, "", err
	}
	for _, v := range bp.Validators {
		if v.Title == title {
			code, err := hex.DecodeString(v.CompiledCode)
			if err != nil {
				return nil, "", err
			}
			return PlutusData.PlutusV3Script(code), v.Hash, nil
		}
	}
	return nil, "", fmt.Errorf("validator %q not found", title)
}

// mintActionRedeemer: Mint variant, constructor 0, no fields.
// Passed directly to MintAssetsWithRedeemer as PlutusData.
func mintActionRedeemer() PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  121,
		HasTag: true,
		Value:  PlutusData.PlutusIndefArray{},
	}
}

// burnActionRedeemer: Burn variant, constructor 1, no fields.
func burnActionRedeemer() PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  122,
		HasTag: true,
		Value:  PlutusData.PlutusIndefArray{},
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

	mintScript, policyId, err := loadScript("plutus.json", "controlled_mint.mint")
	if err != nil {
		panic(err)
	}
	fmt.Println("Policy ID:", policyId)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	mintUnit := apollo.NewUnit(policyId, "ControlledToken", 100)
	redeemer := mintActionRedeemer() // swap to burnActionRedeemer() + quantity -100 to burn

	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		AttachV3Script(mintScript).
		MintAssetsWithRedeemer(mintUnit, redeemer).
		PayToAddressBech32(apollob.GetWallet().GetAddress().String(), 2_000_000, mintUnit).
		AddRequiredSignerFromBech32(apollob.GetWallet().GetAddress().String(), true, false).
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

To burn: replace `mintActionRedeemer()` with `burnActionRedeemer()` and use a negative quantity:

```go
mintUnit := apollo.NewUnit(policyId, "ControlledToken", -100)
redeemer := burnActionRedeemer()
```

---

## Redeemer Tag Reference

| Script purpose | Apollo constant | Used with |
|---------------|----------------|-----------|
| Spending a UTxO | `Redeemer.SPEND` | `CollectFrom` |
| Minting / burning | `Redeemer.MINT` | Set internally by `MintAssetsWithRedeemer` |

---

## Common Errors

**`Wrong constructor index for enum variant`** — `Mint` is index 0 (tag 121) and `Burn` is index 1 (tag 122). Swapping them compiles fine but fails the on-chain pattern match.

**`Passing Redeemer.Redeemer to MintAssetsWithRedeemer`** — that method takes `PlutusData.PlutusData`. Pass the data directly; Apollo wraps it internally.

**`Passing PlutusData.PlutusData to CollectFrom`** — that method takes `Redeemer.Redeemer`. Wrap your PlutusData with `Redeemer.Redeemer{Tag: Redeemer.SPEND, Data: ..., ExUnits: ...}`.

**`Parameterized validator hash mismatch`** — the policy ID is the hash of the script *after* the parameter is applied. A different parameter value gives a different policy ID. See Module 204.

---

## Module 203 Summary

| Lesson | What you built |
|--------|---------------|
| 203.1 | Read Aiken types from a blueprint and reproduce them as `PlutusData` in Go |
| 203.2 | Mint/burn tokens with a native script |
| 203.3 | Mint/burn tokens with a Plutus validator and redeemer |
| 203.4 | Lock funds at a script address and unlock them with a redeemer |
| 203.5 | Attach structured data (datums) to any output |
| 203.6 | Construct redeemers for simple records, enums, and multi-field types |

The pattern throughout: read the blueprint, build `PlutusData` that matches it exactly, wire it into Apollo with the right method, and let `Complete()` handle fee estimation and coin selection.
