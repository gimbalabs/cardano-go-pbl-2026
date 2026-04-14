# SLT 203.3: I Can Build a Transaction That Mints or Burns Tokens Using a Validator Script (Smart Contract)

In the previous lesson you minted tokens using a native script — the policy was controlled entirely by key signatures and time locks. Now we step up to **validator scripts (Plutus/Aiken)**, where the minting policy is enforced by arbitrary on-chain logic. This is how most real tokens on Cardano work.

The key difference: a validator-controlled minting policy requires a **redeemer** — data you pass into the script that it uses to decide whether minting is allowed.

---

## Prerequisites

- Completed 203.1 (reading blueprint types) and 203.2 (native script minting)
- The hello_world Aiken project compiled with `aiken build`, giving you a `plutus.json`
- A Cardano preprod wallet funded with test ADA

---

## Background: How Plutus Minting Works

With a native script, the policy ID is the hash of the script itself and Apollo handles everything. With a Plutus minting validator, there are two additional requirements:

1. You must supply a **redeemer** — the script receives it and decides whether to approve the mint.
2. Apollo must **attach the script** to the transaction or reference it via a reference input. The ledger needs the script bytes to execute.

The policy ID is still the script hash — derived from `compiledCode` in `plutus.json` — but now that script runs on-chain.

---

## The Example Contract: A Simple Minting Validator

Here is a minimal Aiken minting validator that checks the redeemer is a specific byte string:

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

Running `aiken build` gives you a `plutus.json` with:

```json
"definitions": {
  "my_token/MintRedeemer": {
    "title": "MintRedeemer",
    "dataType": "constructor",
    "index": 0,
    "fields": [
      { "title": "action", "dataType": "#bytes" }
    ]
  }
}
```

From 203.1 you already know how to read this: constructor index 0 (tag 121), one `#bytes` field.

---

## What You Are Building

A program that:

1. Reads the compiled validator from `plutus.json`
2. Constructs the redeemer matching the blueprint
3. Mints tokens using `MintAssetsWithRedeemer` and `AttachV3Script`
4. Sends the minted tokens to your own wallet address

---

## Complete Example

```go
package main

import (
    "encoding/hex"
    "encoding/json"
    "fmt"
    "os"

    "github.com/fxamacker/cbor/v2"
    "github.com/Salvionied/apollo"
    "github.com/Salvionied/apollo/serialization"
    "github.com/Salvionied/apollo/serialization/PlutusData"
    "github.com/Salvionied/apollo/serialization/Redeemer"
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
    "github.com/Salvionied/apollo/constants"
)

// -------------------------------------------------------------------
// Blueprint helpers
// -------------------------------------------------------------------

type Blueprint struct {
    Validators []struct {
        Title        string `json:"title"`
        CompiledCode string `json:"compiledCode"`
        Hash         string `json:"hash"`
    } `json:"validators"`
}

// loadScript reads compiledCode and hash from plutus.json for a given validator title.
func loadScript(path, title string) (compiledCode []byte, scriptHash string, err error) {
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
            return code, v.Hash, nil
        }
    }
    return nil, "", fmt.Errorf("validator %q not found", title)
}

// -------------------------------------------------------------------
// Redeemer construction (from blueprint: constructor 0, field: #bytes)
// -------------------------------------------------------------------

func buildMintRedeemer(action []byte) Redeemer.Redeemer {
    data := PlutusData.PlutusData{
        TagNr:  121, // constructor index 0
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: action},
            },
        },
    }
    return Redeemer.Redeemer{
        Tag:  Redeemer.MINT,  // this is a minting redeemer
        Data: data,
        ExUnits: Redeemer.ExecutionUnits{
            Mem:   0,
            Steps: 0,
        },
    }
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

func main() {
    // 1) Connect to Blockfrost
    bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
        constants.BLOCKFROST_BASE_URL_PREPROD,
        int(constants.PREPROD),
        "preprodYOUR_BLOCKFROST_KEY",
    )
    if err != nil {
        panic(err)
    }

    // 2) Load wallet
    cc := apollo.NewEmptyBackend()
    apollob := apollo.New(&cc)
    SEED := "your mnemonic here"
    apollob, err = apollob.SetWalletFromMnemonic(SEED, constants.PREPROD)
    if err != nil {
        panic(err)
    }
    apollob, err = apollob.SetWalletAsChangeAddress()
    if err != nil {
        panic(err)
    }

    // 3) Load UTxOs
    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // 4) Load the minting validator from plutus.json
    scriptBytes, policyId, err := loadScript("plutus.json", "my_token.mint")
    if err != nil {
        panic(err)
    }
    // PlutusV3Script is just a byte slice of the compiled CBOR script
    mintingScript := PlutusData.PlutusV3Script(scriptBytes)

    // 5) Build redeemer: action = "mint"
    redeemer := buildMintRedeemer([]byte("mint"))

    // 6) Build the minting unit
    // NewUnit(policyId hex string, asset name, quantity)
    mintUnit := apollo.NewUnit(policyId, "MyToken", 1000)

    // 7) Assemble and submit
    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        // Attach the script so the ledger can execute it
        AttachV3Script(mintingScript).
        // Mint with the redeemer
        MintAssetsWithRedeemer(mintUnit, redeemer).
        // Send the minted tokens to our own wallet
        PayToAddressBech32(apollob.GetWallet().GetAddress().ToBech32(), 2_000_000, mintUnit).
        // Apollo estimates ExUnits automatically during Complete()
        SetEstimationExUnitsRequired().
        Complete()
    if err != nil {
        panic(err)
    }

    apollob = apollob.Sign()
    tx := apollob.GetTx()

    cborred, err := cbor.Marshal(tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("CBOR tx:", hex.EncodeToString(cborred))

    txId, err := bfc.SubmitTx(*tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("Tx hash:", hex.EncodeToString(txId.Payload))
}
```

