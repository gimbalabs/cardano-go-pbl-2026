# Lesson 203.2 — Minting & Burning Tokens with Native Scripts

**Course:** Cardano Go PBL 2026  
**Module:** 203 — Applications & Smart Contracts  

---

## 🎯 Learning Outcome

> I can build a transaction that mints or burns tokens using a native script (no smart contract required).

---

## 01 — Background: What Is a Native Script?

On Cardano, every token belongs to a **policy**. A policy defines:

- Who can mint or burn tokens  
- Under what conditions  

### Types of Minting Policies

| Type | Description |
|------|------------|
| **Native Script** | Declarative rule set evaluated by the node. No Plutus VM required. Supports signatures and time-locks. |
| **Plutus Script (Validator)** | Arbitrary logic executed in Plutus VM. Supports complex conditions and state checks. |

👉 This lesson focuses on **native scripts**.

### Key Concept

- A **policy ID** = hash of the script  
- Token identity = `policyId + assetName`

> ⚠️ Tokens are permanently bound to their policy.

---

## 02 — How Apollo Models Minting

### API Methods

```go
// Native scripts
MintAssets(mintUnit Unit) *Apollo

// Plutus scripts
MintAssetsWithRedeemer(mintUnit Unit, redeemer Redeemer) *Apollo
```

### Unit Structure

```go
unit := apollo.NewUnit(
    "a1b2c3...", // policy ID
    "MyToken",   // asset name
    1000,        // quantity (+ mint, - burn)
)
```

> ⚠️ Minted tokens must be included in an output (`PayToAddressBech32`) or the transaction will fail.

---

## 03 — Setup: Imports & Backend

```go
package main

import (
    "encoding/hex"
    "fmt"

    "github.com/Salvionied/apollo"
    "github.com/Salvionied/apollo/constants"
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"

    NativeScript "github.com/Salvionied/apollo/serialization/NativeScript"
    Key          "github.com/Salvionied/apollo/serialization/Key"
)

const (
    BLOCKFROST_KEY = "previewXXXXXXXXXXXXXXXX"
    MNEMONIC       = "your mnemonic..."
)
```

---

## 04 — Native Script & Policy ID

```go
func buildNativeScript(vkey Key.VerificationKey) (NativeScript.NativeScript, string) {
    pkh := vkey.PaymentKeyHash()

    script := NativeScript.NativeScript{
        Type:    NativeScript.ScriptPubkey,
        KeyHash: pkh,
    }

    policyId := hex.EncodeToString(script.Hash())

    return script, policyId
}
```

### Optional: Time-Locked Policy

```go
timeLocked := NativeScript.NativeScript{
    Type: NativeScript.ScriptAll,
    Scripts: []NativeScript.NativeScript{
        {
            Type:    NativeScript.ScriptPubkey,
            KeyHash: pkh,
        },
        {
            Type: NativeScript.ScriptInvalidHereAfter,
            Slot: 10_000_000,
        },
    },
}
```

---

## 05 — Complete Minting Transaction

```go
func main() {
    bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
        constants.BLOCKFROST_BASE_URL_PREVIEW,
        int(constants.PREVIEW),
        BLOCKFROST_KEY,
    )
    if err != nil { panic(err) }

    apollob := apollo.New(&bfc)
    apollob, _ = apollob.SetWalletFromMnemonic(MNEMONIC, constants.PREVIEW)
    apollob, _ = apollob.SetWalletAsChangeAddress()

    utxos, _ := bfc.Utxos(*apollob.GetWallet().GetAddress())

    vkey := apollob.GetWallet().GetVerificationKey()
    script, policyId := buildNativeScript(vkey)

    mintUnit := apollo.NewUnit(policyId, "GimbalToken", 1_000_000)

    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        MintAssets(mintUnit).
        AttachNativeScript(script).
        AddRequiredSignerFromBech32(
            apollob.GetWallet().GetAddress().ToBech32(),
            true, false,
        ).
        PayToAddressBech32(
            apollob.GetWallet().GetAddress().ToBech32(),
            2_000_000,
            mintUnit,
        ).
        Complete()

    if err != nil { panic(err) }

    apollob = apollob.Sign()
    txId, _ := apollob.Submit()

    fmt.Println("Tx:", hex.EncodeToString(txId.Payload))
}
```

---

## 06 — Burning Tokens

```go
burnUnit := apollo.NewUnit(policyId, "GimbalToken", -500_000)

tokenUtxo, _ := apollob.UtxoFromRef("txhash...", 0)

apollob, err = apollob.
    AddLoadedUTxOs(utxos...).
    AddInput(*tokenUtxo).
    MintAssets(burnUnit).
    AttachNativeScript(script).
    AddRequiredSignerFromBech32(
        apollob.GetWallet().GetAddress().ToBech32(),
        true, false,
    ).
    Complete()
```

> ⚠️ Burn amount must not exceed available tokens.

---

## 07 — Observing with Adder

```json
{
  "txHash": "abc123...",
  "mint": {
    "policyId...": {
      "GimbalToken": 1000000
    }
  },
  "outputs": [
    {
      "address": "addr_test1...",
      "value": {
        "lovelace": 2000000,
        "policyId...GimbalToken": 1000000
      }
    }
  ]
}
```

---

## 08 — Step-by-Step Flow

1. Set up Blockfrost context  
2. Load wallet  
3. Build native script → derive policy ID  
4. Create mint unit  
5. Build transaction  
6. Sign & submit  

---

## 09 — Exercises

### A — Mint Token

1. Set up backend  
2. Derive policy ID  
3. Mint `1,000,000` tokens  
4. Send to your wallet  
5. Verify on explorer  

### B — Burn Half

1. Locate token UTxO  
2. Burn `500,000`  
3. Use same policy  
4. Verify negative mint  

### C — Time-Locked Policy

1. Get current slot  
2. Create expiry policy  
3. Mint before deadline  
4. Try minting after (should fail)  

---

## 10 — Knowledge Check

- Understand native vs Plutus policies  
- Know how policy ID is derived  
- Can construct `Unit` correctly  
- Can build mint & burn transactions  
- Understand why outputs are required  
- Can interpret mint field  

---

## 11 — What’s Next

Next: **Plutus Minting Validators (203.3)**

- `MintAssetsWithRedeemer`
- On-chain logic with Aiken
- Advanced minting rules