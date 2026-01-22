# Cardano Go PBL Outline

## 100 - Prerequisites + Tools of Cardano Go Development
Here's some background knowledge about Cardano development. If you're experienced with Go but new to Cardano, you're in the right place. Lessons 100.3 through 100.6 are organized around problem statements, introducing some of the libaries we'll use this course and why there were built.

1. I know enough about Cardano to start this course.
2. I understand the essentials of how Ouroboros works.
3. I understand why Bursa was built and what problems it solves.
4. I understand why Apollo was built and what problems it solves.
5. I understand why Adder was built and what problems it solves.
6. I understand why Cardano Up was built and what problems it solves.
7. I know how this course works and I'm ready to get my hands dirty.

## 101 - Interacting with the Cardano Node
Show devs their options for accessing a Cardano Node, and support them to get at least one option working. Then, complete some basic operations.

1. I can run the gOuroboros Starter Kit. (use demeter.run CLI)
2. I can fetch specific blocks from a remote Cardano Node using Node-to-Node communication.
3. I can check sync state of the blockchain from a Cardano Node using either Node-to-Node or Node-to-Client communication.
4. I can fetch information about the Node's mempool contents.

## 102 - Building Simple Transactions
Learn the essentials of transaction building. When we're building transactions, we'll have to query the blockchain for some basic information; this will be covered in lesson 102.2 and reviewed each time we build a new transaction.

1. I can create a wallet with Bursa.
2. I can build a simple transaction with Apollo.
3. I can sign a transaction manually and programmatically.
4. I can submit a transaction to a node with gOuroboros.
5. I can set a validity interval for a transaction.
6. I can add simple metadata to a transaction.

## 201 - Reacting to Chain Events
To build a dapp, you'll need to do more than just build transactions. In Modules 201, 202 and 203, we investigate the rest of the Cardano application stack. In this module, you will learn how to monitor what's happening on the blockchain by watching the chain and filtering events.

1. I can run the Adder Starter Kit.
2. I can configure Adder to connect to a Cardano Node.
3. I can filter by event type.
4. I can filter transactions by address.
5. I can filter transactions by policy id.
6. I can filter blocks by pool id.

## 202 - Querying the Blockchain
In Module 201, we learned about how to index the blockchain as transactions happen. Sometimes you need to view global or historical blockchain data that is not indexed by your app.

1. I understand the role of an indexer and practical concerns for using one.
2. I understand the limits of an event handler and when I need a more general query.
3. I can store and retrieve data using Adder.
4. I can select the right query provider for my application.
5. I can enrich event data with query data.

## 203 - Applications and Smart Contracts
Now that you know how to read blockchain data and build basic transactions, you're ready to build some interesting applications! Let's investigate a variety of transactions that allow us to interact with smart contracts. When we do, we'll use Adder to watch the results of these transactions.

1. I can compare types written in Aiken, blueprint files, and Go code.
2. I can build a transaction that mints or burns tokens with a native script.
3. I can build a transaction that mints or burns tokens with a validator script.
4. I can build a transaction that unlocks tokens from a validator script.
5. I can build a transaction that writes datum to a new UTxO.
6. I can build a transaction that specifies a redeemer.

## 204 - Serializing Data
If you made it this far, we love you. And we'd like you to understand some details about how data is stored on the blockchain.

1. I can read datums and redeemers from deserialized CBOR.
2. I can compile a parameterized validator script.
3. I can read a transaction event that includes a smart contract interaction.
4. I can manipulate and understand deserialized CBOR.
5. I can read a protobuf spec to understand standardized data.
6. I can reference the CDDL to understand what's in transaction CBOR.

## 301 - What to do when none of the above actually works

1. I can find and fix bugs in my application.
2. I can use use Go Profiler and the debug port to diagnose bugs.
3. I know where to go for help.

## 302 - Contributing

1. I can make a PR to Blink Labs repository.

## 099 - Golang BBK
Course modules for Cardano people who don't know Go yet. This will be a series of mini-projects that we build while updating Cardano Go PBL.

1. I can write a command-line interface using the Cobra Go library.
2. I can use Fiber to build an API.
3. Debugging and type compatibility in Go


## Course Glossary

