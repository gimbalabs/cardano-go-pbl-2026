# SLT 102.3: I can sign a transaction manually and programmatically

Building on the previous lesson, this lesson is about signing transactions to two distigited ways - Manually and Programmatically.  Actually, you did the programmattical way in the last lesson.  In this lesson we focus on the manual way.  

By the end of this lesson, you will you the same transaction code from before and alter it to produce Unsigned CBOR which you will manually sign by importing that CBOR into a Cardano wallet.

---

## Prerequisites

Before you begin, ensure you have:

- Go 1.21+ installed
- A [Blockfrost](https://blockfrost.io/) API key (free tier works for this lesson)
- A Cardano preprod testnet wallet funded with test ADA - both mnemonics and address (created in previous lesson)
  - 
- A basic understanding of the Cardano UTxO model
- Completed **SLT 102.2 – I can build a simple transaction with Apollo**

> **Note on infrastructure:** You do **not** need to run a local Cardano node for this lesson. Apollo can query the chain and submit transactions via hosted services like Blockfrost. Running a local node is an option explored later in the course.

---

## What You Are Building

Programatic signing is what you did in 102.2.  In this lesson you will alter your code to generate unsigned CBOR which you then import and sign with a Cardano Wallet.  
---

## Example: Simple ADA Transfer

Below is example code from before with some of the comments removed. You should be getting more familiar with this now. 

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
    cc := apollo.NewEmptyBackend()
    apollob := apollo.New(&cc)

    // ---------------------------------------------------------------------
    // 3) Load a wallet from a mnemonic
    // ---------------------------------------------------------------------
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
    utxos, err := bfc.Utxos(*apollob.GetWallet().GetAddress())
    if err != nil {
        panic(err)
    }

    // ---------------------------------------------------------------------
    // 5) Declare transaction intent and finalize
    // ---------------------------------------------------------------------
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

Since we want to MANUALLy sign and submit this transaction, we will simply remove (or comment out) the sign and submit steps.  Easy part.  And, then manually copy the CBOR and paste it into our wallet to Sign and submit.

---
Let's create a new folder for this modified transaction.

### Step: Create the project

```go
mkdir 102_3-Apollo && cd 102_3-Apollo
mkdir tmp
go mod init 102_3-Apollo
go get github.com/Salvionied/apollo
```

Copy over the main.go file and make a note of the SEED mnemonic

### Step: Add the code to go.main

Copy everything in the sample code into in main.go

```go
//everything from above
```

**What you just did:** created go program that uses Apollo to build and submit transactions.

### Step: Alter the code to get unsigned CBOR

Comment out the following lines  - steps 6 and 8

```go
    // ---------------------------------------------------------------------
    // 6) Sign the transaction (Comment out)
    // ---------------------------------------------------------------------
    //apollob = apollob.Sign()

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
    // 8) Submit the transaction (comment out)
    // ---------------------------------------------------------------------
    //tx_id, err := bfc.SubmitTx(*tx)
    //if err != nil {
    //    panic(err)
    //}

    // Print the transaction hash returned by the network
    fmt.Println("Tx hash:", hex.EncodeToString(tx_id.Payload))
}

```
 

### Step : run the program and copy the CBOR
You should have the needed stuff from the previous lesson. 

mnemonic:
sender address (derived from the mnemonic):
a reciever address:

You will need a few ADA for the transaction to work.  So you can check your addresses at an explorer:
[https://preprod.cardanoscan.io/](https://preprod.cardanoscan.io/)

### step  : Run the transaction, inspect and troubleshoot
Now it's time for the magic trick.  You must create a wallet with the same mnemonic as the code.  And then import the raw CBOR and the wallet will ask you to sign.  

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



---

## Common Errors

- **Insufficient funds**: Ensure your wallet has enough test ADA
- **Wrong network**: Your Blockfrost key must match the network
- **Pending UTxOs**: Wait for previous transactions to confirm

---

## Summary

- You built a real Cardano transaction in Go
- Apollo handled UTxO selection and fee calculation
- You signed and submitted the transaction - Manually with a stand alone wallet 
- You verified the result on-chain

This pattern is the foundation for every transaction you will build in this course.
