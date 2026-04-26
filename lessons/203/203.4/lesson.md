# SLT 203.4: I Can Build a Transaction That Unlocks Funds Held by a Smart Contract

Sending funds to a script address is straightforward — you did it in 203.3. Getting them back requires a transaction that satisfies the validator's conditions: correct redeemer, correct signers, and the script attached so the ledger can execute it.

This lesson covers the unlock step using the UTxO you locked in 203.3.

---

## Prerequisites

- Completed 203.1 (blueprint reading and `PlutusData` construction)
- Completed 203.3 (lock transaction — you need the tx hash from that lesson)
- A funded preprod wallet and Blockfrost API key

---

## Background: eUTxO Spending

A UTxO at a script address can only be consumed if the transaction satisfies the script. The ledger runs the script with three inputs:

- **Datum** — attached when the UTxO was created (in 203.3)
- **Redeemer** — provided by your spending transaction
- **ScriptContext** — the transaction itself (signatories, inputs, outputs, etc.)

Apollo needs to:
1. Identify the UTxO to spend via `CollectFrom`
2. Provide a matching redeemer as a `Redeemer.Redeemer` struct
3. Attach the script bytes with `AttachV3Script`
4. Include the required signer the script checks for

---

## The Contract (from 203.1)

```aiken
validator hello_world {
  spend(datum: Option<Datum>, redeemer: Redeemer, _own_ref: OutputReference, self: Transaction) {
    expect Some(Datum { owner }) = datum
    let must_say_hello = redeemer.msg == "HelloSpendRedeemer"
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
mkdir 203-unlock && cd 203-unlock
go mod init 203-unlock
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` into this directory.

---

## Unlock Transaction

Replace `YOUR_LOCK_TX_HASH` with the hash printed by the 203.3 lock transaction.

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

// loadScript decodes the compiledCode from plutus.json and returns it as a PlutusV3Script.
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

// buildSpendRedeemer wraps the hello_world Redeemer PlutusData in Redeemer.Redeemer.
// Blueprint: constructor 0, fields: [msg: #bytes]. msg must be "HelloSpendRedeemer".
func buildSpendRedeemer() Redeemer.Redeemer {
	return Redeemer.Redeemer{
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

	spendScript, err := loadScript("plutus.json", "lesson203_1.hello_world.spend")
	if err != nil {
		panic(err)
	}

	// UtxoFromRef fetches the locked UTxO from the chain via Blockfrost.
	// The UTxO must be confirmed on-chain before this call — wait ~20s after locking.
	scriptUtxo, err := apollob.UtxoFromRef(LOCK_TX_HASH, LOCK_TX_INDEX)
	if err != nil {
		panic(err)
	}

	walletUtxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	redeemer := buildSpendRedeemer()

	// AddRequiredSignerFromBech32(address, addPaymentPart, addStakingPart)
	// The validator checks extra_signatories contains datum.owner.
	// AddRequiredSignerFromBech32 adds the payment key hash to that list.
	apollob, _, err = apollob.
		AddLoadedUTxOs(walletUtxos...).
		CollectFrom(*scriptUtxo, redeemer).
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
| `loadScript("plutus.json", title)` | Decodes `compiledCode` → raw CBOR bytes → `PlutusV3Script` |
| `UtxoFromRef(hash, index)` | Fetches the locked UTxO from the chain |
| `CollectFrom(utxo, redeemer)` | Marks the script UTxO as an input; attaches the redeemer |
| `AddRequiredSignerFromBech32(...)` | Adds the payment key hash to `extra_signatories` for the script |
| `AttachV3Script(script)` | Adds compiled script bytes to the witness set |
| `Complete()` | Selects fee inputs, estimates ExUnits, builds the final transaction |

---

## Common Errors

**`Missing required signer`** — the validator calls `list.has(self.extra_signatories, owner)`. Without `AddRequiredSignerFromBech32`, the key hash is absent from `extra_signatories` even though the transaction is signed. Both are required.

**`UTxO not found`** — the lock transaction must confirm on-chain before you can spend it. Wait ~20 seconds and check the explorer.

**`Wrong redeemer`** — the message must be exactly `[]byte("HelloSpendRedeemer")`. Any byte difference fails the validator.

**`Script execution failed`** — verify the datum `owner` matches your wallet's payment key hash. If you locked with a different wallet, you cannot satisfy the signature check.

---

## Summary

- **Locking** was done in 203.3: `PayToContract(address, &datum, lovelace, true)`.
- **Unlocking**: `CollectFrom(utxo, Redeemer.Redeemer{Tag: Redeemer.SPEND, ...})` + `AttachV3Script` + `AddRequiredSignerFromBech32`.
- Load the compiled script with `hex.DecodeString(compiledCode)` → `PlutusV3Script(bytes)`.
- ExUnits are zero in the struct — Apollo estimates them during `Complete()`.

In 203.5 you will look at redeemer patterns in depth before minting tokens with the hello_world validator in 203.6.
