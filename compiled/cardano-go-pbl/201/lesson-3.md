# Filter Blockchain Events with Adder

When building blockchain applications, you rarely need to process every event on the chain. Adder provides a composable pipeline filter system that lets you focus on exactly the data your application needs — before it reaches your event handler.

In this lesson you'll learn all four filter types: event type, address, policy ID, and stake pool.

## Two Filtering Approaches

In Lesson 201.2 you saw events flow through `handleEvent` unfiltered. Adder gives you two ways to filter:

| Approach | How it works | When to use it |
|----------|-------------|----------------|
| **Manual (in handler)** | Check `evt.Type` and return early | Learning, simple one-off filters |
| **Pipeline filters** | Add filter components before the handler | Production code, composable filters |

This lesson covers both, starting with manual filtering for clarity and moving to pipeline filters for the address, policy, and pool cases.

## Prerequisites

* Completed Lesson 201.2 (Adder connected to your Dolos instance)
* Your Dolos instance running on preprod
* The Adder starter kit cloned and configured

---

## Part 1: Filter by Event Type

### What are Event Types?

Adder produces three primary event types:

| Event Type | Description |
|------------|-------------|
| `chainsync.block` | A new block added to the chain |
| `chainsync.transaction` | A transaction within a block |
| `chainsync.rollback` | The chain rolling back |

### How to Filter

Open `./cmd/adder-publisher/main.go` and modify `handleEvent`:

```go
func handleEvent(evt event.Event) error {
    if evt.Type != "chainsync.transaction" {
        return nil
    }
    slog.Info(fmt.Sprintf("Transaction: %v", evt))
    return nil
}
```

Returning `nil` early for unwanted types is the standard pattern for event-driven filtering.

**To filter for blocks instead**, change the condition to `evt.Type != "chainsync.block"`. Block events contain slot number, block hash, issuer pool ID, and transaction count. They appear less frequently (~every 20 seconds on preprod).

### Optional: Quieter Output

To suppress the ChainSync status messages and see only your filtered events, comment out `WithStatusUpdateFunc` in `inputOpts`:

```go
// input_chainsync.WithStatusUpdateFunc(updateStatus),
```

---

## Part 2: Filter by Address

Address filtering uses Adder's pipeline filter system — a more powerful approach than manual checks.

### The Filter Packages

```go
import (
    filter_chainsync "github.com/blinklabs-io/adder/filter/chainsync"
    filter_event "github.com/blinklabs-io/adder/filter/event"
)
```

- `filter_event` — filters by event type (block, transaction, rollback)
- `filter_chainsync` — filters by Cardano-specific criteria (address, policy, pool)

> **Note:** In Adder v0.36.0+, `filter/chainsync` is renamed to `filter/cardano`. The API is identical — only the import path and type names change. Check `go.mod` to see which version you have.

### The Example Script

Open `./cmd/event-address-filter/main.go`. This script demonstrates pipeline filters:

```go
// Event type filter — only transactions
filterEvent := filter_event.New(
    filter_event.WithTypes([]string{"chainsync.transaction"}),
)
p.AddFilter(filterEvent)

// Address filter
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithAddresses(
        []string{
            "addr_test1qz...", // your preprod address
        },
    ),
)
p.AddFilter(filterChainsync)
```

**Make sure to update the Config** at the top of `main()` with your Dolos socket path and magic `1`, the same as in Lesson 201.1.

**-- INSERT SCREENSHOT 1 HERE: event-address-filter/main.go showing updated Config and filters --**

### Running It

```bash
go run ./cmd/event-address-filter
```

The indexer starts silently. Once you send a transaction from your monitored address, it will appear in the terminal within ~20 seconds (next block). All other network transactions are silently dropped by the pipeline.

**-- INSERT SCREENSHOT 2 HERE: terminal output showing a filtered transaction event --**

### Composing Filters

You can monitor multiple addresses by adding them to the slice:

