# Cardano Go PBL Outline

## 100 - Prerequisites + Tools of Cardano Go Development

1. I know enough about Cardano to start this course.
2. I understand the essentials of how Ouroboros works.
3. I understand why Bursa was built and what problems it solves.
4. I understand why Apollo was built and what problems it solves.
5. I understand why Adder was built and what problems it solves.
6. Should we introduce Cardano Up here?

## 101 - Interacting with the Cardano Node

1. I can run the gOuroboros Starter kit https://demeter.run/starter-kits/gouroboros
2. I can fetching specific blocks from a remote Cardano Node using Node-to-Node communication over the network
3. I can check sync state of the blockchain from a Cardano Node using either Node-to-Node or Node-to-Client communication
4. I can fetch information about the Node's mempool contents

## 102 - Building Simple Transactions

1. I can create a wallet with Bursa.
2. I can build a simple transaction with Apollo.
3. I can sign a Tx with Apollo.
4. I can submit a transaction to a node with gOuroboros.
5. I can set a validity interval for a transaction.
6. I can add simple metadata to a transaction.

## 103 - Reacting to Chain Events

1. I can run the Adder Starter Kit...
2. I can configure Adder to connect to a Node in x ways...
3. I can filter by event type
4. I can filter transactions by address
5. I can filter by policy id
6. I can filter by pool id
7. I can write (a thing) that (responds to / handles) on-chain events -- leads into Assignment

## 201 - Querying the Blockchain

1. I understand the role of an indexer and practical concerns.
2. I understand the limits of event handler + when I need a more general query (historical data)
3. I can store and retrieve data using Adder.
4. I can select the right query provider for my application.
5. I can enrich event data with query data (from Kupo).

## 202 - Applications and Smart Contracts

1. build tx for minting / burning tokens with native script
2. build tx for minting tokens with validator script
3. build unlocking tx for validator
4. datums - bbk - introduce concepts
5. redeemers - bbk introduce concepts
6. high level - how to build an app - concerns for production

## 203 - Serializing Data

1. I can read datums and redeemers from deserialized CBOR.
2. I can compile a parameterized validator script.
3. I can read a transaction event that includes a smart contract interaction.
4. I can manipulate and understand deserialized CBOR.
5. Quick intro - optional deeper study: reading CDDL (quick intro!)
6. debugging: reading protobuf (UTxO RPC definitions)

## 301 - What to do when none of the above actually works

1. Some good ideas for troubleshooting
2. Getting stuck with nilaway...
3. Debug port and Go Profiler
4. Phone a friend / ask a question / where to get help

## 302 - Contributing

1. I can

## 303 - Example Projects

(No SLTs defined)

## 99 - Golang Background Knowledge

(No SLTs defined)

## 999 - Golang BBK

1. I can write a command-line interface using the Cobra Go library.
