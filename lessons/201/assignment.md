# Assignment 201: Filtered Chain Watcher

## Artifact

A Go indexer built on Adder that connects to Cardano Preprod, follows the chain, and applies a composed pipeline filter (event type + address/policy/pool), logging only matched events.

## Required Task

Starting from the Adder starter kit, build a small indexer that connects Adder to Cardano Preprod (network magic `1`) and uses Adder's pipeline filters to report only the events you care about. 

Composing an event-type filter with one of address, policy ID, or stake-pool filtering. This is the seed of the **DNS CLI's "watch" capability**: a daemon that surfaces only the on-chain events relevant to a name registry (e.g. transactions touching a registry address, or mints under a name-token policy). 

Connect either through your local **Dolos** Unix socket (`WithSocketPath`) or a **public preprod relay** over TCP (`WithAddress("preprod-node.world.dev.cardano.org:3001")`). Both speak Ouroboros N2N, which is all Adder needs.

## Additional Exploration

Instead of connecting to Cardano Preprod, connect to Cardano Preview. Build a Go indexer that tracks blocks minted with Dingo. (You will need to do some social and/or technical research to determine which Preview stake pools are running Dingo.)

## Deliverables

1. **Code** — public repo or gist with runnable Go using Adder (the starter-kit pattern). The README states which connection mode you used and shows your filter configuration.
2. **Runtime evidence** — captured terminal output showing (a) the ChainSync status update confirming a successful connection to preprod, and (b) at least one event passing your composed filter. Include the matched transaction hash or block issuer so it can be cross-checked on [Cardanoscan Preprod](https://preprod.cardanoscan.io/).
3. **Filter rationale** — a short note naming which filter types you composed and what real preprod activity you targeted (which address/policy/pool, and why it has activity).
4. **Course feedback (required):** Written feedback on Module 201's lessons covering:
   - **Quality** — what was clear, what was confusing, what was missing.
   - **Correctness** — any code that didn't run, commands that failed, or steps that were wrong/out of date (cite the lesson number, e.g. 201.3).

## Assessment Criteria

- **SLT 201.1** — pass when the submitted code follows the Adder starter-kit pattern and the captured output shows a successful ChainSync connection with events streaming.
- **SLT 201.2** — pass when the submission states the connection mode used and the config shows the correct preprod magic (`1`) with a valid socket path or relay address (N2N).
- **SLT 201.3** — pass when the pipeline composes a `filter_event` (type) with a `filter_chainsync`/`filter_cardano` filter on address, policy, **or** pool, and the output shows only matching events (other traffic dropped).
- **Course feedback** — pass when feedback is specific and lesson-referenced (not "it was good"); flags at least one correctness issue OR one concrete improvement.

## Notes

- Module 201 produces no transactions of your own — you're *observing*. Pick a target with real preprod activity: e.g. the Andamio access-token policy `29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78`, your own tokens from Module 102, or an active pool from Cardanoscan Preprod.
- Block-level **pool** filtering can take minutes between matches — be patient, or choose address/policy filtering for faster evidence.
- Adder **v0.36.0+** renames `filter/chainsync` to `filter/cardano` (identical API). Note your version from `go.mod`.
