# Assignment 204: CBOR Round-Trip and the One-Shot NFT

## Artifact

A Go toolkit that works at the byte level: it mints a one-shot NFT from a parameterized validator, observes that mint with Adder and identifies the contract interaction inside the event, and decodes an on-chain datum/redeemer, modifies it, and re-encodes it for a new transaction — backed by a short note mapping the bytes to their Protobuf and CDDL definitions.

## Required Task

This module lifts the lid on the binary formats the libraries handled for you. Build a small toolkit around the `hello_world` contract from Module 203 that does the encoding and decoding *yourself*:

- **Parameterize and mint a one-shot NFT** — add an `OutputReference` parameter to the `hello_world` validator, apply it with `aiken blueprint apply`, and mint a token whose policy ID is unique to a single consumed UTxO (quantity 1, un-repeatable) (204.2).
- **Observe and identify** — run an Adder watcher (Module 201) and, when your mint lands, pull the **contract interaction** out of the event payload — the redeemer / minted asset that proves a script ran (204.3).
- **Decode** — take a real on-chain datum or redeemer CBOR (your 203 lock datum, or this mint's redeemer) and decode it back into Apollo `PlutusData` with `UnmarshalCBOR`, extracting the fields by `PlutusDataType` (204.1).
- **Modify and re-encode** — change a field in that decoded value (e.g. the datum's `owner`, or add a field) and re-encode it to valid CBOR, then use it in a new transaction. The round-trip must preserve indefinite-length arrays so the canonical bytes still validate (204.4).
- **Map the bytes** — write a short note that traces one field you handled to its definition in **two** schemas: the **Protobuf** spec Cardano's UTxORPC/gRPC interfaces use (204.5), and the **CDDL** specification in `cardano-ledger` (204.6).

This is the DNS CLI's data layer at its most precise: a one-shot NFT is exactly how you guarantee a registered **name is unique**, and decode→modify→re-encode is how the CLI would **read and update a name record** stored in a datum.

## Additional Exploration

Make the round-trip mean something: decode the datum from your 203 lock UTxO, rewrite it into a "name record" datum (`owner` + a record string), re-encode it, lock a new output with the modified datum, then read it back off-chain and confirm the bytes survived the trip. That's a working name-record update.

## Deliverables

1. **Code** — public repo or gist with the toolkit (parameterized mint, Adder identify, decode, modify + re-encode) and the applied `plutus.json`. README explains how to run each step.
2. **One-shot NFT** — tx hash on [Cardanoscan Preprod](https://preprod.cardanoscan.io/) showing quantity **exactly 1** under your final (unique) policy ID, with the parameter UTxO appearing in the transaction's **inputs**.
3. **Adder identification** — captured watcher output for the mint, plus your code's report of the contract interaction found inside the event (the redeemer and/or minted asset).
4. **CBOR round-trip** — for a real datum/redeemer: the decoded `PlutusData` fields (204.1), then the **before/after CBOR hex** of a modified value re-encoded (204.4), and the transaction (or tx body) that used the re-encoded value.
5. **Byte-level reference note** — one data field traced to (a) its message/field in the **UTxORPC Protobuf** spec, and (b) its rule in the **`cardano-ledger` CDDL**. Cite the specific message/field name and CDDL rule.
6. **Course feedback (required):** Written feedback on Module 204's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 204.2).

## Assessment Criteria

- **SLT 204.1** — pass when on-chain CBOR is decoded into `PlutusData` and the fields are correctly extracted, type-asserted by `PlutusDataType` (not by assumption).
- **SLT 204.2** — pass when a parameterized validator is compiled and applied (`aiken blueprint apply`) and a one-shot NFT is minted: quantity 1, unique policy ID, parameter UTxO consumed in the inputs.
- **SLT 204.3** — pass when an Adder event for a contract transaction is captured and the contract interaction inside it (redeemer / minted asset) is correctly identified.
- **SLT 204.4** — pass when a decoded `PlutusData` is modified and re-encoded to valid CBOR with indefinite-length arrays preserved, and the result is used in / accepted for a transaction.
- **SLT 204.5** — pass when the learner correctly maps a data field to its definition in a Cardano Protobuf spec (UTxORPC).
- **SLT 204.6** — pass when the learner cites the CDDL definition (`cardano-ledger`) for a specific transaction component they handled.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Builds directly on Module 203's `hello_world` contract. Requires the **Aiken toolchain** (`aiken build`, `aiken blueprint apply`) for 204.2, **Apollo** for decode/encode, a **Blockfrost preprod** ChainContext, and **Adder** for 204.3. Preprod network magic is `1`.
- **Re-encoding gotcha:** Plutus emits indefinite-length arrays (`9f … ff`). Always rebuild with `PlutusIndefArray` — a definite array re-encodes to different canonical bytes and the validator/hash check fails (204.1, 204.4).
- **`OutputReference` parameter CBOR** is a constructor with two fields *in order*: `transaction_id` (`#bytes`, 32) then `output_index` (`#integer`). Swapping them bakes the wrong UTxO into the script.
- **Protobuf (204.5):** Cardano's **UTxORPC** spec is the natural target — it's the gRPC interface Dolos exposes. Read its `.proto` definitions for the field you handled.
- **CDDL (204.6):** use the CDDL from **`cardano-ledger`** — the canonical schema for every transaction byte.
- **Security:** keep mnemonic/keys out of git; submit tx hashes and public identifiers only.
