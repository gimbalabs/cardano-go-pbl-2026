# SLT 203.2: I Can Build a Transaction That Mints or Burns Tokens Using a Native Script

Every token on Cardano belongs to a **policy** — rules controlling who can mint or burn it. The simplest policy is a **native script**: a declarative rule set evaluated by the node, with no Plutus VM required.

This lesson walks through minting and burning tokens with a native script using Apollo.

---

## Prerequisites

- Completed Module 202 (basic Apollo transactions)
- A funded preprod wallet with test ADA
- A Blockfrost API key for preprod
- Updated version of the Apollo package ^1.8.0

---

## Background

A **policy ID** is the hash of the script governing a token. Token identity on Cardano is `policyId + assetName`. This binding is permanent — once tokens are minted under a policy, they belong to that policy forever. Multiple distinct tokens can share one policy ID; their asset names are what differentiate them.

A `ScriptPubKey` native script creates a policy that permits minting only when the key whose hash was embedded in the script signs the transaction. Unlike a Plutus script, which runs in the Plutus VM and accepts a redeemer, native scripts are **stateless rules evaluated directly by the node** — no custom logic, no VM execution. The policy ID is the hash of the native script itself. We will cover minting with Plutus (custom logic) in a later lesson.

In practice, a native script is a boolean condition.:

- "Is this transaction signed by key X?" (`ScriptPubKey`)
- "Is the current slot before the expiry?" (`InvalidHereafter`)
- "Are all of these conditions satisfied?" (`ScriptAll`)

Minted tokens must be assigned to an output in the same transaction.

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
	"github.com/Salvionied/apollo/serialization/NativeScript"
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

	// script.Hash() returns (serialization.ScriptHash, error).
	// ScriptHash is [28]byte — use [:] to get []byte for hex encoding.
	scriptHash, err := script.Hash()
	if err != nil {
		panic(err)
	}
	policyId := hex.EncodeToString(scriptHash[:])
	fmt.Println("Policy ID:", policyId)

	mintUnit := apollo.NewUnit(policyId, "GimbalToken", 1_000)

	utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
	if err != nil {
		panic(err)
	}

	apollob, _, err = apollob.
		AddLoadedUTxOs(utxos...).
		MintAssetsWithNativeScript(mintUnit, script).
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