```go
filter_chainsync.WithAddresses([]string{"addr_test1q...", "addr_test1q..."})
```

Filters are composable — both the event type filter and the address filter must pass before an event reaches your handler.

---

## Part 3: Filter by Policy ID

Policy ID filtering catches all transactions that mint, burn, or transfer any asset under a given policy.

### What is a Policy ID?

Every native asset on Cardano is identified by a **Policy ID** (56-character hex string) and an optional **Asset Name**. Filtering by policy ID catches the entire token family — every asset minted under that policy.

### How to Filter

In `./cmd/event-address-filter/main.go`, replace the address filter with a policy filter:

```go
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithPolicies(
        []string{
            "29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78", // Andamio access token
        },
    ),
)
```

**-- INSERT SCREENSHOT 3 HERE: main.go showing WithPolicies filter --**

### Choosing a Policy ID

You need a policy with active transactions on preprod. Options:
- **Andamio access token** (shown above) — has regular activity on preprod
- Your own tokens from Module 102
- Any policy with recent activity on [Cardanoscan Preprod](https://preprod.cardanoscan.io/)

In the output, look for your policy ID in the `mint` field (if tokens are being minted/burned) or in the multi-asset values of transaction outputs.

---

## Part 4: Filter by Stake Pool

Pool ID filtering operates at the block level — you're tracking which pools produce blocks, not which transactions those blocks contain.

### How to Filter

You need to change both filters: event type to `chainsync.block`, and the chainsync filter to `WithPoolIds`:

```go
filterEvent := filter_event.New(
    filter_event.WithTypes([]string{"chainsync.block"}),
)

filterChainsync := filter_chainsync.New(
    filter_chainsync.WithPoolIds(
        []string{
            "pool1ynfnjspgckgxjf2zeye8s33jz3e3ndk9pcwp0qn8kq9dv4geus6",
        },
    ),
)
```

Adder accepts pool IDs in both **bech32** (`pool1...`) and **hex** (56-char) formats.

**-- INSERT SCREENSHOT 4 HERE: main.go showing block event filter with WithPoolIds --**

### Choosing a Pool to Track

Visit [Cardanoscan Preprod Pools](https://preprod.cardanoscan.io/pools) and pick an active pool. The key field in the block output is the **issuer** — this will match your filter.

Blocks from a specific pool arrive infrequently — a pool may produce one every few minutes depending on its stake. Be patient.

---

## You'll Know You're Successful When:

* **Event type filtering**: Only the event type you selected appears in your terminal
* **Address filtering**: Your test transaction appears after being included in a block; all other transactions are silently dropped
* **Policy filtering**: Transactions involving your policy ID are detected; you can identify the policy in the output
* **Pool filtering**: Block events appear only for your target pool's blocks

## Common Issues

**No events after adding filter** — Check for typos in event type strings (`chainsync.transaction`, `chainsync.block`, `chainsync.rollback` are case-sensitive). For address/policy filters, verify the value exactly matches what's on-chain.

**Magic mismatch / connection errors** — Confirm your `Config` in `event-address-filter/main.go` has the correct socket path and magic `1` for preprod.

**Still seeing all events** — Verify `p.AddFilter(filterChainsync)` is called in the pipeline setup.

**No pool blocks after several minutes** — The pool may be inactive on preprod. Check its recent block history on a block explorer and try a different pool.

## Tips

**Tip 1**: Filters are composable — add both a `filter_event` and a `filter_chainsync` to a pipeline and only events passing both will reach your handler.

**Tip 2**: For debugging, temporarily remove all filters to confirm events are flowing through, then add filters back one at a time.

**Tip 3**: To combine address and policy filtering (e.g., track a specific token at a specific address), use `WithAddresses` and `WithPolicies` together in the same `filter_chainsync.New(...)` call.

## Next Steps

* Module 202 — querying the blockchain for historical and global data
* Consider what filtering logic your project needs and sketch out which filter types you'd combine
