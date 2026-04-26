# SLT 203.3: I Can Build a Transaction That Attaches Data to a New Output on the Blockchain

A UTxO on Cardano can carry a **datum** — structured data stored alongside the value. To interact with a smart contract, you must first **lock** funds at the contract address with a datum that encodes your intent. The validator reads that datum when you try to unlock the funds.

This lesson covers building the lock transaction: sending ADA to the hello_world script address with an inline datum.

---

## Prerequisites

- Completed 203.1 (reading blueprint types, constructing `PlutusData`)
- Completed 203.2 (basic Apollo transaction building)
- A funded preprod wallet and Blockfrost API key

---

## Background: Inline vs Witness Set Datums

| Strategy | How it works | When to use |
|----------|-------------|-------------|
| **Inline datum** | Datum bytes stored in the UTxO output itself | Default. Scripts and indexers can read it without extra lookup. |
| **Witness set datum** | Datum in the transaction witness set; only hash in the output | Legacy pattern. Only visible at transaction time, not in UTxO state. |

`PayToContract(address, &datum, lovelace, isInline)` controls this via the last argument. Always use `true` (inline) for new code.

---

## The Contract

Using the `hello_world` validator from 203.1. The spend handler checks:
1. The datum's `owner` field matches a key in `extra_signatories`
2. The redeemer `msg` is `"HelloSpendRedeemer"`

The datum type from the blueprint:
```
Datum: constructor 0, fields: [owner: #bytes]  → tag 121
```

`owner` is the 28-byte payment key hash of whoever can unlock the funds.

---

## Setup

```bash
mkdir 203-lock && cd 203-lock
go mod init 203-lock
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` into this directory.

---

## Lock Transaction

```go
package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/constants"
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

// scriptAddress derives a preprod enterprise address from a validator hash.
// AddressFromBytes(payment, paymentIsScript, staking, stakingIsScript, network)
func scriptAddress(scriptHash string) Address.Address {
	hashBytes, _ := hex.DecodeString(scriptHash)
	return *Address.AddressFromBytes(hashBytes, true, nil, false, constants.PREPROD)
}

// buildDatum constructs the hello_world Datum.
// Blueprint: constructor 0, fields: [owner: #bytes] → tag 121
// PlutusArray = tagged constructor (Constr); PlutusBytes = raw byte field.
func buildDatum(owner []byte) PlutusData.PlutusData {
	return PlutusData.PlutusData{
		PlutusDataType: PlutusData.PlutusArray,
		TagNr:          121,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				PlutusDataType: PlutusData.PlutusBytes,
				Value:          owner,
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

	// Read the spend validator hash from plutus.json.
	data, err := os.ReadFile("plutus.json")
	if err != nil {
		panic(err)
	}
	var bp Blueprint
	json.Unmarshal(data, &bp)
	var spendHash string
	for _, v := range bp.Validators {
		if v.Title == "lesson203_1.hello_world.spend" {
			spendHash = v.Hash
		}
	}
	if spendHash == "" {
		panic("hello_world.spend not found in plutus.json")
	}

	contractAddress := scriptAddress(spendHash)
	fmt.Println("Script address:", contractAddress.String())

	// GetAddress().PaymentPart is []byte — the wallet's 28-byte payment key hash.
	// Set as datum.owner so only this wallet can satisfy the spend validator.
	walletPkh := apollob.GetWallet().GetAddress().PaymentPart
	datum := buildDatum(walletPkh)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	// isInline=true stores the datum bytes in the UTxO output itself.
	// The unlock transaction in 203.4 reads it directly from the UTxO.
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
	fmt.Println("Save this hash — you need it for 203.4.")
}
```

Run it:

```bash
go run .
```

Wait ~20 seconds. Open the transaction on [preprod.cardanoscan.io](https://preprod.cardanoscan.io), click the output at the script address, and inspect the **Datum** tab. You will see the CBOR-encoded `{owner: <your-pkh>}` inline on the UTxO.

---

## What Each Step Does

| Step | Purpose |
|------|---------|
| `scriptAddress(hash)` | Builds a bech32 enterprise address from the validator hash in `plutus.json` |
| `buildDatum(walletPkh)` | Constructs `PlutusData` matching blueprint `Datum` — tag 121, one `#bytes` field |
| `PayToContract(addr, &datum, lovelace, true)` | Sends ADA to the script address; `true` stores the datum inline in the UTxO |

---

## Datum Field Types: Quick Reference

| Aiken type | Blueprint `dataType` | Go value in `PlutusData.Value` |
|-----------|----------------------|--------------------------------|
| `ByteArray` | `"#bytes"` | `PlutusData{PlutusDataType: PlutusBytes, Value: []byte{...}}` |
| `Int` | `"#integer"` | `PlutusData{PlutusDataType: PlutusInt, Value: *big.NewInt(n)}` |
| `Bool` (True) | `constructor, index: 1` | `PlutusData{PlutusDataType: PlutusArray, TagNr: 122, Value: PlutusIndefArray{}}` |
| `Bool` (False) | `constructor, index: 0` | `PlutusData{PlutusDataType: PlutusArray, TagNr: 121, Value: PlutusIndefArray{}}` |
| Nested record | `constructor, index: N` | Nested `PlutusData{PlutusDataType: PlutusArray, TagNr: 121+N, ...}` |

---

## Common Errors

**`validator not found`** — the `title` field in `plutus.json` includes the module prefix. Use `"lesson203_1.hello_world.spend"`, not `"hello_world.spend"`.

**`MinimumAdaNotMet`** — script outputs require a minimum ADA based on the datum size. `5_000_000` lovelace is safe for this datum.

**`Wrong field order`** — `PlutusIndefArray` is positional. If a datum has multiple fields, they must appear in the same order as the blueprint's `fields` array.

---

## Summary

- `PayToContract(address, &datum, lovelace, true)` sends funds to a script address with an inline datum.
- Build the script address from `plutus.json` hash using `Address.AddressFromBytes(hash, true, nil, false, network)`.
- The datum's `owner` field is your wallet's `GetAddress().PaymentPart` — `[]byte`.
- Inline datums are stored in the UTxO itself; the unlock transaction can read them without supplying them again.

In 203.4 you will unlock these funds by providing the correct redeemer and signing with the owner key.
