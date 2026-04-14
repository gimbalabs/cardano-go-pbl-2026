# SLT 203.6: I Can Build a Transaction That Passes Input Data to a Smart Contract Using a Redeemer

You have already used redeemers in 203.3 (minting) and 203.4 (spending). This lesson goes deeper: what a redeemer actually is, how to construct complex redeemer types from a blueprint, and how Apollo wires the redeemer into the transaction so the on-chain script receives it.

---

## Prerequisites

- Completed 203.1 (blueprint reading), 203.3 (minting redeemers), 203.4 (spending redeemers)
- A funded preprod wallet
- The hello_world validator from previous lessons

---

## Background: What Is a Redeemer?

A redeemer is the piece of data your off-chain transaction provides to a script at execution time. Think of it as the "argument" your transaction passes to the on-chain function.

Unlike a datum — which is set when the UTxO is created and stays fixed — the redeemer is chosen fresh each time you want to spend or mint. The script receives both and decides whether to approve.

On the wire, a Cardano transaction carries redeemers in the witness set. Each redeemer has four parts:

| Field | Description |
|-------|-------------|
| `Tag` | `SPEND` (0), `MINT` (1), `CERT` (2), or `REWARD` (3) — matches the script purpose |
| `Index` | Position of the input/policy being executed in the sorted transaction |
| `Data` | The `PlutusData` you construct from the blueprint |
| `ExUnits` | Estimated memory and CPU cost — Apollo fills this in via `SetEstimationExUnitsRequired()` |

Apollo handles `Tag` and `Index` for you when you use `CollectFrom` and `MintAssetsWithRedeemer`. You only need to provide `Data`.

---

## Redeemer Types in Aiken: Three Patterns

### Pattern 1: Simple record (most common)

```aiken
pub type Redeemer {
  msg: ByteArray,
}
```

Blueprint: constructor 0, one `#bytes` field.

```go
// constructor 0 (tag 121), one bytes field
redeemer := PlutusData.PlutusData{
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

Each variant is a different constructor index. No fields — the tag alone carries the meaning.

```go
// Mint variant: constructor 0 (tag 121), no fields
mintAction := PlutusData.PlutusData{
    TagNr:  121,
    HasTag: true,
    Value:  PlutusData.PlutusIndefArray{},
}

// Burn variant: constructor 1 (tag 122), no fields
burnAction := PlutusData.PlutusData{
    TagNr:  122,
    HasTag: true,
    Value:  PlutusData.PlutusIndefArray{},
}
```

### Pattern 3: Record with nested type

```aiken
pub type TransferRedeemer {
  recipient: ByteArray,
  amount: Int,
}
```

Blueprint: constructor 0, two fields: `#bytes` then `#integer`.

```go
// Field order must match blueprint: recipient first, amount second
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
            Value:  serialization.BigNum(transferAmount),
        },
    },
}
```

---

## Full Example: Contract With an Enum Redeemer

This example uses a validator that accepts either a `Mint` or `Burn` action. Only the owner can perform either.

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

Blueprint for the redeemer:
```json
"controlled_mint/MintAction": {
  "anyOf": [
    { "title": "Mint", "dataType": "constructor", "index": 0, "fields": [] },
    { "title": "Burn", "dataType": "constructor", "index": 1, "fields": [] }
  ]
}
```

