# Filter by Event Type

When building blockchain applications, you rarely need to process every piece of data flowing through the chain. Filtering by event type lets you focus your indexer on exactly the data you need—whether that's tracking new blocks, monitoring transactions, or handling chain rollbacks. This capability is fundamental for building efficient, purpose-built indexers.

## What are Event Types?

Adder produces three primary event types from blockchain monitoring:

| Event Type | Description | Use Case |
|------------|-------------|----------|
| `chainsync.block` | Emitted when a new block is added to the chain | Block explorers, epoch tracking, slot monitoring |
| `chainsync.transaction` | Emitted for each transaction in a block | Payment tracking, NFT monitoring, DEX activity |
| `chainsync.rollback` | Emitted when the blockchain rolls back | State recovery, data consistency, alerting |

## Prerequisites

Before you begin, make sure you have:

* Completed Lesson 201.1 (running the Adder Starter Kit)
* A running Demeter.run workspace with the Adder starter kit configured for **preprod**
* Basic understanding of Go syntax

**Important:** If you're starting a new workspace, remember to configure it for the preprod testnet (not preview). See Lesson 201.1 for detailed setup instructions, including adding a Cardano Node port and changing the NETWORK field from "preview" to "preprod".

## Overview of the Process

Here's what you'll do to filter by event type:

1. Locate the event handler function in the code
2. Add a condition to check the event type
3. Run the modified indexer
4. Observe filtered output in the terminal

## Step-by-Step Instructions

### Step 1: Open the Main File

**What to do:**
In your Demeter workspace, open `./cmd/adder-publisher/main.go` in the VS Code editor. Locate the `handleEvent` function—this is where all blockchain events are processed.

**-- INSERT SCREENSHOT 1 HERE --**

**Why it matters:**
The `handleEvent` function is the callback that receives every event from the blockchain. By modifying this function, you control what your indexer does with each event.

**Expected result:**
You should see a function that looks like this:

```go
func handleEvent(evt event.Event) error {
    slog.Info(fmt.Sprintf("%v", evt))
    return nil
}
```

---

### Step 2: Add Event Type Filtering

**What to do:**
Modify the `handleEvent` function to only process transaction events. Add a condition that checks the event type and returns early for events you don't want to process.

**-- INSERT SCREENSHOT 2 HERE --**

Replace the function with:

```go
func handleEvent(evt event.Event) error {
    // Only process transaction events
    if evt.Type != "chainsync.transaction" {
        return nil
    }

    slog.Info(fmt.Sprintf("Transaction: %v", evt))
    return nil
}
```

**Why it matters:**
This pattern—checking the event type and returning early—is the standard approach for filtering in event-driven systems. It keeps your processing logic clean and efficient.

**Expected result:**
Your code should compile without errors when saved.

---

### Step 3: Run the Filtered Indexer

**What to do:**
Open a terminal in your workspace and run the indexer:

```bash
go run ./cmd/adder-publisher
```

**-- INSERT SCREENSHOT 3 HERE --**

**Why it matters:**
Running the indexer with your filter lets you see only transaction events in the output, demonstrating that your filter is working correctly.

**Expected result:**
You should see only transaction events logged to the terminal. Block events will be silently ignored.

---

### Step 4: Experiment with Different Event Types

**What to do:**
Try filtering for block events instead. Change your filter condition:

```go
func handleEvent(evt event.Event) error {
    // Only process block events
    if evt.Type != "chainsync.block" {
        return nil
    }

    slog.Info(fmt.Sprintf("Block: %v", evt))
    return nil
}
```

Run the indexer again and observe the different output.

**-- INSERT SCREENSHOT 4 HERE --**

**Why it matters:**
Different event types contain different data structures. Block events show you slot numbers, block hashes, and issuer information. Understanding what each event type provides helps you choose the right filter for your application.

**Expected result:**
You should see block events appearing less frequently than transactions (roughly every 20 seconds on preprod), with different data in the output.

---

## You'll Know You're Successful When:

* Your indexer only logs events matching your filter condition
* Changing the filter type changes what appears in your terminal
* You can articulate why you'd filter for blocks vs transactions vs rollbacks

## Common Issues and Solutions

### Issue: No events appearing after adding filter
**Why it happens:** You may have a typo in the event type string.
**How to fix it:** Event types are case-sensitive. Use exactly: `chainsync.block`, `chainsync.transaction`, or `chainsync.rollback`.

### Issue: Rollback events never appear
**Why it happens:** Rollbacks are rare on stable networks.
**How to fix it:** This is expected behavior. Rollbacks occur during network instability or when stake pools produce competing blocks. On preprod, you may wait hours or days to see one naturally.

## Tips from Experience

💡 **Tip 1**: Start with transaction filtering—it's the most common use case and gives you the most data to work with.

💡 **Tip 2**: You can filter for multiple event types by using OR logic: `if evt.Type != "chainsync.transaction" && evt.Type != "chainsync.block"`.

💡 **Tip 3**: Consider logging the event type itself during development (`slog.Info(evt.Type)`) to see what's flowing through before adding filters.

## Practice This Capability

1. **Practice Task 1**: Create a filter that only logs block events, then count how many blocks are produced in one minute
2. **Practice Task 2**: Modify your filter to log both blocks AND transactions, but format them differently
3. **Practice Task 3**: Add a counter that tracks how many of each event type you've seen since starting the indexer

## What You've Built

You now have the capability to filter blockchain events by type. This is the foundation of targeted indexing—instead of processing everything, you can focus on exactly the data your application needs.

## Next Steps

* Learn to filter transactions by address (Lesson 201.4)
* Explore filtering by policy ID for token tracking (Lesson 201.5)
* Consider how event type filtering combines with other filters for precise data capture

---

*Generated with Andamio Lesson Coach*