Check the transaction on [preprod.cardanoscan.io](https://preprod.cardanoscan.io). Confirm the minting event shows `GimbalToken` quantity `1,000` under your policy ID.

---

## Burning Tokens

Use a negative quantity. The tokens to burn must already exist in a UTxO in `AddLoadedUTxOs`.

```go
burnUnit := apollo.NewUnit(policyId, "GimbalToken", -100)

apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    MintAssetsWithNativeScript(burnUnit, script).
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
expirySlot := int64(10_000_000) // replace with a real future slot

timedScript := NativeScript.NativeScript{
    Tag: NativeScript.ScriptAll,
    NativeScripts: []NativeScript.NativeScript{
        {Tag: NativeScript.ScriptPubKey, KeyHash: pkh},
        {Tag: NativeScript.InvalidHereafter, After: expirySlot},
    },
}

tlHash, err := timedScript.Hash()
if err != nil {
    panic(err)
}
timedPolicyId := hex.EncodeToString(tlHash[:])
```

Use `timedScript` in place of `script`. The transaction must be submitted before `expirySlot`.

```go
currentSlot, err := bfc.LastBlockSlot()
if err != nil {
    panic(err)
}
```

Read more on how Cardano slot timing works to accurately calculate values for `InvalidHereafter` and `InvalidBefore`.

---

## Code Explanation and Breakdown

### 1. Chain context — your connection to the network

```go
bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
    constants.BLOCKFROST_BASE_URL_PREPROD,
    int(constants.PREPROD),
    BLOCKFROST_KEY,
)
```

`BlockFrostChainContext` implements Apollo's `ChainContext` interface. Every subsequent query (UTxO fetching, fee estimation, submission) routes through it. Notice the explicit cast `int(constants.PREPROD)` — the constant is a typed integer, and the constructor expects a plain `int`.

---

### 2. Wallet setup and change address

```go
apollob, err = apollob.SetWalletFromMnemonic(MNEMONIC, constants.PREPROD)
apollob, err = apollob.SetWalletAsChangeAddress()
```

`SetWalletFromMnemonic` derives the first payment key from the BIP-39 mnemonic and stores it on the builder. `SetWalletAsChangeAddress` tells Apollo to send leftover ADA (after fees) back to that same wallet. Both return a new `apollob` value — Apollo's builder is **immutable by convention**: each method returns a fresh copy rather than mutating the receiver.

---

### 3. Deriving the policy ID from your payment key

```go
pkh := apollob.GetWallet().GetAddress().PaymentPart
script := NativeScript.NativeScript{
    Tag:     NativeScript.ScriptPubKey,
    KeyHash: pkh,
}
scriptHash, err := script.Hash()
policyId := hex.EncodeToString(scriptHash[:])
```

This is the core of how a native-script policy works on Cardano:

- `GetAddress().PaymentPart` — a Cardano address has two parts: the payment credential (mandatory) and an optional staking credential. For native scripts you only need the 28-byte payment key hash, not the full address. Addresses with both parts are longer and eligible for staking rewards; the same applies to script addresses (script hash + optional stake credential).
- `ScriptPubKey` enforces a simple rule: the transaction must be signed by the key whose hash matches `KeyHash`.
- `script.Hash()` CBOR-encodes the script and hashes it (BLAKE2b-224), producing a 28-byte `ScriptHash`. That hash **is** the policy ID.
- `scriptHash[:]` converts the fixed-size `[28]byte` array to a `[]byte` slice so `hex.EncodeToString` can consume it.

> **Note:** The policy ID is a deterministic hash of the script. Any change — even swapping the `Tag` — produces a completely different policy ID that cannot touch tokens minted under the original.

---

### 4. Describing what to mint

```go
mintUnit := apollo.NewUnit(policyId, "GimbalToken", 1_000)
```

A `Unit` is Apollo's name for a single asset entry: `policyId + assetName + quantity`. The asset name `"GimbalToken"` will be hex-encoded on-chain. The quantity `1_000` is in the asset's own smallest unit (not lovelace). This value is used twice later — once to register the mint and once to route the minted tokens to an output.

---

### 5. Explicitly loading UTxOs

```go
utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
apollob.AddLoadedUTxOs(utxos...)
```

Apollo can auto-select UTxOs, but calling `AddLoadedUTxOs` gives you explicit control over which UTxOs fund the transaction. `bfc.Utxos` takes a dereferenced `Address` value (not a pointer), fetches all UTxOs at that address from Blockfrost, and returns them as a slice. The `...` unpacks the slice into variadic arguments.

---

### 6. Building the transaction — method chaining

```go
apollob, _, err = apollob.
    AddLoadedUTxOs(utxos...).
    MintAssetsWithNativeScript(mintUnit, script).
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
```

Each method returns a new builder, enabling a fluent chain. Breaking down each step:

| Method                                          | What it does                                                                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AddLoadedUTxOs(utxos...)`                      | Registers available inputs for coin selection                                                                                                                                      |
| `MintAssetsWithNativeScript(mintUnit, script)`  | Attaches the native script witness and registers the mint in the transaction body                                                                                                  |
| `AddRequiredSignerFromBech32(..., true, false)` | Adds your key hash to the `required_signers` field — the node checks this field against the native script's `KeyHash`                                                              |
| `PayToAddressBech32(..., 2_000_000, mintUnit)`  | Creates an output sending 2 ADA **and** the minted tokens to your address; the extra `mintUnit` argument is required because every minted token must appear in at least one output |
| `Complete()`                                    | Runs coin selection, computes fees, and balances the transaction; returns the finalised builder, a `*Transaction`, and an error                                                    |

---

### 7. Signing and submitting

```go
apollob = apollob.Sign()
txId, err := apollob.Submit()
fmt.Println("Tx hash:", hex.EncodeToString(txId.Payload))
```

`Sign()` uses the wallet's private key to produce a `VKeyWitness` and attaches it to the transaction. `Submit()` serialises the signed transaction to CBOR and posts it via Blockfrost. The returned `txId` is a struct whose `Payload` field is the raw 32-byte transaction hash — hex-encode it to get the string you can paste into a block explorer.

---

## Key Concepts

| Concept                      | Explanation                                       |
| ---------------------------- | ------------------------------------------------- |
| `ScriptPubKey`               | Policy requires the matching key to sign          |
| `ScriptAll`                  | All sub-scripts must be satisfied                 |
| `InvalidHereafter`           | Minting forbidden at or after this slot           |
| `MintAssetsWithNativeScript` | Attaches the native script and registers the mint |
| Negative quantity            | Burns tokens instead of minting                   |

---

## Common Errors

**`DecoderErrorDeserialiseFailure`** - This happens when you have a negative token amount as output to an address using the `PayToAddressBech32` for example in a burning transaction, tokens to burn are automatically selected from the transaction inputs and remaining returned to the change address, which you can spot as a difference in our minting and burning transaction except we explicitly state an output with positive token value.

**`tokens not sent to output`** — every minted token must appear in a transaction output. Include `mintUnit` as an extra argument to `PayToAddressBech32`.

**`InsufficientFunds`** — outputs carrying native assets require at least ~2 ADA minimum. Use at least `2_000_000` lovelace.

**`Policy ID mismatch`** — the policy ID is the script hash. Changing the key or expiry slot changes the hash, producing a different policy ID that cannot touch previously minted tokens.

---

## Summary

- Build a `NativeScript` with your wallet's `PaymentPart` as the `KeyHash`.
- `script.Hash()` returns `(serialization.ScriptHash, error)` — use `scriptHash[:]` to hex-encode the policy ID.
- `MintAssetsWithNativeScript(unit, script)` attaches the script and registers the mint in one call.
- Burning is identical with a negative quantity.
- `ScriptAll` + `InvalidHereafter` creates a time-locked policy.

In 203.3 you will attach structured data (a datum) to a contract output — the first step toward interacting with the hello_world validator.
