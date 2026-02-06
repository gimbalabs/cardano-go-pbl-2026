# Filter Blocks by Pool ID

Monitoring specific stake pools is essential for delegation dashboards, pool operator tools, and staking analytics. Filtering by pool ID lets you track when specific pools produce blocks—useful for monitoring pool performance, verifying block production, or building stake pool comparison tools.

In this lesson, you'll use Adder's `WithPoolIds` filter to track blocks produced by specific stake pools.

## What is a Pool ID?

Every stake pool on Cardano has a unique identifier that can be represented in two formats:

| Format | Example | Usage |
|--------|---------|-------|
| Hex | `0f292fcaa02b8b2f9b...` (56 chars) | Internal/technical use |
| Bech32 | `pool1pu5jlj4q9...` | Human-readable, used in wallets |

Adder's `WithPoolIds` filter accepts both formats—it automatically handles the conversion internally.

## Prerequisites

Before you begin, make sure you have:

* Completed Lesson 201.5 (filtering by policy ID)
* A running Demeter.run workspace with the Adder starter kit configured for **preprod**
* A pool ID to track (we'll help you find one)

**Important:** If you're starting a new workspace, remember to configure it for the preprod testnet (not preview). See Lesson 201.1 for detailed setup instructions.

## Overview of the Process

Here's what you'll do to filter blocks by pool ID:

1. Open the `event-address-filter` example script
2. Understand the `WithPoolIds` filter option
3. Configure the pool ID filter
4. Choose a pool ID to track
5. Run the filtered indexer and observe output

## Step-by-Step Instructions

### Step 1: Open the Event Address Filter Script

**What to do:**
In your Demeter workspace, open `./cmd/event-address-filter/main.go`. You'll modify this script to filter by pool ID.

**Why it matters:**
The same `filter_chainsync` package provides pool ID filtering alongside address and policy filters. The pattern is consistent across all filter types.

**Expected result:**
You should see the familiar filter setup from previous lessons.

---

### Step 2: Understand the WithPoolIds Filter

**What to do:**
Review the `WithPoolIds` option in the `filter_chainsync` package:

```go
filter_chainsync.WithPoolIds(
    []string{
        "pool1...", // bech32 format works
        // or hex format works too
    },
)
```

**Why it matters:**
- `WithAddresses` - Filters transactions by wallet/contract address
- `WithPolicies` - Filters transactions by token policy ID
- `WithPoolIds` - Filters **blocks** by the pool that produced them

Unlike address and policy filters which match transactions, pool ID filtering matches at the block level—you're tracking which pools are producing blocks.

> **Note:** In a future version of the Adder library (v0.36.0+), the `filter/chainsync` package will be renamed to `filter/cardano`. The API remains the same—only the import path and type names change. Check the starter kit's `go.mod` file to see which Adder version you're using.

---

### Step 3: Configure the Pool ID Filter

**What to do:**
Replace the existing filters with a pool ID filter. You'll also change the event type filter to capture block events:

**Update the event filter to capture blocks:**
```go
filterEvent := filter_event.New(
    filter_event.WithTypes([]string{"chainsync.block"}), // Changed from transaction
)
```

**Update the chainsync filter for pool ID:**
```go
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithPoolIds(
        []string{
            "pool1ynfnjspgckgxjf2zeye8s33jz3e3ndk9pcwp0qn8kq9dv4geus6", // Example preprod pool
        },
    ),
)
```

**-- INSERT SCREENSHOT 1 HERE --**

**Why it matters:**
By filtering for `chainsync.block` events and using `WithPoolIds`, you'll only see blocks produced by your target pool. All blocks from other pools are filtered out.

**Expected result:**
Your code should compile without errors. The filter is configured for pool-based block filtering.

**Check your understanding:** Before running, review the `inputOpts` configuration in the script. Is it set up to connect to your Demeter preprod node, or somewhere else? If you're unsure, revisit Lesson 201.4 Step 5.

---

### Step 4: Choose a Pool ID to Track

**What to do:**
You need a pool ID that actively produces blocks on preprod. The screenshot shows an example filtering for two pools (NORTH and SPIRE)—your task is to find a different pool to track.

Visit [Cardanoscan Preprod Pools](https://preprod.cardanoscan.io/pools) to see active stake pools. Click on any pool to find its pool ID. Choose one that has produced recent blocks.

**Why it matters:**
On preprod, not all registered pools actively produce blocks. Choosing an active pool ensures you'll see output during your testing session. Blocks are produced roughly every 20 seconds, but a single pool may only produce a block every few minutes depending on its stake.

**Expected result:**
You have a pool ID (hex or bech32 format) in your filter code, ready to run.

---

### Step 5: Run the Pool ID Filter

**What to do:**
Run the modified script:

```bash
go run ./cmd/event-address-filter
```

**Understanding the output:**
When a block produced by your target pool is detected, you'll see:

- **Type**: `chainsync.block` — confirms this is a block event (not transaction)
- **Context**: Chain position information
- **Payload**: Block data including:
  - Block hash
  - Slot number
  - Block number (height)
  - **Issuer pool ID** — matches your filter (may show in hex format)
  - Transaction count in this block
  - Block size

The key field is the issuer—this confirms the block was produced by your target pool.

**Why it matters:**
Running the filter demonstrates pool-level monitoring. This is essential for stake pool operators tracking their own performance, or for building delegation dashboards that show pool activity.

**Expected result:**
You should see block events logged when your target pool produces a block. This may take several minutes depending on the pool's stake and block production frequency. Be patient—unlike transaction filtering, blocks from a specific pool are less frequent.

---

## You'll Know You're Successful When:

* Your indexer only logs blocks produced by your target pool
* You can identify the pool ID in the block's issuer field
* Blocks from other pools are silently filtered out

## Common Issues and Solutions

### Issue: No blocks appearing after waiting several minutes
**Why it happens:** The pool may have low stake or may not be actively producing blocks on preprod.
**How to fix it:** Check the pool's recent block history on a block explorer. Choose a pool that has produced blocks in the last hour.

### Issue: Filter accepts pool ID but never matches
**Why it happens:** Format mismatch or typo in the pool ID.
**How to fix it:** Try both hex and bech32 formats. Adder handles both, but ensure no extra whitespace or characters.

### Issue: Seeing all blocks instead of filtered ones
**Why it happens:** The filter may not be added to the pipeline correctly.
**How to fix it:** Verify `p.AddFilter(filterChainsync)` is called after creating the filter.

## Tips from Experience

**Tip 1**: Pool ID filtering is useful for stake pool operators to monitor their own block production and verify they're being included in the chain.

**Tip 2**: You can filter for multiple pools by adding them to the slice: `[]string{"pool1...", "pool1..."}`—useful for comparing pool performance.

**Tip 3**: Combine pool ID filtering with time-based logic to build epoch performance reports for specific pools.

## Practice This Capability

1. **Practice Task 1**: Find 2-3 active pools on preprod and filter for all of them simultaneously
2. **Practice Task 2**: Count how many blocks each pool produces over a 10-minute period
3. **Practice Task 3**: Combine pool ID filtering with logging the transaction count per block to analyze pool throughput

## What You've Built

You now understand how to filter blockchain blocks by pool ID using `filter_chainsync.WithPoolIds()`. This enables you to build stake pool monitoring tools, delegation dashboards, and pool performance analytics.

## Next Steps

* Consider combining multiple filter types for complex monitoring scenarios
* Explore building a simple pool performance dashboard
* Review the Module 201 Assignment to demonstrate your filtering capabilities

---

*Generated with Andamio Lesson Coach*
