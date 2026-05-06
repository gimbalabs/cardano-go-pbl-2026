# Module 203 — Applications and Smart Contracts

You can read chain data. You can build and submit basic transactions. Now it gets interesting.

This module is about **smart contract interaction** — the layer where your Go code meets on-chain logic. You'll learn to mint and burn tokens, lock and unlock funds held by validators, and pass data into scripts at transaction time using datums and redeemers.

All of this is done with **Apollo**, Cardano's pure Go transaction building library. Apollo gives you a fluent, chainable API that handles the low-level CBOR serialization and script execution context so you can focus on the transaction logic itself.

By the end of this module you will be able to:

- Trace how an **Aiken** type flows from a blueprint file into Go structs
- Mint and burn tokens with both **native scripts** and **Plutus validator scripts**
- **Unlock** funds held at a smart contract address
- Attach **datums** to outputs and pass **redeemers** into scripts

You'll use **Adder** throughout to observe your transactions land on-chain and verify the results.

> **Prerequisites:** Modules 201 and 202 — reading chain data and building basic transactions with Apollo.