```go
package main

import (
    "encoding/hex"
    "encoding/json"
    "fmt"
    "os"

    "github.com/fxamacker/cbor/v2"
    "github.com/Salvionied/apollo"
    "github.com/Salvionied/apollo/serialization/PlutusData"
    "github.com/Salvionied/apollo/serialization/Redeemer"
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
    "github.com/Salvionied/apollo/constants"
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

// buildMintActionRedeemer builds a MINT variant redeemer (constructor 0, no fields)
func buildMintActionRedeemer() Redeemer.Redeemer {
    return Redeemer.Redeemer{
        Tag: Redeemer.MINT,
        Data: PlutusData.PlutusData{
            TagNr:  121, // constructor index 0 → Mint
            HasTag: true,
            Value:  PlutusData.PlutusIndefArray{},
        },
        ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
    }
}

// buildBurnActionRedeemer builds a BURN variant redeemer (constructor 1, no fields)
func buildBurnActionRedeemer() Redeemer.Redeemer {
    return Redeemer.Redeemer{
        Tag: Redeemer.MINT,
        Data: PlutusData.PlutusData{
            TagNr:  122, // constructor index 1 → Burn
            HasTag: true,
            Value:  PlutusData.PlutusIndefArray{},
        },
        ExUnits: Redeemer.ExecutionUnits{Mem: 0, Steps: 0},
    }
}

func main() {
    bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
        constants.BLOCKFROST_BASE_URL_PREPROD,
        int(constants.PREPROD),
        "preprodYOUR_BLOCKFROST_KEY",
    )
    if err != nil {
        panic(err)
    }

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

    // NOTE: parameterized validators (those with arguments like `owner`)
    // require applying the parameter to the script before use.
    // For this example, assume you have a pre-compiled version with owner baked in.
    mintScript, policyId, err := loadScript("plutus.json", "controlled_mint.mint")
    if err != nil {
        panic(err)
    }

    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // Mint 100 tokens using the Mint action redeemer
    mintUnit := apollo.NewUnit(policyId, "ControlledToken", 100)
    redeemer := buildMintActionRedeemer()

    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        AttachV3Script(mintScript).
        MintAssetsWithRedeemer(mintUnit, redeemer).
        PayToAddressBech32(apollob.GetWallet().GetAddress().ToBech32(), 2_000_000, mintUnit).
        AddRequiredSignerFromBech32(
            apollob.GetWallet().GetAddress().ToBech32(),
            true,
            false,
        ).
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

To switch to the Burn action, replace `buildMintActionRedeemer()` with `buildBurnActionRedeemer()` and use a negative quantity in `NewUnit`.

---

## Redeemer Tag Reference

When you build a `Redeemer.Redeemer`, you must set the correct tag for the script purpose:

| Script purpose | Apollo constant | Used with |
|---------------|----------------|-----------|
| Spending a UTxO | `Redeemer.SPEND` | `CollectFrom` |
| Minting / burning | `Redeemer.MINT` | `MintAssetsWithRedeemer` |
| Certificate | `Redeemer.CERT` | (advanced — not in this module) |
| Withdrawal | `Redeemer.REWARD` | (advanced — not in this module) |

Apollo sets this automatically when you use the high-level methods. You only need to set it manually if you are building a `Redeemer` struct directly.

---

## Step-by-Step Build

### Step 0: Setup

```bash
mkdir 203_6-redeemers && cd 203_6-redeemers
go mod init 203_6-redeemers
go get github.com/Salvionied/apollo
```

### Step 1: Build the Mint variant, run it, verify on explorer

### Step 2: Switch to Burn variant

Change `buildMintActionRedeemer()` → `buildBurnActionRedeemer()`, set quantity to `-100`, and run again. The minted tokens from Step 1 should be burned.

### Step 3: Inspect the redeemer in the transaction

Before submitting, print the redeemer data:

```go
fmt.Printf("Redeemer tag: %d\n", redeemer.Tag)
fmt.Printf("Redeemer data TagNr: %d\n", redeemer.Data.TagNr)
```

Confirm the tag and constructor index match what you expect.

---

## Common Errors

**`Wrong constructor index for enum variant`** — `Mint` is index 0 (tag 121) and `Burn` is index 1 (tag 122). Swapping them will pass your Go code but fail the on-chain pattern match.

**`Redeemer tag SPEND on a mint script`** — if you manually build a `Redeemer` for minting but set `Tag: Redeemer.SPEND`, the ledger will reject it. Tag must match the script purpose.

**`ExUnits{0,0} without estimation`** — unlike native scripts, Plutus scripts need execution unit budgets. Always call `SetEstimationExUnitsRequired()` before `Complete()`.

**`Parameterized validator hash mismatch`** — if the validator takes parameters (like `owner`), the policy ID is the hash of the script *after* parameters are applied. A script with different parameters has a different policy ID. Parameterized validators are covered in Module 204.

---

## Module 203 Summary

You now have a complete toolkit for smart contract interaction with Apollo:

| Lesson | What you built |
|--------|---------------|
| 203.1 | Read Aiken types from a blueprint and reproduce them as `PlutusData` in Go |
| 203.2 | Mint/burn tokens with a native script |
| 203.3 | Mint/burn tokens with a Plutus validator and redeemer |
| 203.4 | Lock funds at a script address and unlock them with a redeemer |
| 203.5 | Attach structured data (datums) to outputs — inline and via witness set |
| 203.6 | Construct redeemers for simple records, enums, and multi-field types |

The pattern throughout is the same: read the blueprint, build `PlutusData` that matches it exactly, wire it into Apollo's builder with the right method, and let `Complete()` handle the rest.
