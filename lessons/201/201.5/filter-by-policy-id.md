# Filter Transactions by Policy ID

Tracking specific tokens on Cardano requires filtering by policy ID—the unique identifier that defines a token's minting policy. Whether you're building a token dashboard, monitoring NFT collections, or tracking DeFi protocol activity, filtering by policy ID lets you focus on exactly the tokens that matter to your application.

In this lesson, you'll extend your knowledge of Adder's pipeline filters to track transactions involving specific native assets.

## What is a Policy ID?

Every native asset on Cardano is identified by two components:
- **Policy ID** - A 56-character hex string derived from the minting policy script
- **Asset Name** - An optional name within that policy (can be empty for fungible tokens)

| Token Type | Policy ID | Asset Name |
|------------|-----------|------------|
| Fungible token (e.g., DJED) | Same for all tokens | Specific token name |
| NFT collection | Same for entire collection | Unique per NFT |
| Single NFT | Unique to that NFT | Often empty or metadata reference |

Filtering by policy ID catches all transactions involving any asset under that policy—useful for tracking entire NFT collections or all tokens from a specific protocol.

## Prerequisites

Before you begin, make sure you have:

* Completed Lesson 201.4 (filtering by address)
* A running Demeter.run workspace with the Adder starter kit configured for **preprod**
* A policy ID to track (we'll provide a sample, or use one from your own tokens)

**Important:** If you're starting a new workspace, remember to configure it for the preprod testnet (not preview). See Lesson 201.1 for detailed setup instructions.

## Overview of the Process

Here's what you'll do to filter transactions by policy ID:

1. Open the `event-address-filter` example script
2. Understand the `WithPolicies` filter option
3. Configure the policy ID filter
4. Choose a policy ID to track
5. Run the filtered indexer and observe output

## Step-by-Step Instructions

### Step 1: Open the Event Address Filter Script

**What to do:**
In your Demeter workspace, open `./cmd/event-address-filter/main.go`. You'll modify this script to filter by policy ID instead of address.


**Why it matters:**
The same `filter_chainsync` package that provides address filtering also provides policy ID filtering. You're building on what you learned in 201.4.

**Expected result:**
You should see the familiar filter setup with `filter_chainsync.WithAddresses()` and `filter_chainsync.WithAssetFingerprints()`.

---

### Step 2: Understand the WithPolicies Filter

**What to do:**
Review the available filter options in the `filter_chainsync` package. In addition to `WithAddresses` and `WithAssetFingerprints`, you can use:

```go
filter_chainsync.WithPolicies(
    []string{
        "policy_id_hex_here",
    },
)
```

**Why it matters:**
- `WithAddresses` - Filters by wallet/contract address
- `WithAssetFingerprints` - Filters by specific asset (policy + name combined)
- `WithPolicies` - Filters by policy ID (catches ALL assets under that policy)

Using `WithPolicies` is ideal when you want to track an entire token family or NFT collection rather than individual assets.

> **Note:** In a future version of the Adder library (v0.36.0+), the `filter/chainsync` package will be renamed to `filter/cardano`. The API remains the same—only the import path and type names change (e.g., `filter_chainsync` becomes `filter_cardano`, and `ChainSyncOptionFunc` becomes `CardanoOptionFunc`). Check the starter kit's `go.mod` file to see which Adder version you're using.

---

### Step 3: Configure the Policy ID Filter

**What to do:**
Replace the address and asset fingerprint filters with a policy ID filter. Modify the `filterChainsync` section:

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
    filter_chainsync.WithPolicies(
        []string{
            "29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78", // Andamio access token
        },
    ),
)
```

**-- INSERT SCREENSHOT 1 HERE --**

**Why it matters:**
By switching to `WithPolicies`, your filter will match any transaction that mints, burns, or transfers tokens under the specified policy ID. This is broader than filtering by asset fingerprint (which matches only one specific asset).

**Expected result:**
Your code should compile without errors. The filter is now configured for policy-based filtering.

---

### Step 4: Choose a Policy ID to Track

**What to do:**
You need a policy ID that has active transactions on preprod. Options:

**Option A: Use the Andamio access token (recommended)**
The Andamio platform runs on preprod with regular testing activity. Use the Andamio access token policy ID:
```
29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78
```

**Option B: Use your own minted tokens**
If you've minted tokens on preprod (from earlier Cardano Go lessons or other projects), use that policy ID.

**Option C: Find an active token on a block explorer**
Search [Cardanoscan Preprod](https://preprod.cardanoscan.io/) for tokens with recent activity and copy their policy ID.

**Why it matters:**
Using a policy ID with active transactions ensures you'll see output relatively quickly. Inactive policies may produce no events during your testing window.

**Expected result:**
You have a 56-character hex string policy ID in your filter code, ready to run.

---

### Step 5: Run the Policy ID Filter

**What to do:**
Run the modified script:

```bash
go run ./cmd/event-address-filter
```

**Understanding the output:**
When a transaction involving your policy ID is detected, you'll see:

- **Type**: `chainsync.transaction` — confirms this is a transaction event
- **Context**: Block slot and hash where the transaction was included
- **Payload**: Transaction data including:
  - Transaction hash
  - Inputs and outputs
  - **Mint field** — if tokens were minted or burned, shows the policy ID and quantities
  - **Output values** — shows native assets being transferred, including policy ID and asset names

Look for your policy ID in the mint field or in the multi-asset values of transaction outputs. The policy ID appears as the first part of the asset identifier.

**Why it matters:**
Running the filter demonstrates that you can track all activity for a token family. This is essential for building token dashboards, NFT marketplaces, or protocol monitoring systems.

**Expected result:**
You should see transactions logged whenever tokens under your policy ID are minted, burned, or transferred. If the policy has low activity, you may need to wait or choose a more active policy.

---

## You'll Know You're Successful When:

* Your indexer only logs transactions involving your target policy ID
* You can identify your policy ID in the transaction output (mint field or asset values)
* Other transactions on the network are silently filtered out

## Common Issues and Solutions

### Issue: No events appearing
**Why it happens:** The policy ID may have no recent activity on preprod.
**How to fix it:** Try a different policy ID with known recent activity. Check a block explorer to verify the policy has transactions.

### Issue: Filter not matching expected transactions
**Why it happens:** Policy ID may have a typo, or you're filtering the wrong network.
**How to fix it:** Double-check the 56-character hex string. Verify your workspace is configured for preprod (not preview or mainnet).

### Issue: Too many transactions appearing
**Why it happens:** The policy ID may be very active (e.g., a popular token).
**How to fix it:** This is actually success! Consider adding additional filters (address or asset fingerprint) to narrow results.

## Tips from Experience

**Tip 1**: Combine `WithPolicies` with `WithAddresses` to track a specific token at specific addresses—useful for monitoring treasury wallets holding particular assets.

**Tip 2**: You can filter for multiple policy IDs by adding them to the slice: `[]string{"policy1...", "policy2..."}`

**Tip 3**: For NFT collections, filtering by policy ID captures all mints, sales, and transfers across the entire collection with a single filter.

## Practice This Capability

1. **Practice Task 1**: Find an NFT collection on preprod and track all its transactions by policy ID
2. **Practice Task 2**: Combine policy ID filtering with address filtering to track a specific wallet's activity with a specific token
3. **Practice Task 3**: Filter for multiple policy IDs simultaneously and observe how transactions are logged

## What You've Built

You now understand how to filter blockchain transactions by policy ID using `filter_chainsync.WithPolicies()`. This enables you to build token-aware applications that track minting, burning, and transfers for entire token families or NFT collections.

## Next Steps

* Learn to filter blocks by pool ID for staking-related monitoring (Lesson 201.6)
* Consider combining multiple filter types for precise event capture
* Explore building a simple token dashboard using policy ID filtering

---

*Generated with Andamio Lesson Coach*
