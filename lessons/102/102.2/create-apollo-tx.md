# SLT 102.2: I Can Build a Simple Transaction with Apollo

In this lesson, you will build, sign, and submit a simple ADA transaction on Cardano using Apollo. This is your first hands-on experience turning transaction intent into a real ledger event.

Apollo is a Go library that makes Cardano transaction building accessible. Rather than manually constructing CBOR-encoded transactions, Apollo provides a fluent builder pattern that handles UTxO selection, fee calculation, and change output generation automatically.

By the end of this lesson, you will have submitted a transaction to Cardano preprod and verified it on a block explorer.

---

## Prerequisites

Before you begin, ensure you have:

- Go 1.21+ installed
- A [Blockfrost](https://blockfrost.io/) API key (free tier works for this lesson)
- A Cardano preprod testnet wallet funded with test ADA - both mnemonics and address (created in previous lesson)
- A basic understanding of the Cardano UTxO model
- Completed **SLT 100.4 – Apollo: Background and Purpose**

> **Note on infrastructure:** You do **not** need to run a local Cardano node for this lesson. Apollo can query the chain and submit transactions via hosted services like Blockfrost. Running a local node is an option explored later in the course.

---

## What You Are Building

You will build a program that:

- Connects to the Cardano Preprod network  
- Loads a wallet from a mnemonic  
- Queries UTxOs for that wallet  
- Constructs a transaction that sends ADA  
- Automatically balances inputs and change  
- Signs the transaction  
- Submits it to the network

This lesson focuses on **single-signer, ADA-only transactions**.

---

## Example: Simple ADA Transfer

Below is a complete example. You do not need to understand every line yet—focus on the overall structure and flow.

```go
package main

import (
    "encoding/hex"
    "fmt"

    // CBOR is the binary format Cardano uses on-chain
    "github.com/fxamacker/cbor/v2"

    // Apollo is the transaction-building library
    "github.com/Salvionied/apollo"

    // BlockFrostChainContext is a ChainContext implementation
    // that knows how to query the Cardano blockchain via Blockfrost
    "github.com/Salvionied/apollo/txBuilding/Backend/BlockFrostChainContext"

    // Network / environment constants (PREVIEW, PREPROD, MAINNET, etc.)
    "github.com/Salvionied/apollo/constants"
)

func main() {
    // ---------------------------------------------------------------------
    // 1) Create a ChainContext (how Apollo learns about the blockchain)
    // ---------------------------------------------------------------------
    // The ChainContext is responsible for:
    // - fetching UTxOs
    // - fetching protocol parameters (fees, limits, etc.)
    // - submitting transactions
    //
    // Apollo itself does NOT talk to the blockchain directly.
    // It relies on a ChainContext like this one.
    bfc, err := BlockFrostChainContext.NewBlockfrostChainContext(
        constants.BLOCKFROST_BASE_URL_PREPROD, // Blockfrost endpoint
        int(constants.PREPROD),                // Network (PREPROD testnet)
        "blockfrost_api_key",                  // API key
    )
    if err != nil {
        panic(err)
    }

    // ---------------------------------------------------------------------
    // 2) Create an Apollo transaction builder
    // ---------------------------------------------------------------------
    // Apollo separates:
    // - the builder (constructs transactions)
    // - the ChainContext (provides blockchain data)
    //
    // Here we start with an empty backend and manually feed it data.
    cc := apollo.NewEmptyBackend()
    apollob := apollo.New(&cc)

    // ---------------------------------------------------------------------
    // 3) Load a wallet from a mnemonic
    // ---------------------------------------------------------------------
    // This derives a payment keypair and address from the mnemonic.
    // The wallet provides:
    // - the sender address
    // - signing keys for the transaction
    SEED := "your mnemonic here"
    apollob, err = apollob.SetWalletFromMnemonic(SEED, constants.PREPROD)
    if err != nil {
        panic(err)
    }

    // Set the wallet address as the change address.
    // Any leftover ADA after fees will be sent back here.
    apollob, err = apollob.SetWalletAsChangeAddress()
    if err != nil {
        panic(err)
    }

    // ---------------------------------------------------------------------
    // 4) Query UTxOs for the wallet address
    // ---------------------------------------------------------------------
    // This is equivalent to:
    //   cardano-cli query utxo --address <addr> ...
    //
    // We explicitly fetch UTxOs here to show where they come from.
    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // ---------------------------------------------------------------------
    // 5) Declare transaction intent and finalize
    // ---------------------------------------------------------------------
    // - Add the available UTxOs as possible inputs
    // - Declare an output (send ADA to another address)
    // - Complete() selects inputs, calculates fees, and balances the tx
    apollob, err = apollob.
        AddLoadedUTxOs(utxos...).
        PayToAddressBech32("your address here", 1_000_000).
        Complete()
    if err != nil {
        panic(err)
    }

    // ---------------------------------------------------------------------
    // 6) Sign the transaction
    // ---------------------------------------------------------------------
    // This attaches the required signatures using the wallet keys.
    apollob = apollob.Sign()

    // ---------------------------------------------------------------------
    // 7) Inspect the raw transaction (optional?)
    // ---------------------------------------------------------------------
    // At the ledger level, a Cardano transaction is CBOR-encoded.
    // This step shows the exact bytes that will be submitted on-chain.
    tx := apollob.GetTx()
    cborred, err := cbor.Marshal(tx)
    if err != nil {
        panic(err)
    }
    fmt.Println("CBOR tx:", hex.EncodeToString(cborred))

    // ---------------------------------------------------------------------
    // 8) Submit the transaction
    // ---------------------------------------------------------------------
    // This sends the signed CBOR transaction to the network via Blockfrost.
    tx_id, err := bfc.SubmitTx(*tx)
    if err != nil {
        panic(err)
    }

    // Print the transaction hash returned by the network
    fmt.Println("Tx hash:", hex.EncodeToString(tx_id.Payload))
}

```

---

## Transaction Lifecycle

Cardano transactions follow typical patterns. This pattern is:

1. Connect (ChainContext)  
2. Load wallet  
3. Fetch UTxOs  
4. Declare intent  
5. Complete (balance)  
6. Sign  
7. Submit  

| Lifecycle Step | Where It Happens |
|----------------|-----------------|
| Connect | `NewBlockfrostChainContext(...)` |
| Load wallet | `SetWalletFromMnemonic(...)` |
| Fetch UTxOs | `bfc.Utxos(...)` |
| Declare intent | `AddLoadedUTxOs()`, `PayToAddressBech32()` |
| Finalize | `Complete()` |
| Sign | `apollob.Sign()` |
| Submit | `bfc.SubmitTx()` |

---
Let's Write this transaction step by step:

## Step-by-Step Build (Read, Then Run)

This lesson is a coding lesson: you will write a small Go program. The goal is to build it in small pieces so you can read and understand what each part is doing.

Throughout the steps below, you will replace placeholders like `preprodYOUR_BLOCKFROST_KEY` and `addr_test1...` with your real values.

### Step 0: Create the project

```go
mkdir 102_2-Apollo && cd 102_2-Apollo
mkdir tmp
go mod init 102_2-Apollo
go get github.com/Salvionied/apollo
```

Create a file named main.go.

```bash
code main.go
```

### Step 1: Start with a minimal Go program

paste this code into the `main.go` file:
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

### Step 2: Add the code to go.main

Copy everything in the sample code into in main.go

```go
//everything from above
```

**What you just did:** created go program that uses Apollo to build and submit transactions.

### Step 3: Get a Blockfrost key

Go to [blockfrost](https://blockfrost.io) and get your API key.  To test everything is working correctly, run the following in your terminal:

```bash
curl -H "project_id: <your-project-id>" https://cardano-preprod.blockfrost.io/api/v0/epochs/latest
```
You should see something on the terminal and not an error

Paste that key into the main.go in the BlockFrostChainContext block.  

### Step 4 : Get wallet mnemonic and addresses
You should have the needed stuff from the previous lesson. 
mnemonic:
sender address (derived from the mnemonic):
a reciever address:

You will need a few ADA for the transaction to work.  So you can check your addresses at an explorer:
[https://preprod.cardanoscan.io/](https://preprod.cardanoscan.io/)
### step 5 : Run the transaction, inspect and troubleshoot
It's now time for the moment of truth.  run the 'main.go' program and inspect the tx hash on the explorer

```bash
go run .
```
You should see a CBOR tx: and Tx Hash in your terminal.
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