---

## Step-by-Step Build

### Step 0: Project setup

```bash
mkdir 203_3-validator-mint && cd 203_3-validator-mint
go mod init 203_3-validator-mint
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` from the Aiken project into this directory.

### Step 1: Confirm you can read the blueprint

Paste only the `loadScript` function and a `main` that calls it and prints the hash. Run it:

```bash
go run .
```

You should see the script hash printed — this is your **policy ID**.

### Step 2: Add the redeemer builder

Paste `buildMintRedeemer`. Add a main that just prints the redeemer data to confirm it builds without errors.

### Step 3: Assemble the full transaction

Paste the full example. Replace `YOUR_BLOCKFROST_KEY` and `your mnemonic here`, then run:

```bash
go run .
```

### Step 4: Verify on the explorer

Copy the tx hash and look it up on [https://preprod.cardanoscan.io/](https://preprod.cardanoscan.io/). Confirm:
- The minting policy ID matches the script hash from Step 1
- The asset name is `MyToken`
- The quantity is 1000

---

## Burning Tokens

To burn, use a **negative quantity** in `NewUnit` and the same redeemer:

```go
burnUnit := apollo.NewUnit(policyId, "MyToken", -500)

apollob, err = apollob.
    AddLoadedUTxOs(utxos...).
    AttachV3Script(mintingScript).
    MintAssetsWithRedeemer(burnUnit, redeemer).
    SetEstimationExUnitsRequired().
    Complete()
```

The tokens to be burned must already be in a UTxO available to the transaction. Apollo's coin selector will pick them up automatically from `AddLoadedUTxOs`.

---

## Key Differences: Native Script vs Validator Script

| | Native Script (203.2) | Validator Script (203.3) |
|---|---|---|
| Policy enforced by | Key signatures / time locks | Arbitrary on-chain logic |
| Requires redeemer | No | Yes |
| Script attached to tx | Yes (bytes) | Yes (bytes or reference input) |
| Apollo method | `MintAssets` | `MintAssetsWithRedeemer` |
| ExUnit estimation | Not needed | Required — use `SetEstimationExUnitsRequired()` |

---

## Common Errors

**`ExUnits not set`** — you must call `SetEstimationExUnitsRequired()` before `Complete()` when using Plutus scripts. Apollo cannot submit a Plutus transaction without execution unit estimates.

**`Script not found in witness set`** — you forgot `AttachV3Script`. The ledger cannot execute a script that isn't in the transaction.

**`Redeemer data mismatch`** — the redeemer shape must match the blueprint exactly. If the script expects constructor 0 with a `#bytes` field and you send constructor 1, the validator will fail.

**Wrong script version** — if the `plutus.json` says `"plutusVersion": "v3"`, use `PlutusV3Script` and `AttachV3Script`. For `v2` use `PlutusV2Script` / `AttachV2Script`.

---

## Summary

- Validator-controlled minting requires attaching the compiled script and supplying a matching redeemer.
- Read the redeemer type from `plutus.json` — apply the type-tracing process from 203.1.
- Use `MintAssetsWithRedeemer` instead of `MintAssets`, and always call `SetEstimationExUnitsRequired()`.
- Burning is identical to minting, just with a negative quantity.

In 203.4 you'll use these same patterns to **unlock** funds that are sitting at a script address.
