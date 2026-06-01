# Assignment 100: Create Your Wallet, Map the Toolchain

## Artifact

A Bursa-generated preprod wallet (funded from the faucet) plus a short written "field guide" to the Blink Labs tools — proving your environment is set up and that you understand what each tool is for before you start building.

## Required Task

This module is about getting oriented: what Cardano is, how it reaches consensus, and why the tools you're about to use exist. Your assignment turns that orientation into something concrete — you'll create a real wallet and write down, in your own words, what each tool solves.

**Create a wallet with Bursa.** Using Bursa (a tiny Go program against [`github.com/blinklabs-io/bursa`](https://github.com/blinklabs-io/bursa), or the Bursa CLI), generate a new wallet for **preprod**: a mnemonic, payment and stake keys, and a bech32 address. Then **fund that address from the preprod faucet** so it holds some test ADA. This is the wallet you'll reuse to build transactions in Module 102, so keep it — but treat the keys correctly (see the security note).

**Write a short tools field guide.** A few sentences each, in your own words:
- What makes Cardano distinct — at least one concrete difference (e.g. the eUTxO model vs. an account model). *(100.1)*
- How Ouroboros reaches consensus, at a high level (stake-based slot leaders, epochs). *(100.2)*
- The problem each tool solves: **Bursa** *(100.3)*, **Apollo** *(100.4)*, **Adder** *(100.5)*, **Cardano Up** *(100.6)*.

The wallet you just made is the identity your **DNS CLI** will later sign name registrations with — setting it up now means every later module has a funded wallet ready to go.

## Additional Exploration

Prove the wallet is deterministic: restore it from its mnemonic with Bursa and confirm you get the same address back. As a second stretch, use **Cardano Up** to stand up part of a local stack and note what it automated for you — grounding 100.6 in something you actually ran.

## Deliverables

1. **Setup artifact** — the small Go program or the exact Bursa CLI command(s) you used to generate the wallet, in a public repo/gist or pasted with **all secret material redacted**.
2. **Wallet evidence** — your generated preprod **payment address**, plus a **faucet/funding transaction hash** showing the address holds test ADA, cross-checkable on [Cardanoscan Preprod](https://preprod.cardanoscan.io/). **Do not submit the mnemonic or signing keys.**
3. **Tools field guide** — your written answers covering Cardano's distinctiveness, Ouroboros, and why Bursa / Apollo / Adder / Cardano Up each exist.
4. **Course feedback (required):** Written feedback on Module 100's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 100.3).

## Assessment Criteria

- **SLT 100.1** — pass when the field guide names at least one concrete way Cardano differs from other blockchains (e.g. eUTxO vs. account model).
- **SLT 100.2** — pass when it correctly sketches, at a high level, how Ouroboros reaches consensus (stake-based slot leadership / epochs).
- **SLT 100.3** — pass when the learner explains the problem Bursa solves **and** has actually created a wallet with it (address provided).
- **SLT 100.4** — pass when the field guide explains why Apollo exists (building transactions in Go).
- **SLT 100.5** — pass when it explains why Adder exists (following/indexing chain events).
- **SLT 100.6** — pass when it explains why Cardano Up exists (automating environment setup).
- **SLT 100.7** — pass when the funded preprod address demonstrates a working Go + Blink Labs dev environment.
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- **Security:** never commit or submit the mnemonic or signing keys. It's a throwaway preprod wallet, but practise safe key handling now — submit only the public address and funding evidence. Keep keys in a file that's gitignored or in an environment variable.
- Wallet generation with Bursa is **offline** (local key derivation); only the faucet funding step touches the network. No node access is required for this module — preprod magic is `1`.
- This wallet carries forward to Module 102 (build a transaction with Apollo) — don't throw it away.
- _Lesson content for Module 100 is only partially written (4 of 7 lessons) and the module may be deprioritized; reconcile this assignment against the lessons once they're finalized._
