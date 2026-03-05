# Cardano Go PBL - Student Learning Targets

## 099 - Intro to Go
1. I can find and fix bugs in a Go program using debugging tools.
2. I can work with Go's type system to make different parts of a program fit together.
3. I can build a command-line tool with multiple commands using the Cobra library.
4. I can create a web API that handles requests and sends responses using Fiber in Go.

## 100 - Prerequisites + Tools of Cardano Go Development
1. I can describe what Cardano is, how its blockchain differs from others, and what kinds of applications can be built on it.
2. I can explain how Ouroboros reaches consensus and why that matters for building on Cardano.
3. I can explain why Bursa was built and what problems it solves.
4. I can explain why Apollo was built and what problems it solves.
5. I can explain why Adder was built and what problems it solves.
6. I can explain why Cardano Up was built and what problems it solves.
7. I can navigate the course structure and set up my development environment for the modules ahead.

## 101 - Interacting with the Cardano Node
1. I can set up and run the gOuroboros Starter Kit to connect to a Cardano Node.
2. I can fetch specific blocks from a remote Cardano Node.
3. I can check how far a Cardano Node has synced with the blockchain.
4. I can fetch information about pending transactions waiting in a Node's mempool.

## 102 - Building Simple Transactions
1. I can create a wallet with Bursa.
2. I can build a simple transaction with Apollo.
3. I can sign a transaction manually and programmatically.
4. I can submit a transaction to a node with gOuroboros.
5. I can set a time window that controls when a transaction is valid.
6. I can add simple metadata to a transaction.

## 201 - Reacting to Chain Events
1. I can set up and run the Adder Starter Kit to watch blockchain events.
2. I can configure Adder to connect to a Cardano Node.
3. I can use Adder to filter blockchain events by type, address, policy, or stake pool.

## 202 - Querying the Blockchain
1. I can explain what a blockchain indexer does and evaluate trade-offs for using one in my application.
2. I can identify when an event handler isn't enough and choose a query-based approach instead.
3. I can store and retrieve data using Adder.
4. I can select the right query provider for my application.
5. I can combine live event data with historical query data to build a more complete picture of blockchain activity.

## 203 - Applications and Smart Contracts
1. I can trace how a type defined in Aiken appears in a blueprint file and in Go code.
2. I can build a transaction that mints or burns tokens using a native script (no smart contract required).
3. I can build a transaction that mints or burns tokens using a validator script (smart contract).
4. I can build a transaction that unlocks tokens held by a smart contract.
5. I can build a transaction that attaches data to a new output on the blockchain.
6. I can build a transaction that passes input data to a smart contract using a redeemer.

## 204 - Serializing Data
1. I can extract smart contract data (datums and redeemers) from Cardano's binary format (CBOR).
2. I can compile a smart contract that accepts parameters at deployment time.
3. I can read a blockchain event and identify the smart contract interaction inside it.
4. I can modify decoded CBOR data structures in Go and re-encode them for use in transactions.
5. I can read a protobuf spec and use it to interpret how data is structured in a system.
6. I can use the CDDL specification as a reference to understand the structure of Cardano transaction data.

## 301 - Debugging
1. I can diagnose and fix bugs that span blockchain interactions, not just Go code.
2. I can use Go's profiling and debugging tools to diagnose performance and runtime issues.
3. I can identify the right community resources, documentation, and support channels for troubleshooting Cardano Go development.

## 302 - Contributing
1. I can make a PR to a Blink Labs repository.
