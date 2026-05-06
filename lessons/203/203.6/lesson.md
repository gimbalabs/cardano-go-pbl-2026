# SLT 203.6: I Can Build a Transaction That Mints or Burns Tokens Using a Validator Script

In 203.2 you minted tokens with a native script — policy controlled by key signatures. Now you step up to a **Plutus validator**, where the minting policy is arbitrary on-chain logic. The key difference: the transaction must supply a **redeemer** that the script evaluates before allowing the mint.

This lesson uses the `hello_world` validator from 203.1. Its `mint` handler checks that the redeemer's `msg` field equals `"HelloMintRedeemer"`.

---

## Prerequisites

- Completed 203.1 (reading blueprint types, constructing `PlutusData`)
- Completed 203.2 (native script minting)
- Completed 203.5 (redeemer patterns)
- A compiled `plutus.json` from 203.1 and a funded preprod wallet

---

## The Contract

The hello_world `mint` handler from 203.1:

```aiken
mint(
  redeemer: Redeemer,
  _policy_id: PolicyId,
  _self: Transaction,
) {
  redeemer.msg == "HelloMintRedeemer"
}
```

From the blueprint, `Redeemer` is constructor 0, one `#bytes` field → tag 121. The `hash` field of `"lesson203_1.hello_world.mint"` in `plutus.json` is the policy ID.

---

## Setup

```bash
mkdir 203-validator-mint && cd 203-validator-mint
go mod init 203-validator-mint
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` into this directory.

---

## Complete Minting Example

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
	"github.com/Salvionied/apollo/serialization/Redeemer"
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

// loadScript decodes a validator's compiledCode from plutus.json.
// compiledCode is hex-encoded CBOR — hex.DecodeString gives the raw bytes Apollo needs.
// Returns the script and its hash (the policy ID for mint validators).
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

// buildMintRedeemer returns the hello_world mint redeemer.
// Blueprint: constructor 0, fields: [msg: #bytes] → tag 121
// MintAssetsWithRedeemer takes Redeemer.Redeemer with Tag: Redeemer.MINT.
func buildMintRedeemer() Redeemer.Redeemer {
	return Redeemer.Redeemer{
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

	// hash field from plutus.json is the policy ID directly — no derivation needed.
	// compiledCode → hex.DecodeString → PlutusV3Script(bytes)
	mintScript, policyId, err := loadScript("plutus.json", "lesson203_1.hello_world.mint")
	if err != nil {
		panic(err)
	}
	fmt.Println("Policy ID:", policyId)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	redeemer := buildMintRedeemer()
	mintUnit := apollo.NewUnit(policyId, "HelloToken", 1_000)

	// MintAssetsWithRedeemer automatically handles ExUnit estimation.
	// AttachV3Script adds the compiled script bytes to the transaction witness set.
	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		AttachV3Script(mintScript).
		MintAssetsWithRedeemer(mintUnit, redeemer).
		PayToAddressBech32(apollob.GetWallet().GetAddress().String(), 2_000_000, mintUnit).
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

Check [preprod.cardanoscan.io](https://preprod.cardanoscan.io). The policy ID should match the printed hash. Quantity: 1,000 `HelloToken`.

---

## Burning Tokens

Use a negative quantity with the same redeemer and script:

```go
burnUnit := apollo.NewUnit(policyId, "HelloToken", -500)

apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    AttachV3Script(mintScript).
    MintAssetsWithRedeemer(burnUnit, redeemer).
    Complete()
```

The tokens to burn must be present in a UTxO in `AddLoadedUTxOs`.

---

## How compiledCode Flows to the Transaction

1. Aiken compiles the validator to flat-encoded Plutus Core
2. `aiken build` wraps it in CBOR and hex-encodes it → `compiledCode` in `plutus.json`
3. `hex.DecodeString(compiledCode)` → raw CBOR bytes
4. `PlutusData.PlutusV3Script(bytes)` → typed script value
5. `AttachV3Script(script)` → added to the transaction witness set
6. Ledger executes it with the redeemer you supplied

---

## Native Script vs Validator Script

| | Native Script (203.2) | Validator Script (203.6) |
|---|---|---|
| Policy enforced by | Key signatures / time locks | Arbitrary on-chain Aiken logic |
| Redeemer required | No | Yes — `PlutusData` |
| Script attached via | Built into `MintAssetsWithNativeScript` | `AttachV3Script` |
| Apollo mint method | `MintAssetsWithNativeScript` | `MintAssetsWithRedeemer` |
| Policy ID source | `script.Hash()` derived from key | `hash` field in `plutus.json` |

---

## Common Errors

**`Script not found in witness set`** — `AttachV3Script` must be called before `Complete()`. Without it, the ledger cannot execute the minting policy.

**`Redeemer data mismatch`** — the `msg` bytes must exactly match what the validator checks. `"HelloMintRedeemer"` and `"HelloMintRedeemer "` (trailing space) are different byte sequences.

**`Wrong script version`** — if `plutus.json` says `"plutusVersion": "v3"` use `PlutusV3Script` / `AttachV3Script`. For `v2` use `PlutusV2Script` / `AttachV2Script`.

**`tokens not sent to output`** — minted tokens must appear in a transaction output. Include `mintUnit` as an extra argument to `PayToAddressBech32`.

---

## Module 203 Summary

| Lesson | What you built |
|--------|---------------|
| 203.1 | Read Aiken types from a blueprint; reproduce them as `PlutusData` in Go |
| 203.2 | Mint and burn tokens with a native script (`MintAssetsWithNativeScript`) |
| 203.3 | Lock funds at a script address with an inline datum (`PayToContract`) |
| 203.4 | Unlock those funds with a spend redeemer and required signer (`CollectFrom`) |
| 203.5 | Understand redeemer patterns: simple records, enums, multi-field types |
| 203.6 | Mint and burn tokens with a Plutus validator (`MintAssetsWithRedeemer`) |

The pattern throughout: read the blueprint → build matching `PlutusData` → wire into Apollo with the correct method → `Complete()` handles fee estimation and coin selection.
