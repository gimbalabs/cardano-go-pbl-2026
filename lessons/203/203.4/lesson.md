# SLT 203.4: I Can Build a Transaction That Unlocks Tokens Held by a Smart Contract

Locking funds at a script address is easy — you send ADA or tokens there with a datum. Unlocking them is where the real work happens: you must construct a transaction that satisfies the validator's conditions, attach the right redeemer, and tell Apollo which UTxO to spend from the script.

This lesson covers the full lock → unlock cycle using the hello_world validator from 203.1.

---

## Prerequisites

- Completed 203.1 (blueprint reading and `PlutusData` construction)
- Completed 203.3 (validator script interaction pattern)
- A funded preprod wallet

---

## Background: Spending from a Script Address

In Cardano's eUTxO model, a UTxO at a script address can only be consumed if the transaction satisfies the script. The ledger runs the script with three inputs:

- **Datum** — attached when the UTxO was created (either inline or by hash)
- **Redeemer** — provided by the spending transaction
- **ScriptContext** — information about the transaction itself (signatories, inputs, outputs, etc.)

Apollo's role is to build a transaction that:

1. Identifies the UTxO to spend (via `CollectFrom`)
2. Provides the correct redeemer
3. Attaches the script (or references it)
4. Includes any required signers the script checks for

---

## The Example Contract: Hello World (Spend)

From 203.1, the validator requires:
- The transaction is signed by `datum.owner` (a verification key hash)
- The redeemer message is `"Hello, World!"`

Blueprint types (already known from 203.1):

```
Datum:    constructor 0, fields: [owner: #bytes]   → CBOR tag 121
Redeemer: constructor 0, fields: [msg: #bytes]     → CBOR tag 121
```

---

## Part 1: Locking Funds (Creating the UTxO at the Script)

Before you can unlock, you need to lock. This transaction sends ADA to the script address with an inline datum.

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
    "github.com/Salvionied/apollo/serialization/Address"
    "github.com/Salvionied/apollo/serialization/PlutusData"
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
    "github.com/Salvionied/apollo/constants"
)

type Blueprint struct {
    Validators []struct {
        Title string `json:"title"`
        Hash  string `json:"hash"`
    } `json:"validators"`
}

// scriptAddressFromHash builds a Cardano script address from the validator hash.
// On preprod, enterprise script addresses use network tag 0b00000000 (no staking part).
func scriptAddressFromHash(scriptHash string, network constants.Network) Address.Address {
    hashBytes, _ := hex.DecodeString(scriptHash)
    return Address.Address{
        PaymentPart: hashBytes,
        HeaderByte:  0b01110000, // enterprise script address header
        Network:     Address.NetworkInfo{NetworkId: uint8(network)},
    }
}

// BuildDatum: owner is the 28-byte pub key hash who can unlock the funds.
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

    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // Load the script hash from plutus.json
    data, _ := os.ReadFile("plutus.json")
    var bp Blueprint
    json.Unmarshal(data, &bp)
    var scriptHash string
    for _, v := range bp.Validators {
        if v.Title == "hello_world.spend" {
            scriptHash = v.Hash
        }
    }

    contractAddress := scriptAddressFromHash(scriptHash, constants.PREPROD)

    // The datum owner is our own pub key hash (so we can unlock it)
    walletPkh := apollob.GetWallet().GetAddress().PaymentPart
    datum := BuildDatum(walletPkh)

    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        // isInline=true stores the datum in the UTxO itself (easier to spend later)
        PayToContract(contractAddress, &datum, 5_000_000, true).
        Complete()
    if err != nil {
        panic(err)
    }

    apollob = apollob.Sign()
    tx := apollob.GetTx()
    cborred, _ := cbor.Marshal(tx)
    fmt.Println("Lock tx CBOR:", hex.EncodeToString(cborred))

    txId, err := bfc.SubmitTx(*tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("Lock tx hash:", hex.EncodeToString(txId.Payload))
    // Save this tx hash — you need it to find the UTxO in Part 2
}
```

---

## Part 2: Unlocking Funds (Spending from the Script)

Now spend the UTxO you just created. You need the tx hash and output index from Part 1.

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

// BuildRedeemer: msg = "Hello, World!" (blueprint: constructor 0, field: #bytes)
func buildSpendRedeemer(msg []byte) Redeemer.Redeemer {
    data := PlutusData.PlutusData{
        TagNr:  121,
        HasTag: true,
        Value: PlutusData.PlutusIndefArray{
            PlutusData.PlutusData{
                HasTag: false,
                Value:  serialization.ByteString{Bytes: msg},
            },
        },
    }
    return Redeemer.Redeemer{
        Tag:  Redeemer.SPEND, // this is a spending redeemer
        Data: data,
        ExUnits: Redeemer.ExecutionUnits{
            Mem:   0,
            Steps: 0,
        },
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

    // Load our spending validator
    spendScript, _, err := loadScript("plutus.json", "hello_world.spend")
    if err != nil {
        panic(err)
    }

    // Fetch the UTxO sitting at the script address (from Part 1)
    // Replace with your actual lock tx hash and index (usually 0)
    scriptUtxo, err := apollob.UtxoFromRef("YOUR_LOCK_TX_HASH", 0)
    if err != nil {
        panic(err)
    }

    // Build the redeemer: msg must be "Hello, World!" to pass the validator
    redeemer := buildSpendRedeemer([]byte("Hello, World!"))

    // Load wallet UTxOs for fee payment (the script UTxO provides the value)
    walletUtxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    apollob, err = apollob.
        AddLoadedUTxOs(walletUtxos...).
        // Tell Apollo: spend this script UTxO using this redeemer
        CollectFrom(*scriptUtxo, redeemer).
        // The validator checks self.extra_signatories contains datum.owner
        // We are the owner, so add our address as a required signer
        AddRequiredSignerFromBech32(
            apollob.GetWallet().GetAddress().ToBech32(),
            true,  // add payment part
            false, // no staking part needed
        ).
        // Attach the script so the ledger can execute it
        AttachV3Script(spendScript).
        // Send unlocked funds back to our wallet
        PayToAddressBech32(apollob.GetWallet().GetAddress().ToBech32(), 4_500_000).
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
    fmt.Println("Unlock tx CBOR:", hex.EncodeToString(cborred))

    txId, err := bfc.SubmitTx(*tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("Unlock tx hash:", hex.EncodeToString(txId.Payload))
}
```

