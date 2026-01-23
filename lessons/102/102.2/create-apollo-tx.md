# SLT 102.2: I Can Build a Simple Transaction with Apollo

In this lesson, you will build, sign, and submit a simple ADA transaction on Cardano using Apollo. This is your first hands-on experience turning transaction intent into a real ledger event.

Apollo is a Go library that makes Cardano transaction building accessible. Rather than manually constructing CBOR-encoded transactions, Apollo provides a fluent builder pattern that handles UTxO selection, fee calculation, and change output generation automatically.

By the end of this lesson, you will have submitted a transaction to Cardano preprod and verified it on a block explorer.

---

## Prerequisites

Before you begin, ensure you have:

- Go 1.21+ installed
- A [Blockfrost](https://blockfrost.io/) API key (free tier works for this lesson)
- A Cardano preprod testnet wallet funded with test ADA (created in previous lesson)
- A basic understanding of the Cardano UTxO model
- Completed **SLT 100.4 – Apollo: Background and Purpose**

> **Note on infrastructure:** You do **not** need to run a local Cardano node for this lesson. Apollo can query the chain and submit transactions via hosted services like Blockfrost. Running a local node is an option explored later in the course.

---

## What You Are Building

You will build a program that:

- Connects to the Cardano preprod network
- Queries UTxOs at a wallet address
- Constructs a transaction that sends ADA to a recipient
- Automatically balances inputs, outputs, fees, and change
- Signs the transaction
- Submits it to the network

This lesson focuses on **single-signer, ADA-only transactions**.

---

## Example: Simple ADA Transfer

Below is a complete example. You do not need to understand every line yet—focus on the overall structure and flow.

```go
package main

import (
    "fmt"
    "log"

    apollo "github.com/Salvionied/apollo"
    BlockFrostChainContext "github.com/Salvionied/apollo/chaincontext/blockfrost"
)

func main() {
    // 1. Create a chain context (network connection)
    cc := BlockFrostChainContext.NewBlockfrostChainContext(
        "preprod",
        "preprodYOUR_BLOCKFROST_KEY",
        false,
    )

    // 2. Load signing key
    skey, err := apollo.LoadSigningKeyFromFile("payment.skey")
    if err != nil {
        log.Fatal(err)
    }

    senderAddr := skey.PubKey().Address("preprod")

    // 3. Create a transaction builder
    builder := apollo.NewTransactionBuilder(cc)

    // 4. Build the transaction
    tx, err := builder.
        SetWalletFromBech32(senderAddr.String()).
        PayToAddress("addr_test1...", 2_000_000).
        Complete()

    if err != nil {
        log.Fatal(err)
    }

    // 5. Sign the transaction
    signedTx, err := tx.Sign(skey)
    if err != nil {
        log.Fatal(err)
    }

    // 6. Submit to the network
    txHash, err := cc.SubmitTx(*signedTx)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Transaction submitted! Hash: %s\n", txHash)
}
```

---

## Reading the Code Top to Bottom

This program follows the same lifecycle as every Cardano transaction:

1. Connect to the network
2. Load keys
3. Declare transaction intent
4. Finalize and balance
5. Sign
6. Submit

Here is a table that shows it:

| Lifecycle step         | Where it happens in Apollo                |
| ---------------------- | ----------------------------------------- |
| Connect                | `NewBlockfrostChainContext(...)`          |
| Load keys              | `LoadSigningKeyFromFile(...)`             |
| Declare intent         | `SetWalletFromBech32()`, `PayToAddress()` |
| Finalize & balance    | `Complete()`                         |
| Sign                   | `tx.Sign(skey)`                           |
| Submit                 | `cc.SubmitTx(...)`                        |

---

### Lifecycle 1: Chain Context or Connect to the network

The chain context is how Apollo communicates with the Cardano network.

```go
cc := BlockFrostChainContext.NewBlockfrostChainContext(
    "preprod",
    "preprodYOUR_BLOCKFROST_KEY",
    false,
)
```

The chain context is responsible for:

- Querying UTxOs
- Fetching protocol parameters
- Submitting transactions

---

### Lifecycle 2: Loading a Signing Key

Cardano transactions must be signed.

```go
skey, err := apollo.LoadSigningKeyFromFile("payment.skey")
```

This example assumes a Cardano CLI-style signing key file created in **SLT 102.1 – I Can Create a Wallet with Bursa** (the `payment.skey` generated there is reused here).

---

### Lifecycle 3: Declaring Transaction Intent

This is the most important part of the lesson.

```go
tx, err := builder.
    SetWalletFromBech32(senderAddr.String()).
    PayToAddress("addr_test1...", 2_000_000).
    Complete()
```

Read this as:

- Spend from the sender address
- Pay 2 ADA to the recipient
- Let Apollo figure out how to make it valid

---

### Lifecycle 4: Finalize and Balance

`Complete()` is where UTxO selection, fee calculation, and change output creation occur.

---

### Lifecycle 5: Signing and Submission

Once a transaction is complete, it can be signed and submitted.

```go
signedTx, err := tx.Sign(skey)
txHash, err := cc.SubmitTx(*signedTx)
```

At this point, the transaction is broadcast to the network.

---
Let's Write this transaction step by step:

## Step-by-Step Build (Read, Then Run)

This lesson is a coding lesson: you will write a small Go program. The goal is to build it in small pieces so you can read and understand what each part is doing.

Throughout the steps below, you will replace placeholders like `preprodYOUR_BLOCKFROST_KEY` and `addr_test1...` with your real values.

### Step 0: Create the project

```go
mkdir 102_2-Apollo && cd 102_2-Apollo
go mod init 102_2-Apollo
go get github.com/Salvionied/apollo
```

Create a file named main.go.

```bash
code go.main
```

### Step 1: Start with a minimal Go program

```go
package main

import "fmt"

func main() {
    fmt.Println("Step 1 OK: Go program runs")
}
```

Run it:

```bash
go run .
```

You should see:

```bash
Step 1 OK: Go program runs
```

This confirms your Go environment is working and gives you visible feedback.


### Step 2: Add imports and the chain context

Add these imports:

```go
import (
    "log"

    BlockFrostChainContext "github.com/Salvionied/apollo/chaincontext/blockfrost"
)
```

Then create the chain context:

```go
cc := BlockFrostChainContext.NewBlockfrostChainContext(
    "preprod",
    "preprodYOUR_BLOCKFROST_KEY",
    false,
)
```

**What you just did:** created the object Apollo uses to query the chain and submit transactions.

### Step 3: Load your signing key and derive your sender address

Add the Apollo import:

```go
apollo "github.com/Salvionied/apollo"
````

Then load the signing key:

```go
skey, err := apollo.LoadSigningKeyFromFile("payment.skey")
if err != nil {
    log.Fatal(err)
}

fmt.Println("Step 3 OK: Signing key loaded")
```

Derive the sender address:

```go
senderAddr := skey.PubKey().Address("preprod")
fmt.Println("Sender address:", senderAddr.String())
```

**Where does **``** come from?**

It is created in **SLT 102.1 – I Can Create a Wallet with Bursa**. Copy it into this folder for the purpose of this lesson, and make sure it is ignored by git.

---
### Step 4: Create the transaction builder

```go
builder := apollo.NewTransactionBuilder(cc)
```
Think of `builder` as the place where you declare transaction intent.

---

### Step 5: Declare intent and finalize with `Complete()`

```go
tx, err := builder.
    SetWalletFromBech32(senderAddr.String()).
    PayToAddress("addr_test1...", 2_000_000).
    Complete()

if err != nil {
    log.Fatal(err)
}

fmt.Println("Step 5 OK: Transaction finalized and balanced")
```

**Read this as:**

- Spend from `senderAddr`
- Pay 2 ADA to `recipientAddr`
- Let Apollo select UTxOs, calculate fees, and generate change

---

### Step 6: Sign and submit

Sign:

```go
signedTx, err := tx.Sign(skey)
if err != nil {
    log.Fatal(err)
}

fmt.Println("Step 6 OK: transaction signed and submitted")
```
---

### Step 7: Print the transaction hash

Print the tx hash:

```go
fmt.Printf("Transaction submitted! Hash: %s\n", txHash)
```

Now you can copy the hash into a block explorer to verify the transaction.

---

## Verifying Your Transaction

After submission, copy the transaction hash and view it on a block explorer:

- [https://preprod.cardanoscan.io/](https://preprod.cardanoscan.io/)

You should see:

- Inputs consumed
- Outputs created
- Fees paid

---

## What This Example Does Not Cover

To keep the lesson focused, this example does not include:

- Multi-signature transactions
- Native assets or tokens
- Smart contract interactions
- Custom fee logic

These will be introduced in later lessons.

---

## Common Errors

- **Insufficient funds**: Ensure your wallet has enough test ADA
- **Wrong network**: Your Blockfrost key must match the network
- **Pending UTxOs**: Wait for previous transactions to confirm

---

## Summary

- You built a real Cardano transaction in Go
- Apollo handled UTxO selection and fee calculation
- You signed and submitted the transaction
- You verified the result on-chain

This pattern is the foundation for every transaction you will build in this course.
