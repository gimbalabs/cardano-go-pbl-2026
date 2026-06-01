# Assignment 203: Hello World Contract Lifecycle

## Artifact

A Go program that drives the module's `hello_world` validator through its full lifecycle on preprod — building the datum and redeemer from the blueprint, minting with a native script and with the validator, locking funds with a datum, and unlocking them with a redeemer — while an Adder watcher observes each transaction land.

## Required Task

This is where your Go code meets on-chain logic. Using the module's `hello_world` Aiken contract and its `plutus.json` blueprint (you're *reading* the blueprint, not writing Aiken), build a program that exercises every kind of smart-contract interaction the module covers, all against the same validator:

- **Read the blueprint into Go** — construct the `Datum` (`owner`) and `Redeemer` (`msg`) as Apollo `PlutusData`, matching the blueprint's constructor tag and field order exactly (203.1).
- **Mint or burn with a native script** — a token under a native-script policy, no validator required (203.2).
- **Lock funds with a datum** — pay to the validator's script address with a `Datum` attached to the output, where `owner` is your wallet's payment key hash (203.3).
- **Unlock those funds** — spend the locked UTxO, passing the `Redeemer` (`msg = "HelloSpendRedeemer"`) and signing with the `owner` key so the validator's `must_say_hello && must_be_signed` check passes (203.4 + 203.5).
- **Mint or burn with the validator script** — invoke the contract's `mint` handler with `msg = "HelloMintRedeemer"` (203.6).
- **Watch it happen** — run an Adder watcher (from Module 201) and capture your transactions landing on-chain.

This is the most direct preview of the **DNS CLI** yet: a name registry *is* a validator holding records in datums, updated by the owner through redeemers, with name-tokens minted under a policy. You're building that machinery here on a toy contract.

## Additional Exploration

Turn `hello_world` into a tiny name registry: extend the `Datum` with a second field (a record string alongside `owner`, exactly as the multi-field example in 203.1 shows), lock a "name record" with it, then unlock it. Point a **filtered Adder watcher** at the script address and confirm the datum you attached shows up in the observed transaction.

## Deliverables

1. **Code** — public repo or gist with the runnable program (blueprint → `PlutusData`, native mint, lock-with-datum, unlock-with-redeemer, validator mint) plus the Adder watcher. README explains how to run each step.
2. **PlutusData mapping** — show your Go `Datum` and `Redeemer` construction and a one-line trace of how each maps back to the blueprint `definitions` (constructor → tag 121, fields in order, `#bytes` → `PlutusBytes`).
3. **Confirmed transactions on [Cardanoscan Preprod](https://preprod.cardanoscan.io/)** — tx hashes for each:
   - native-script **mint/burn** (203.2),
   - an output that **locks funds at the script address with a datum** (203.3),
   - a transaction that **unlocks** those funds, passing the redeemer and owner signature (203.4 + 203.5),
   - a **validator-script mint/burn** (203.6).
4. **Adder evidence** — captured output from your watcher showing at least one of these transactions detected on-chain.
5. **Course feedback (required):** Written feedback on Module 203's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 203.4).

## Assessment Criteria

- **SLT 203.1** — pass when the Go code builds `Datum` and `Redeemer` as `PlutusData` matching the blueprint (constructor tag `121`, correct field order and `#bytes` types), with a trace to the `definitions`.
- **SLT 203.2** — pass when a transaction mints or burns a token using a **native script**, confirmed on-chain.
- **SLT 203.3** — pass when a transaction creates an output at the **validator's script address with a datum attached**.
- **SLT 203.4** — pass when a transaction **spends (unlocks)** the funds held at the script address.
- **SLT 203.5** — pass when that unlock **supplies the redeemer** (`HelloSpendRedeemer`) and the required `owner` signature, satisfying the validator.
- **SLT 203.6** — pass when a transaction mints or burns using the **validator (Plutus) script** with the `HelloMintRedeemer` redeemer.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Use the module's **`hello_world`** validator and its `plutus.json` — no Aiken authoring required (you read the blueprint, per 203.1). Compiling and *parameterizing* contracts comes later, in 204.2.
- Libraries: **Apollo** (`PlutusData`, building, script context), a **Blockfrost preprod** ChainContext, and **Adder** for observation. Preprod network magic is `1`.
- The datum's `owner` must be **your wallet's payment key hash**, and the unlock transaction must be **signed by that key** (it lands in `extra_signatories`) — the validator checks `list.has(self.extra_signatories, owner)`.
- The redeemer `msg` is **bytes, not a string**: `[]byte("HelloSpendRedeemer")` / `[]byte("HelloMintRedeemer")`.
- Wrong `PlutusData` shape or field order produces a transaction the validator silently rejects — inspect the unsigned tx and build up one step at a time.
- _Heads-up: `00-course.md` lists Module 203's SLTs in a different order than the lessons (and `outline.md`). This assignment follows the **lesson** order. `00-course.md` should be reconciled._
