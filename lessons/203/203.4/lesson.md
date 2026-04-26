# SLT 203.4: I Can Build a Transaction That Unlocks Funds Held by a Smart Contract

Sending funds to a script address is simple. Getting them back requires constructing a transaction that satisfies the validator's conditions: correct redeemer, correct signers, and the script attached so the ledger can execute it.

This lesson covers the full lock → unlock cycle using the hello_world validator from 203.1.

---

## Prerequisites

- Completed 203.1 (blueprint reading and `PlutusData` construction)
- Completed 203.3 (Plutus validator interaction)
- A funded preprod wallet and Blockfrost API key

---

## Background: eUTxO Spending

A UTxO at a script address can only be consumed if the transaction satisfies the script. The ledger runs the script with three inputs:

- **Datum** — attached when the UTxO was created
- **Redeemer** — provided by your spending transaction
- **ScriptContext** — the transaction itself (signatories, inputs, outputs, etc.)

Apollo needs to:
1. Identify the UTxO to spend via `CollectFrom`
2. Provide a matching redeemer as a `Redeemer.Redeemer` struct
3. Attach the script bytes with `AttachV3Script`
4. Include any required signers the script checks for

---

## The Contract (from 203.1)

```aiken
validator hello_world {
  spend(datum: Option<Datum>, redeemer: Redeemer, _own_ref: OutputReference, self: Transaction) {
    expect Some(Datum { owner }) = datum
    let must_say_hello = redeemer.msg == "Hello, World!"
    let must_be_signed = list.has(self.extra_signatories, owner)
    must_say_hello? && must_be_signed?
  }
}
```

Blueprint types:
```
Datum:    constructor 0, fields: [owner: #bytes]   → tag 121
Redeemer: constructor 0, fields: [msg: #bytes]     → tag 121
```

---

## Setup

```bash
mkdir 203-lock-unlock && cd 203-lock-unlock
go mod init 203-lock-unlock
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` into this directory.

---

## Part 1: Lock — Send ADA to the Script Address

This transaction sends 5 ADA to the script address with your wallet's payment key hash as the inline datum.

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
	"github.com/Salvionied/apollo/serialization/Address"
	"github.com/Salvionied/apollo/serialization/PlutusData"
	"github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
)

const (
	BLOCKFROST_KEY = "preprodYOUR_KEY_HERE"
	MNEMONIC       = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
)

type Blueprint struct {
	Validators []struct {
		Title string `json:"title"`
		Hash  string `json:"hash"`
	} `json:"validators"`
}

// scriptAddress builds a preprod enterprise script address from a validator hash.
// AddressFromBytes(payment, paymentIsScript, staking, stakingIsScript, network)
// Returns *Address.Address — dereference it for PayToContract which takes Address.Address.
func scriptAddress(scriptHash string) Address.Address {
	hashBytes, _ := hex.DecodeString(scriptHash)
	return *Address.AddressFromBytes(hashBytes, true, nil, false, constants.PREPROD)
}

