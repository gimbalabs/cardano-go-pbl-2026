# SLT 204.2: I Can Compile a Smart Contract That Accepts Parameters at Deployment Time

The hello_world validator from 203 had no parameters — its compiled code (and policy ID) was the same for everyone who built it. Sometimes you want the **opposite**: a validator whose policy ID is unique to a specific deployment. The tool for that is **parameterisation**.

In this lesson you will:

1. Add a parameter to the hello_world validator — an `OutputReference` (a `txHash` + `outputIndex` pair pointing at a single UTxO).
2. Apply that parameter to the compiled code with `aiken blueprint apply`.
3. Use the resulting (now unique) policy ID to mint a **one-shot NFT** in Go.

Because the parameter pins a specific UTxO, the policy ID can never be reproduced after that UTxO is consumed — that is what makes the token a true non-fungible token.

---

## Prerequisites

- Completed 203.6 (mint with a Plutus validator)
- A funded preprod wallet and Blockfrost API key
- Aiken installed (`aiken --version` ≥ `1.1.0`)

---

## Background: Parameters vs Redeemers

| | Parameter | Redeemer |
|---|----------|----------|
| Set at | Compile time (`aiken blueprint apply`) | Transaction time |
| Affects | Compiled bytes → script hash → policy ID / address | Validator execution only |
| Visible to | Everyone who reads the script | Only this transaction |

Parameters bake values **into** the script. Two deployments of the same Aiken source with different parameter values produce different policy IDs, different script addresses, different on-chain identities.

---

## The Parameterised Validator

Modify the `hello_world` validator from 203.1. Keep the spend handler as it was; replace the `mint` handler so it accepts an `OutputReference` parameter and only allows minting when that exact UTxO is among the transaction's inputs.

```aiken
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

pub type Datum {
  owner: VerificationKeyHash,
}

pub type Redeemer {
  msg: ByteArray,
}

validator hello_world(utxo_ref: OutputReference) {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(Datum { owner }) = datum
    let must_say_hello = redeemer.msg == "HelloSpendRedeemer"
    let must_be_signed = list.has(self.extra_signatories, owner)
    must_say_hello? && must_be_signed?
  }

  mint(_redeemer: Redeemer, _policy_id: PolicyId, self: Transaction) {
    list.any(self.inputs, fn(i) { i.output_reference == utxo_ref })
  }

  else(_) {
    fail
  }
}
```

The validator type now reads `validator hello_world(utxo_ref: OutputReference)` — anything in the parens is a parameter.

Build it:

```bash
aiken build
```

`plutus.json` now contains a `parameters` block on each handler:

```json
"parameters": [
  {
    "title": "utxo_ref",
    "schema": { "$ref": "#/definitions/cardano~1transaction~1OutputReference" }
  }
]
```

The `compiledCode` and `hash` you see at this point are **not yet final** — the script is still expecting a parameter.

---

## Applying the Parameter

Pick a UTxO from your wallet. Any UTxO works; it will be consumed when you mint. Get its hash and index from Blockfrost or the explorer:

```
txHash: a1b2c3...
outputIndex: 0
```

`OutputReference` in Aiken is a record `{ transaction_id: ByteArray, output_index: Int }` — so the CBOR is a constructor 0 with two fields.

Apply it from the command line:

```bash
aiken blueprint apply \
  -v hello_world.mint \
  d8799f5820a1b2c3...20-byte-hash...00ff
```

Aiken updates `plutus.json` in place. The `mint` validator's `compiledCode` now bakes in your `OutputReference`, and its `hash` is the **final policy ID** — unique to this UTxO.

> The hex argument is the CBOR of the parameter value. You can build it manually as shown, or use the helper below from Go and paste the result.

### Building the parameter CBOR from Go

```go
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/Salvionied/apollo/serialization/PlutusData"
)

func outputRefCBOR(txHashHex string, outputIndex int64) string {
	txHash, _ := hex.DecodeString(txHashHex)
	pd := PlutusData.PlutusData{
		PlutusDataType: PlutusData.PlutusArray,
		TagNr:          121,
		Value: PlutusData.PlutusIndefArray{
			PlutusData.PlutusData{
				PlutusDataType: PlutusData.PlutusBytes,
				Value:          txHash,
			},
			PlutusData.PlutusData{
				PlutusDataType: PlutusData.PlutusInt,
				Value:          *big.NewInt(outputIndex),
			},
		},
	}
	cbor, _ := pd.MarshalCBOR()
	return hex.EncodeToString(cbor)
}

func main() {
	fmt.Println(outputRefCBOR("a1b2c3...", 0))
}
```

The hex string this prints is the exact value you pass to `aiken blueprint apply`.

