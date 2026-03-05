# SLT 102.3: I can sign a transaction manually and programmatically

In **SLT 102.2**, you built, signed, and submitted a transaction entirely in Go. That was **programmatic signing**.

In this lesson, you will:

- Build a transaction in Go
- Export the unsigned CBOR
- Sign it using a Cardano wallet
- Submit it from the wallet

This introduces an important architectural distinction:

> Transaction construction and transaction signing do not have to happen in the same system.

Understanding that separation is foundational for real-world Cardano applications.

---

## Prerequisites

Before you begin, ensure you have:

- Go 1.21+ installed
- A Blockfrost API key (free tier works for this lesson)
- A Cardano preprod testnet wallet funded with test ADA
- The mnemonic for that wallet (used in previous lesson)
- A basic understanding of the Cardano UTxO model
- Completed **SLT 102.2 – I Can Build a Simple Transaction with Apollo**

> You do NOT need to run a local Cardano node for this lesson.

---

## What You Are Building

You will modify your previous Apollo transaction so that it:

- Builds and balances a valid transaction
- Outputs unsigned CBOR
- Does NOT sign the transaction in Go
- Does NOT submit via Blockfrost

Instead, you will:

- Import the CBOR into a Cardano wallet
- Sign it manually
- Submit it from the wallet interface

You are separating:

- **Transaction construction** (backend logic)
- **Key management** (wallet responsibility)

This mirrors how production dApps are designed.  
---
## What Does “Signing” Actually Mean?

A Cardano transaction consists of three pieces:

1. **Transaction Body** – inputs, outputs, fees, metadata
2. **Witness Set** – cryptographic signatures
3. **Final Transaction** – body + witnesses

When you call:

```go
apollob = apollob.Sign()
```

Apollo:

- Hashes the transaction body
- Signs that hash with your private key
- Adds the signature to the witness set

When you remove that step, you are generating:

> A valid, balanced transaction body — but with no witnesses.

That unsigned transaction can be signed by:

- Your Go program (programmatic signing)
- A wallet (manual signing)
- A hardware device
- A multi-signature coordinator

---

## Signing Modes Compared

| Signing Mode      | Where Private Key Lives | Who Signs |
|------------------|------------------------|----------|
| Programmatic     | Go application         | Go code  |
| Manual           | Wallet                 | User     |
| Hardware Wallet  | Hardware device        | Device   |
| Multi-sig        | Multiple parties       | Coordinated signers |

---

## Start From Your 102.2 Code

Create a new project folder:

```bash
mkdir 102_3-Apollo && cd 102_3-Apollo
go mod init 102_3-Apollo
go get github.com/Salvionied/apollo
```

Copy your `main.go` from 102.2 into this folder.

---

## Modify the Code for Manual Signing

Remove (or comment out) the signing and submission steps.

### Remove Signing

```go
// apollob = apollob.Sign()
```

### Remove Submission

```go
// tx_id, err := bfc.SubmitTx(*tx)
// if err != nil {
//     panic(err)
// }
```

Also remove any printing of `tx_id`.

---

## Export Unsigned CBOR

Keep the CBOR marshaling section:

```go
tx := apollob.GetTx()
cborred, err := cbor.Marshal(tx)
if err != nil {
    panic(err)
}

fmt.Println("Unsigned TX CBOR (hex):")
fmt.Println(hex.EncodeToString(cborred))
```

When you run the program, it will:

- Build the transaction
- Balance inputs and outputs
- Calculate fees
- Output unsigned transaction CBOR

---

## Run the Program

```bash
go run .
```

You should see a long hexadecimal string printed.

Copy that entire string.

---

## Manual Signing Workflow

1. Run your Go program.
2. Copy the printed CBOR hex string.
3. Open your Cardano wallet.
4. Import the unsigned transaction.
5. The wallet will:
   - Parse the transaction
   - Display inputs and outputs
   - Ask for confirmation
6. Approve and sign.
7. Submit the transaction from the wallet.

If the wallet uses the same mnemonic as your Go code, it will recognize that it controls the required inputs.

---

## Verify on Explorer

After submission, copy the transaction hash and view it on:

https://preprod.cardanoscan.io/

You should see:

- Inputs consumed
- Outputs created
- Fees paid

---

## Why This Matters

In production systems:

- Backend servers SHOULD NOT hold private keys.
- Users sign transactions in wallets.
- Backend systems construct transactions.

This pattern enables:

- Secure dApp architectures
- Hardware wallet support
- Multi-signature coordination
- Separation of concerns

Manual signing is not just an exercise.

It is the foundation of safe Cardano application design.

---

## Common Errors

**Insufficient funds**  
Ensure your wallet has enough test ADA.

**Wrong network**  
Your Blockfrost key must match the network (preprod vs preview).

**Pending UTxOs**  
Wait for previous transactions to confirm before building another.

---

## Summary

- You built a real Cardano transaction in Go.
- Apollo handled UTxO selection and fee calculation.
- You separated transaction construction from signing.
- You signed and submitted the transaction using a wallet.
- You verified the result on-chain.

You now understand both:

- Programmatic signing
- Manual signing

In the next lesson, you will explore submitting transactions directly to a node using gOuroboros.

