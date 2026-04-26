# SLT 203.3: I Can Build a Transaction That Mints or Burns Tokens Using a Plutus Validator

In 203.2 you minted tokens with a native script — policy controlled by key signatures and time locks. Now you step up to **Plutus validators**, where the minting policy is arbitrary on-chain logic written in Aiken.

The key difference: a Plutus minting validator requires a **redeemer** — data your transaction passes to the script, which the script uses to decide whether minting is allowed.

---

## Prerequisites

- Completed 203.1 (reading blueprint types and constructing `PlutusData`)
- Completed 203.2 (native script minting)
- An Aiken project compiled with `aiken build`, giving you a `plutus.json`
- A funded preprod wallet and Blockfrost API key

---

## The Example Contract

```aiken
// validators/my_token.ak

pub type MintRedeemer {
  action: ByteArray,
}

validator my_token {
  mint(redeemer: MintRedeemer, _policy_id: ByteArray, _self: Transaction) {
    redeemer.action == "mint"
  }
}
```

After `aiken build`, `plutus.json` contains:

```json
"my_token/MintRedeemer": {
  "title": "MintRedeemer",
  "dataType": "constructor",
  "index": 0,
  "fields": [
    { "title": "action", "dataType": "#bytes" }
  ]
}
```

From 203.1: constructor index 0 → CBOR tag 121, one `#bytes` field.

The `hash` field in the validator entry is your **policy ID**. The `compiledCode` field is the hex-encoded CBOR script you attach to the transaction.

---

## Setup

```bash
mkdir 203-validator-mint && cd 203-validator-mint
go mod init 203-validator-mint
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` into this directory.

---

## Complete Example

```go
package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/constants"
	"github.com/Salvionied/apollo/serialization"
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

// loadScript decodes compiledCode from plutus.json and returns it as a PlutusV3Script.
// compiledCode is hex-encoded CBOR — hex.DecodeString gives the raw bytes Apollo needs.
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

// buildMintRedeemer returns the PlutusData for MintRedeemer.
// Blueprint: constructor 0, fields: [action: #bytes]
// MintAssetsWithRedeemer takes PlutusData directly, not a Redeemer struct.
func buildMintRedeemer(action []byte) PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  121,
		HasTag: true,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				HasTag: false,
				Value:  serialization.ByteString{Bytes: action},
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

	// compiledCode → hex.DecodeString → PlutusV3Script(bytes)
	// hash field from plutus.json is the policy ID (no derivation needed).
	mintScript, policyId, err := loadScript("plutus.json", "my_token.mint")
	if err != nil {
		panic(err)
	}
	fmt.Println("Policy ID:", policyId)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	redeemer := buildMintRedeemer([]byte("mint"))
	mintUnit := apollo.NewUnit(policyId, "MyToken", 1000)

	// MintAssetsWithRedeemer internally sets isEstimateRequired = true,
	// so SetEstimationExUnitsRequired() is redundant but kept for clarity.
	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		AttachV3Script(mintScript).
		MintAssetsWithRedeemer(mintUnit, redeemer).
		PayToAddressBech32(apollob.GetWallet().GetAddress().String(), 2_000_000, mintUnit).
		SetEstimationExUnitsRequired().
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

Run it:

```bash
go run .
```

Check [preprod.cardanoscan.io](https://preprod.cardanoscan.io). The policy ID should match the printed hash. Quantity should be 1000.

---

## How the Script Flows: compiledCode → Transaction

1. Aiken compiles the validator into flat-encoded Plutus Core
2. `aiken build` wraps that in CBOR and hex-encodes it → `compiledCode` in `plutus.json`
3. `hex.DecodeString(compiledCode)` gives you the CBOR bytes
4. `PlutusData.PlutusV3Script(bytes)` wraps those bytes as a V3 script
5. `AttachV3Script(script)` adds the script to the transaction witness set
6. The ledger executes it using the redeemer you provided

---

## Burning Tokens

Use a negative quantity with the same redeemer:

```go
burnUnit := apollo.NewUnit(policyId, "MyToken", -500)

apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    AttachV3Script(mintScript).
    MintAssetsWithRedeemer(burnUnit, redeemer).
    SetEstimationExUnitsRequired().
    Complete()
```

The tokens to burn must be present in a UTxO included in `AddLoadedUTxOs`.

---

## Native Script vs Validator Script

| | Native Script (203.2) | Validator Script (203.3) |
|---|---|---|
| Policy enforced by | Key signatures / time locks | Arbitrary on-chain logic |
| Redeemer required | No | Yes — `PlutusData` |
| Script attached via | `AttachNativeScript` | `AttachV3Script` |
| Apollo mint method | `MintAssets` | `MintAssetsWithRedeemer` |
| ExUnit estimation | Not needed | Set automatically by `MintAssetsWithRedeemer` |

---

## Common Errors

**`Script not found in witness set`** — you forgot `AttachV3Script`. The ledger cannot execute a script not in the transaction.

**`Redeemer data mismatch`** — the `PlutusData` shape must match the blueprint exactly. Wrong constructor index or wrong field type fails on-chain.

**Wrong script version** — if `plutus.json` says `"plutusVersion": "v3"` use `PlutusV3Script` / `AttachV3Script`. For `v2` use `PlutusV2Script` / `AttachV2Script`.

---

## Summary

- `compiledCode` from `plutus.json`: `hex.DecodeString` → `PlutusV3Script(bytes)` → `AttachV3Script`.
- `hash` from `plutus.json` is the policy ID directly — no derivation needed.
- `MintAssetsWithRedeemer(unit, plutusData)` takes `PlutusData.PlutusData`, not a `Redeemer` struct.
- Burning is identical with a negative quantity.

In 203.4 you will use these same patterns to unlock funds held at a script address.