---

## Transaction Lifecycle for Script Spending

| Step | What happens |
|------|-------------|
| `CollectFrom(utxo, redeemer)` | Marks the script UTxO as an input and associates it with a redeemer |
| `AttachV3Script(script)` | Adds the compiled script bytes to the transaction witness set |
| `AddRequiredSignerFromBech32(...)` | Adds the pub key hash to `extra_signatories` so the script can check it |
| `SetEstimationExUnitsRequired()` | Tells Apollo to estimate memory and CPU costs for the script execution |
| `Complete()` | Selects fee inputs, estimates ExUnits, builds the final tx |

---

## Step-by-Step Build

### Step 0: Project setup

```bash
mkdir 203_4-script-spend && cd 203_4-script-spend
go mod init 203_4-script-spend
go get github.com/Salvionied/apollo
```

Copy your `plutus.json` here.

### Step 1: Run Part 1 (lock)

Build and run the lock transaction. Note the printed tx hash — wait for it to confirm on the explorer before proceeding (~20 seconds on preprod).

### Step 2: Find the script UTxO index

Check the tx on [https://preprod.cardanoscan.io/](https://preprod.cardanoscan.io/). The output going to the script address is your UTxO — note its index (usually `0`).

### Step 3: Run Part 2 (unlock)

Replace `YOUR_LOCK_TX_HASH` with the confirmed lock tx hash. Run the unlock program.

### Step 4: Verify

Check the unlock tx hash on the explorer. Confirm:
- The script UTxO is consumed as an input
- The funds arrive back at your wallet address

---

## Inline vs Hash Datums

In Part 1 we used `isInline: true`. This stores the datum bytes directly in the UTxO output, which means:
- Apollo can read it automatically from the UTxO when spending
- No separate datum witness is needed in the spending transaction

If you use `isInline: false`, the datum is stored only by its hash in the output. When spending, you must supply the full datum bytes separately using `AttachDatum`.

For this lesson, always use inline datums — it simplifies the spend transaction considerably.

---

## Common Errors

**`Missing required signer`** — the validator calls `list.has(self.extra_signatories, owner)`. If you don't add the wallet pub key hash with `AddRequiredSignerFromBech32`, this check fails even though you signed the transaction.

**`UTxO not found`** — the lock transaction must be confirmed before you can spend the UTxO. Wait for it on the explorer.

**`Wrong redeemer`** — the message must be exactly `[]byte("Hello, World!")`. Any difference in bytes will cause the validator to reject the transaction.

**`Script execution failed`** — check the datum owner matches your wallet's pub key hash. If you locked with a different address's pub key hash, you cannot satisfy the signature check.

---

## Summary

- Locking: use `PayToContract` with an inline datum to create a UTxO at the script address.
- Unlocking: use `CollectFrom` with a matching redeemer, attach the script, and add any required signers.
- `SetEstimationExUnitsRequired()` is required for any Plutus spending transaction.
- The validator runs on-chain using the datum from the UTxO and the redeemer from your transaction.

In 203.5 you'll learn how to **attach data to outputs** — the datum side of this pattern in more depth.