---

## Minting the One-Shot NFT in Go

Once `plutus.json` is updated, the Go side is almost identical to 203.6 — except you must include the parameter UTxO in the inputs of the mint transaction.

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
	PARAM_TX_HASH  = "a1b2c3..." // the same UTxO you applied as a parameter
	PARAM_TX_INDEX = 0
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
			code, _ := hex.DecodeString(v.CompiledCode)
			return PlutusData.PlutusV3Script(code), v.Hash, nil
		}
	}
	return nil, "", fmt.Errorf("validator %q not found", title)
}

// The mint handler ignores the redeemer — but the witness set still needs one.
func emptyRedeemer() Redeemer.Redeemer {
	return Redeemer.Redeemer{
		Tag: Redeemer.MINT,
		Data: PlutusData.PlutusData{
			PlutusDataType: PlutusData.PlutusArray,
			TagNr:          121,
			Value: PlutusData.PlutusIndefArray{
				PlutusData.PlutusData{
					PlutusDataType: PlutusData.PlutusBytes,
					Value:          []byte("OneShot"),
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

	mintScript, policyId, err := loadScript("plutus.json", "lesson203_1.hello_world.mint")
	if err != nil {
		panic(err)
	}
	fmt.Println("Final policy ID:", policyId)

	// Fetch the exact UTxO that was baked into the script as a parameter.
	// The validator iterates self.inputs and requires this OutputReference to be present.
	paramUtxo, err := apollob.UtxoFromRef(PARAM_TX_HASH, PARAM_TX_INDEX)
	if err != nil {
		panic(err)
	}

	// Other UTxOs cover the fee and the min-ADA on the NFT output.
	walletUtxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	// Quantity 1, asset name baked from the same UTxO so it's also unique.
	nftName := fmt.Sprintf("OneShot-%s-%d", PARAM_TX_HASH[:8], PARAM_TX_INDEX)
	nftUnit := apollo.NewUnit(policyId, nftName, 1)

	apollob, _, err = apollob.
		AddLoadedUTxOs(walletUtxos...).
		AddInput(*paramUtxo).
		AttachV3Script(mintScript).
		MintAssetsWithRedeemer(nftUnit, emptyRedeemer()).
		PayToAddressBech32(apollob.GetWallet().GetAddress().String(), 2_000_000, nftUnit).
		Complete()
	if err != nil {
		panic(err)
	}

	apollob = apollob.Sign()
	txId, err := apollob.Submit()
	if err != nil {
		panic(err)
	}

	fmt.Println("NFT mint tx hash:", hex.EncodeToString(txId.Payload))
}
```

Run it:

```bash
go run .
```

Verify on [preprod.cardanoscan.io](https://preprod.cardanoscan.io):

- Quantity is exactly **1** under your final policy ID.
- The `PARAM_TX_HASH#PARAM_TX_INDEX` UTxO appears in the **inputs** of this transaction.

Try minting again with the same code — it will fail. The parameter UTxO no longer exists, so the validator's `list.any(self.inputs, ...)` check can never be satisfied. That is the one-shot guarantee.

---

## What Changed Compared to 203.6

| Step | 203.6 mint | 204.2 mint |
|------|-----------|-----------|
| Validator parameter | None | `OutputReference` |
| Policy ID | Same for every build | Unique per applied UTxO |
| Required input | Anything that covers the fee | Must include the parameter UTxO (`AddInput`) |
| Redeemer content | Checked (`"HelloMintRedeemer"`) | Ignored — the parameter does the work |
| Re-mint possible? | Yes, repeatedly | No, the param UTxO is single-use |

---

## Common Errors

**`script witness mismatch`** — you forgot to re-run `aiken blueprint apply` after editing the validator. The `compiledCode` in `plutus.json` does not match the policy ID you expected.

**`validator failed`** — the parameter UTxO is missing from `self.inputs`. Make sure `AddInput(*paramUtxo)` is called and the UTxO has not already been spent.

**`Wrong CBOR for OutputReference`** — the parameter is a constructor with two fields in this order: `transaction_id: #bytes` (32 bytes), then `output_index: #integer`. Swapping them produces a valid CBOR that bakes a wrong UTxO into the script.

---

## Summary

- A parameter changes the **bytes** of the compiled script, and therefore the policy ID / script address.
- `aiken blueprint apply -v <validator> <param-cbor>` rewrites `plutus.json` with the applied script.
- The Go side is a normal mint transaction, except you must consume the parameter UTxO with `AddInput`.
- Parameterising on an `OutputReference` is the canonical pattern for one-shot NFTs.

In 204.3 you will watch this minting transaction land on-chain with Adder and identify the contract interaction inside the event payload.
