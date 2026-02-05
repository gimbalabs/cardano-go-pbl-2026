# Filter Transactions by Address

Monitoring specific addresses is one of the most common requirements for blockchain applications. Whether you're building a wallet notification system, tracking treasury movements, or monitoring smart contract activity, filtering transactions by address lets you focus on exactly the on-chain activity that matters to your application.

In this lesson, you'll use Adder's built-in filter pipeline—a more powerful approach than the manual filtering you learned in Lesson 201.3.

## Pipeline Filters vs Manual Filtering

In Lesson 201.3, you filtered events manually inside the `handleEvent` function. Adder provides a cleaner approach: **pipeline filters**. These are modular components you add to your pipeline that filter events before they reach your handler.

| Approach | Pros | Cons |
|----------|------|------|
| Manual (201.3) | Simple, flexible, good for learning | All events reach your handler |
| Pipeline filters | Efficient, composable, production-ready | Requires understanding filter packages |

The starter kit includes a dedicated example: `./cmd/event-address-filter/main.go`

## Prerequisites

Before you begin, make sure you have:

* Completed Lesson 201.3 (filtering by event type)
* A running Demeter.run workspace with the Adder starter kit configured for **preprod**
* A Cardano wallet with at least 15 test ADA (use the [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnets/tools/faucet/) if needed)

**Important:** If you're starting a new workspace, remember to configure it for the preprod testnet (not preview). See Lesson 201.1 for detailed setup instructions.

## Overview of the Process

Here's what you'll do to filter transactions by address:

1. Open the `event-address-filter` example script
2. Understand the pipeline filter architecture
3. Configure your target address
4. Comment out the asset fingerprint filter
5. Run the filtered indexer
6. Send a test transaction and observe the filter in action

## Step-by-Step Instructions

### Step 1: Open the Event Address Filter Script

**What to do:**
In your Demeter workspace, navigate to `./cmd/event-address-filter/main.go`. This is a separate script from the `adder-publisher` you used in previous lessons.

**-- INSERT SCREENSHOT 1 HERE --**

**Why it matters:**
This script demonstrates Adder's recommended approach for filtering—using pipeline filter components rather than manual checks in your event handler.

**Expected result:**
You should see a `main.go` file with additional imports including `filter_chainsync` and `filter_event`.

---

### Step 2: Understand the Filter Imports

**What to do:**
Examine the import section at the top of the file. Notice the two filter packages:

```go
import (
    filter_chainsync "github.com/blinklabs-io/adder/filter/chainsync"
    filter_event "github.com/blinklabs-io/adder/filter/event"
    // ... other imports
)
```

**Why it matters:**
- `filter_event` - Filters by event type (block, transaction, rollback)
- `filter_chainsync` - Filters by Cardano-specific criteria (address, asset, pool ID)

These packages provide pre-built filter components you can add to your pipeline.

> **Note:** In a future version of the Adder library (v0.36.0+), the `filter/chainsync` package will be renamed to `filter/cardano`. The API remains the same—only the import path and type names change (e.g., `filter_chainsync` becomes `filter_cardano`, and `ChainSyncOptionFunc` becomes `CardanoOptionFunc`). Check the starter kit's `go.mod` file to see which Adder version you're using.

---

### Step 3: Examine the Event Type Filter

**What to do:**
Find where the event type filter is created and added to the pipeline:

```go
// Define type in event filter
filterEvent := filter_event.New(
    filter_event.WithTypes([]string{"chainsync.transaction"}),
)
// Add event filter to pipeline
p.AddFilter(filterEvent)
```

**-- INSERT SCREENSHOT 2 HERE --**

**Why it matters:**
This is equivalent to the manual `if evt.Type != "chainsync.transaction"` check from Lesson 201.3, but implemented as a pipeline component. Events that don't match are filtered out before reaching your handler.

---

### Step 4: Configure Your Address and Comment Out Asset Filter

**What to do:**
Find the chainsync filter section. You need to make two changes:

