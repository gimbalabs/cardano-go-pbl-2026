# Assignment 102: Transaction Sender

## Artifact

A Go command that builds a preprod transaction with Apollo from a Bursa-managed wallet — with a validity window and attached metadata — and demonstrates both signing modes, submitting the programmatically-signed transaction to a node with gOuroboros.

## Required Task

This is the module where you make the chain *do* something. Build a small program (a new command on your 099 CLI skeleton is ideal) that takes a transaction all the way from intent to a confirmed on-chain event.

- Use a **Bursa** wallet as the sender — reuse the wallet you created in Module 100, or create a fresh one with Bursa (`go run ./cmd/bursa wallet create`). This wallet supplies the address and keys (102.1).
- Build a balanced ADA payment with **Apollo** using a Blockfrost preprod ChainContext to fetch UTxOs and protocol parameters; let Apollo handle input selection, fees, and change (102.2).
- **Set a validity window** on the transaction (a TTL / `invalid_hereafter` slot) (102.5), and **attach simple metadata** under a label of your choice (102.6).
- Demonstrate **both signing modes** (102.3): sign programmatically in Go with Apollo, *and* export the unsigned transaction CBOR and sign + submit it from a wallet.
- **Submit the programmatically-signed transaction to a node with gOuroboros** (102.4) — i.e. via Ouroboros TxSubmission to a node, not only through Blockfrost's REST submit.

This is the DNS CLI's core write path in miniature: the CLI's job is ultimately to build, sign, and submit transactions — and to carry a payload (here, metadata) that represents a name record.

## Additional Exploration

Make the metadata mean something: store a fake **DNS record** (a `name → value` mapping) under a chosen metadata label, then write a tiny reader that fetches the transaction back and pulls the record out of its metadata. That's a direct rehearsal of what the DNS CLI does. As a second stretch, submit via a **local node over N2C** instead of a public relay and note what changed.

## Deliverables

1. **Code** — public repo or gist with the runnable command (Bursa wallet → Apollo build → validity window + metadata → sign → gOuroboros submit). README explains how to run it and which preprod relay/node you submitted to.
2. **Unsigned CBOR** — the hex string your program exports *before* signing, showing a balanced transaction body (with your metadata and validity window) and no witnesses. This is the artifact you hand to a wallet for manual signing.
3. **Two confirmed transactions on [Cardanoscan Preprod](https://preprod.cardanoscan.io/)** — include both tx hashes:
   - **Programmatic + gOuroboros** — built and signed in Go, submitted to a node via gOuroboros.
   - **Manual** — the exported unsigned CBOR, signed and submitted from a wallet.
   At least one must visibly show your **attached metadata** and **validity window** on the explorer.
4. **Course feedback (required):** Written feedback on Module 102's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 102.2).

## Assessment Criteria

- **SLT 102.1** — pass when a Bursa-managed wallet supplies the sender address/keys (address shown; created or loaded via Bursa).
- **SLT 102.2** — pass when a balanced ADA transaction built with Apollo (Apollo handling UTxO selection, fees, and change) lands on chain.
- **SLT 102.3** — pass when **both** signing modes are evidenced: programmatic (Apollo `Sign()` in Go) and manual (unsigned CBOR exported, then signed/submitted via a wallet).
- **SLT 102.4** — pass when at least one transaction is submitted to a node via **gOuroboros** (not only Blockfrost), with the resulting tx hash.
- **SLT 102.5** — pass when a transaction sets a validity window (TTL / `invalid_hereafter`), visible on the explorer or in the exported tx body.
- **SLT 102.6** — pass when a transaction carries simple metadata, visible on the explorer.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Libraries: **Bursa** (`github.com/blinklabs-io/bursa`), **Apollo** (`github.com/Salvionied/apollo`), **gOuroboros** (`github.com/blinklabs-io/gouroboros`). Building uses a **Blockfrost preprod** ChainContext for UTxOs + protocol params; preprod network magic is `1`.
- Lessons 102.2/102.3 submit via Blockfrost — that's the baseline. For **102.4** you submit the signed CBOR to a node through gOuroboros TxSubmission: a public preprod relay over N2N works (e.g. `preprod-node.world.dev.cardano.org:3001`), or a local node.
- **Security:** keep the mnemonic and signing keys out of git (a gitignored Bursa wallet dir or `.env`). Submit only tx hashes and the public address — never secrets.
- Set `invalid_hereafter` to a slot comfortably in the future; too tight and the tx can expire before the node accepts it.
- Fund the sender from the preprod faucet first, and wait for prior transactions to confirm so your UTxOs aren't pending.
- _Lesson content for 102.4–102.6 is not yet written; this assignment is drafted from the SLTs and the written 102.1–102.3 lessons. Reconcile command names and APIs once those lessons exist._