// BuildDatum: owner is the 28-byte payment key hash of whoever can unlock these funds.
func BuildDatum(owner []byte) PlutusData.PlutusData {
	return PlutusData.PlutusData{
		TagNr:  121,
		HasTag: true,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				HasTag: false,
				Value:  serialization.ByteString{Bytes: owner},
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

	// Read the script hash from plutus.json — this is the script address payment credential.
	data, err := os.ReadFile("plutus.json")
	if err != nil {
		panic(err)
	}
	var bp Blueprint
	json.Unmarshal(data, &bp)
	var scriptHash string
	for _, v := range bp.Validators {
		if v.Title == "hello_world.spend" {
			scriptHash = v.Hash
		}
	}

	contractAddress := scriptAddress(scriptHash)
	fmt.Println("Script address:", contractAddress.String())

	// GetAddress().PaymentPart is []byte — the wallet's 28-byte payment key hash.
	// This becomes the datum owner so only we can unlock the funds.
	walletPkh := apollob.GetWallet().GetAddress().PaymentPart
	datum := BuildDatum(walletPkh)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	// isInline=true stores datum bytes in the UTxO output itself,
	// so Part 2 can read it without supplying it separately.
	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		PayToContract(contractAddress, &datum, 5_000_000, true).
		Complete()
	if err != nil {
		panic(err)
	}

	apollob = apollob.Sign()
	txId, err := apollob.Submit()
	if err != nil {
		panic(err)
	}

	fmt.Println("Lock tx hash:", hex.EncodeToString(txId.Payload))
	fmt.Println("Save this hash — you need it for Part 2.")
}
```

Run it. Wait ~20 seconds for confirmation on the explorer. Note the output index at the script address (usually `0`).

---

## Part 2: Unlock — Spend from the Script Address

Replace `YOUR_LOCK_TX_HASH` with the hash from Part 1.

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
	"github.com/Salvionied/apollo/serialization/Redeemer"
	"github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
)

const (
	BLOCKFROST_KEY = "preprodYOUR_KEY_HERE"
	MNEMONIC       = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
	LOCK_TX_HASH   = "YOUR_LOCK_TX_HASH"
	LOCK_TX_INDEX  = 0
)

type Blueprint struct {
	Validators []struct {
		Title        string `json:"title"`
		CompiledCode string `json:"compiledCode"`
		Hash         string `json:"hash"`
	} `json:"validators"`
}

func loadScript(path, title string) (PlutusData.PlutusV3Script, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var bp Blueprint
	if err := json.Unmarshal(data, &bp); err != nil {
		return nil, err
	}
	for _, v := range bp.Validators {
		if v.Title == title {
			code, err := hex.DecodeString(v.CompiledCode)
			if err != nil {
				return nil, err
			}
			return PlutusData.PlutusV3Script(code), nil
		}
	}
	return nil, fmt.Errorf("validator %q not found", title)
}

// buildSpendRedeemer wraps the hello_world Redeemer PlutusData in a Redeemer.Redeemer.
// CollectFrom takes Redeemer.Redeemer (unlike MintAssetsWithRedeemer which takes PlutusData).
// Blueprint: constructor 0, fields: [msg: #bytes]. msg must be "Hello, World!".
func buildSpendRedeemer() Redeemer.Redeemer {
	return Redeemer.Redeemer{
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

	spendScript, err := loadScript("plutus.json", "hello_world.spend")
	if err != nil {
		panic(err)
	}

	// UtxoFromRef fetches the locked UTxO from the chain via Blockfrost.
	scriptUtxo, err := apollob.UtxoFromRef(LOCK_TX_HASH, LOCK_TX_INDEX)
	if err != nil {
		panic(err)
	}

	walletUtxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	redeemer := buildSpendRedeemer()

	// CollectFrom sets isEstimateRequired = true internally.
	apollob, _, err = apollob.
		AddLoadedUTxOs(walletUtxos...).
		CollectFrom(*scriptUtxo, redeemer).
		// The validator checks extra_signatories contains datum.owner (our wallet).
		AddRequiredSignerFromBech32(apollob.GetWallet().GetAddress().String(), true, false).
		AttachV3Script(spendScript).
		PayToAddressBech32(apollob.GetWallet().GetAddress().String(), 4_500_000).
		Complete()
	if err != nil {
		panic(err)
	}

	apollob = apollob.Sign()
	txId, err := apollob.Submit()
	if err != nil {
		panic(err)
	}

	fmt.Println("Unlock tx hash:", hex.EncodeToString(txId.Payload))
}
```

---

## What Each Step Does

| Step | Purpose |
|------|---------|
| `CollectFrom(utxo, redeemer)` | Marks the script UTxO as an input; attaches the redeemer |
| `AttachV3Script(script)` | Adds compiled script bytes to the witness set so the ledger can run it |
| `AddRequiredSignerFromBech32(...)` | Adds the payment key hash to `extra_signatories` for the script to check |
| `Complete()` | Selects fee inputs, estimates ExUnits, builds the final transaction |

## Redeemer Type Difference

- `CollectFrom` takes `Redeemer.Redeemer` — you wrap your `PlutusData` inside it with `Tag: Redeemer.SPEND`
- `MintAssetsWithRedeemer` takes `PlutusData.PlutusData` directly — no wrapping needed

---

## Common Errors

**`Missing required signer`** — the validator calls `list.has(self.extra_signatories, owner)`. Without `AddRequiredSignerFromBech32`, the key hash is absent from `extra_signatories` even though the transaction is signed. Both are required.

**`UTxO not found`** — the lock transaction must confirm on-chain before you can spend it. Wait ~20 seconds and check the explorer.

**`Wrong redeemer`** — the message must be exactly `[]byte("Hello, World!")`. Any byte difference fails the validator.

**`Script execution failed`** — verify the datum owner matches your wallet's payment key hash. If you locked with a different address, you cannot satisfy the signature check.

---

## Summary

- **Locking**: `PayToContract(address, &datum, lovelace, true)` — sends funds to a script address with an inline datum.
- **Unlocking**: `CollectFrom(utxo, Redeemer.Redeemer{...})` + `AttachV3Script` + `AddRequiredSignerFromBech32`.
- Build the script address with `*Address.AddressFromBytes(hashBytes, true, nil, false, network)`.
- Get your wallet's payment key hash from `GetAddress().PaymentPart` — it is `[]byte`.

In 203.5 you will look at datums more broadly — attaching structured data to any output, not just script addresses.
