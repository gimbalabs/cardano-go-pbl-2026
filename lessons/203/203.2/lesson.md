# SLT 203.2: I Can Build a Transaction That Mints or Burns Tokens Using a Native Script

Every token on Cardano belongs to a **policy** — a set of rules that control who can mint or burn it. The simplest kind of policy is a **native script**: a declarative rule set evaluated by the node, no Plutus VM required. Native scripts support key signatures and time locks.

This lesson walks through minting and burning tokens with a native script using Apollo.

---

## Prerequisites

- Completed Module 202 (basic Apollo transactions)
- A funded preprod wallet with test ADA
- A Blockfrost API key for preprod

---

## Background

A **policy ID** is the hash of the script that governs a token. Token identity on Cardano is `policyId + assetName`. Once minted under a policy, that binding is permanent.

A `ScriptPubKey` native script creates a policy that permits minting only when a specific key signs the transaction. The policy ID is derived from the script, which in turn is built from your wallet's payment key hash.

Minted tokens must be assigned to an output in the same transaction — you cannot mint into thin air.

---

## Setup

```bash
mkdir 203-native-mint && cd 203-native-mint
go mod init 203-native-mint
go get github.com/Salvionied/apollo
```

---

## Complete Minting Example

```go
package main

import (
	"encoding/hex"
	"fmt"

	"github.com/Salvionied/apollo"
	"github.com/Salvionied/apollo/constants"
	NativeScript "github.com/Salvionied/apollo/serialization/NativeScript"
	"github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"
)

const (
	BLOCKFROST_KEY = "preprodYOUR_KEY_HERE"
	MNEMONIC       = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
)

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

	// GetAddress().PaymentPart is []byte — the 28-byte payment key hash.
	pkh := apollob.GetWallet().GetAddress().PaymentPart
	script := NativeScript.NativeScript{
		Tag:     NativeScript.ScriptPubKey,
		KeyHash: pkh,
	}

	// Hash() returns (serialization.ScriptHash, error).
	// ScriptHash is [28]byte, so use [:] to get []byte for hex encoding.
	scriptHash, err := script.Hash()
	if err != nil {
		panic(err)
	}
	policyId := hex.EncodeToString(scriptHash[:])
	fmt.Println("Policy ID:", policyId)

	mintUnit := apollo.NewUnit(policyId, "GimbalToken", 1_000_000)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		MintAssets(mintUnit).
		AttachNativeScript(script).
		AddRequiredSignerFromBech32(
			apollob.GetWallet().GetAddress().String(),
			true, false,
		).
		PayToAddressBech32(
			apollob.GetWallet().GetAddress().String(),
			2_000_000,
			mintUnit,
		).
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

Check the transaction on [preprod.cardanoscan.io](https://preprod.cardanoscan.io). Confirm the minting event shows `GimbalToken` quantity `1000000` under your policy ID.

---

## Burning Tokens

Use a negative quantity. The tokens must already exist in a UTxO in `AddLoadedUTxOs`.

```go
burnUnit := apollo.NewUnit(policyId, "GimbalToken", -500_000)

apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    MintAssets(burnUnit).
    AttachNativeScript(script).
    AddRequiredSignerFromBech32(
        apollob.GetWallet().GetAddress().String(),
        true, false,
    ).
    Complete()
if err != nil {
    panic(err)
}
```

---

## Optional: Time-Locked Policy

A time-locked policy forbids minting after a specific slot. Once that slot passes, the policy is frozen — no one can ever mint or burn under it again.

```go
expirySlot := int64(10_000_000) // replace with a real future slot number

timeLocked := NativeScript.NativeScript{
    Tag: NativeScript.ScriptAll,
    NativeScripts: []NativeScript.NativeScript{
        {
            Tag:     NativeScript.ScriptPubKey,
            KeyHash: pkh,
        },
        {
            Tag:   NativeScript.InvalidHereafter,
            After: expirySlot,
        },
    },
}

tlHash, err := timeLocked.Hash()
if err != nil {
    panic(err)
}
timedPolicyId := hex.EncodeToString(tlHash[:])
```

Use `timeLocked` in place of `script` in the minting call. The transaction must be submitted before `expirySlot`.

---

## Key Concepts

| Concept | Explanation |
|---------|-------------|
| `ScriptPubKey` | Policy requires the matching key to sign |
| `ScriptAll` | All sub-scripts must be satisfied |
| `InvalidHereafter` | Minting forbidden at or after this slot |
| Negative quantity | Burns tokens instead of minting |

---

## Common Errors

**`tokens not sent to output`** — every minted token must appear in an output. Include `mintUnit` as the third argument to `PayToAddressBech32`.

**`InsufficientFunds`** — outputs carrying native assets require at least ~2 ADA minimum. Use at least `2_000_000` lovelace.

**`Policy ID mismatch`** — the policy ID is the script hash. Changing the key or expiry slot changes the hash, producing a different policy ID that cannot touch previously minted tokens.

---

## Summary

- Build a `NativeScript` with your wallet's `PaymentPart` as the `KeyHash`.
- `script.Hash()` returns `(serialization.ScriptHash, error)` — use `scriptHash[:]` to hex-encode it.
- `MintAssets(unit)` + `AttachNativeScript(script)` + an output that receives the tokens.
- Burning is identical with a negative quantity.
- `ScriptAll` + `InvalidHereafter` creates a time-locked policy.

In 203.3 you will mint tokens using a Plutus validator where minting rules are arbitrary on-chain logic.