1. Replace the example mainnet address with your own preprod address
2. Comment out the `WithAssetFingerprints` section (we'll focus on address filtering only)

**Before:**
```go
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithAddresses(
        []string{
            "addr1q93l79hdpvaeqnnmdkshmr4mpjvxnacqxs967keht465tt2dn0z9uhgereqgjsw33ka6c8tu5um7hqsnf5fd50fge9gq4lu2ql",
        },
    ),
    filter_chainsync.WithAssetFingerprints(
        []string{"asset15f3ymkjafxxeunv5gtdl54g5qs8ty9k84tq94x"},
    ),
)
```

**After:**
```go
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithAddresses(
        []string{
            "addr_test1qz...", // Replace with your preprod address
        },
    ),
    // Comment out asset filter - we're focusing on address filtering only
    // filter_chainsync.WithAssetFingerprints(
    //     []string{"asset15f3ymkjafxxeunv5gtdl54g5qs8ty9k84tq94x"},
    // ),
)
```

**-- INSERT SCREENSHOT 3 HERE --**

**Why it matters:**
The original example filters by both address AND asset, meaning only transactions involving that specific token at that address would match. By commenting out the asset filter, you'll see all transactions involving your address regardless of which tokens are transferred.

**Expected result:**
Your code should have your preprod address (starting with `addr_test1`) and the asset fingerprint section commented out.

---

### Step 5: Update the Network Configuration

**What to do:**
The starter kit defaults to connecting to a remote mainnet node. Update the configuration to use your Demeter preprod node socket instead:

```go
inputOpts := []input_chainsync.ChainSyncOptionFunc{
    input_chainsync.WithAutoReconnect(true),
    input_chainsync.WithIntersectTip(true),
    input_chainsync.WithStatusUpdateFunc(updateStatus),
    input_chainsync.WithNetworkMagic(cfg.Magic),
    input_chainsync.WithSocketPath(cfg.SocketPath),
    // Comment out or remove the remote address line:
    // input_chainsync.WithAddress("52.15.49.197:3001"),
}
```

**-- INSERT SCREENSHOT 4 HERE --**

**Why it matters:**
Using the local socket path connects to your Demeter preprod node. The environment variables `CARDANO_NODE_SOCKET_PATH` and `CARDANO_NODE_MAGIC` are automatically configured in your workspace.

---

### Step 6: Run the Address Filter

**What to do:**
Run the event-address-filter script:

```bash
go run ./cmd/event-address-filter
```

**Why it matters:**
With the filters in place, your handler only receives transaction events involving your specified address. All other events are filtered out by the pipeline.

**Expected result:**
The indexer starts and waits silently. You should see a status update confirming the connection, but no transaction events yet.

---

### Step 7: Trigger a Transaction

**What to do:**
With the indexer running, open your Cardano wallet and send 10 test ADA to any other preprod address. You can use a friend's address, another wallet you control, or even the faucet return address.


**Why it matters:**
By sending ADA *from* your monitored address, you create a transaction that your filter will catch. This demonstrates that the address filter matches both incoming and outgoing transactions.

**Expected result:**
Within 20-40 seconds (once the transaction is included in a block), your indexer should log the transaction event. You'll see output showing your transaction was detected.

---

### Step 8: Verify the Filter Caught Your Transaction

**What to do:**
Check your terminal output. You should see your transaction logged by the `handleEvent` function.

**-- INSERT SCREENSHOT 5 HERE --**

**Understanding the output:**
The filtered transaction event shows your specific transaction data:

- **Type**: `chainsync.transaction` — confirms this passed through both filters (event type and address)
- **Context**: The block slot and hash where your transaction was included
- **Payload**: Your transaction details including:
  - Transaction hash — you can verify this matches your wallet's transaction history
  - Inputs — the UTxO(s) you spent from your address
  - Outputs — where the ADA went (recipient address and change back to you)
  - Fee — the transaction fee deducted

Because you filtered by your address, this is the *only* transaction that appeared—all other network activity was silently filtered out by the pipeline. This is the power of address filtering: in a busy network with thousands of transactions per block, you see only what's relevant to your application.

**Why it matters:**
This confirms your address filter is working correctly. The indexer ignored all other transactions on the network and only logged the one involving your address.

**Expected result:**
You should see event output containing your transaction hash and details about the ADA transfer.

---

## You'll Know You're Successful When:

* Your indexer only logs transactions involving your target address
* Your test transaction appears in the logs after being included in a block
* Other transactions on the network are silently filtered out

## Common Issues and Solutions

### Issue: No events appearing after sending transaction
**Why it happens:** The transaction hasn't been included in a block yet, or there's a typo in your address.
**How to fix it:** Wait for the next block (up to 20 seconds on preprod). Verify your address in the filter exactly matches your wallet address.

### Issue: "Magic mismatch" or connection errors
**Why it happens:** Network configuration doesn't match your node.
**How to fix it:** Ensure you're using `WithSocketPath` (not `WithAddress`) and that the network magic matches preprod (1).

### Issue: Still seeing all transactions
**Why it happens:** The filter wasn't added to the pipeline, or the asset filter is still active.
**How to fix it:** Verify `p.AddFilter(filterChainsync)` is called and that you commented out the `WithAssetFingerprints` section.

## Tips from Experience

💡 **Tip 1**: You can monitor multiple addresses by adding them to the slice: `[]string{"addr_test1...", "addr_test1..."}`

💡 **Tip 2**: Filters are composable—the event type filter runs first, then the address filter. Only events passing all filters reach your handler.

💡 **Tip 3**: For debugging, temporarily remove filters to confirm events are flowing, then add them back one at a time.

## Practice This Capability

1. **Practice Task 1**: Add a second address to the filter array (a friend's address or another wallet) and verify transactions to either address are logged
2. **Practice Task 2**: Send multiple small transactions and observe how each one is caught by the filter
3. **Practice Task 3**: Uncomment the asset fingerprint filter and experiment with filtering for specific tokens

## What You've Built

You now understand Adder's pipeline filter architecture and can filter blockchain transactions by address using `filter_chainsync.WithAddresses()`. This composable approach scales better than manual filtering and is the recommended pattern for production applications.

## Next Steps

* Learn to filter by policy ID for token tracking (Lesson 201.5)
* Explore filtering blocks by pool ID (Lesson 201.6)
* Consider building a multi-address monitoring system for a real project

---

*Generated with Andamio Lesson Coach*
