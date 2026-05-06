# Module 204 — Serializing Data

If you made it this far, we love you. Now we slow down and look under the hood.

In Modules 201–203 you read chain data, built transactions, and interacted with smart contracts. All of that worked because the libraries (Apollo, Adder, gOuroboros) silently encoded and decoded bytes for you. This module lifts the lid on the binary formats that move data across Cardano: **CBOR** for on-chain values, **CDDL** as the schema that describes them, and **Protobuf** as a comparable schema language used by Cardano APIs and event streams.

By the end of this module you will be able to:

- Extract **datums** and **redeemers** from raw CBOR
- Compile a **parameterized** validator and apply parameters at deployment time
- Watch a chain event with **Adder** and identify the smart contract interaction inside it
- Modify a decoded `PlutusData` value and re-encode it for use in a new transaction
- Read a **Protobuf** spec well enough to interpret data from an external service
- Use the **CDDL** specification from `cardano-ledger` as a reference for any transaction byte you encounter

> **Prerequisites:** Module 203 — you should be comfortable building Plutus transactions with Apollo and reading a `plutus.json` blueprint.
