# Run the Adder Starter Kit

Building blockchain indexers is essential for contributing to Cardano development projects. Running the Adder starter kit gives you hands-on experience with the Adder library — a tool that enables you to observe blockchain events through the ChainSync protocol. This capability is fundamental for projects that need to track, analyze, or respond to on-chain activity.

## What is Adder?

Adder is a Go library that facilitates communication with Cardano nodes through the ChainSync protocol. It enables developers to observe all events that happen on the blockchain by establishing a connection to a node and following the chain in real-time. Think of it as your window into the blockchain — instead of querying a database after the fact, you're watching the chain as blocks are produced.

The starter kit demonstrates how to build a simple indexer that connects to a Cardano node and processes blockchain events as they occur.

## Prerequisites

Before you begin, make sure you have:

* A running Dolos instance configured for **preprod** (see the Dolos setup lesson)
* Go 1.21+ installed
* Git installed
* Basic familiarity with Go

## Overview of the Process

1. Clone the Adder starter kit repository
2. Find your Dolos connection values
3. Update the connection defaults in the code
4. Run the indexer
5. Confirm blockchain events are streaming

## Materials and Resources

* GitHub Repository: https://github.com/blinklabs-io/adder-library-starter-kit
* Adder Library Documentation: Available in the repository README

## Step-by-Step Instructions

### Step 1: Clone the Starter Kit

**What to do:**

```bash
git clone https://github.com/blinklabs-io/adder-library-starter-kit
cd adder-library-starter-kit
```

**Why it matters:**
The starter kit contains a working example (`./cmd/adder-publisher/main.go`) that demonstrates the core pattern for building indexers. Understanding this example gives you a template you can adapt for project-specific indexing needs.

**Expected result:**
You should see the following key files:
* `./cmd/adder-publisher/main.go` — the main example code
* `go.mod` — Go module dependencies
* `README.md` — documentation

---

### Step 2: Find Your Dolos Connection Values

**What to do:**
Open your `dolos.toml` and note two values:

**-- INSERT SCREENSHOT 1 HERE: dolos.toml showing [serve.ouroboros] and [upstream] sections --**

- Under `[serve.ouroboros]` → `listen_path` — the socket filename. The full path is your Dolos directory + this filename (e.g. `/home/yourname/code/dolos/dolos.socket`)
- Under `[upstream]` → `network_magic` — should be `1` for preprod

**Expected result:**
You have your full socket path and network magic noted and ready. You'll understand what these mean in Lesson 201.2.

---

### Step 3: Update the Connection Defaults

**What to do:**
Open `./cmd/adder-publisher/main.go` and find the `Config` struct initialisation near the top of `main()`:

```go
cfg := Config{
    Magic:      764824073,
    SocketPath: "/ipc/node.socket",
}
```

Update it with your Dolos values:

```go
cfg := Config{
    Magic:      1,
    SocketPath: "/home/yourname/code/dolos/dolos.socket",
}
```

Replace `/home/yourname/code/dolos/dolos.socket` with your actual socket path from Step 2.

**-- INSERT SCREENSHOT 2 HERE: main.go showing updated Config with socket path and magic 1 --**

**Why it matters:**
The defaults in the starter kit don't match your local setup. You're updating them to point at your Dolos instance on preprod.

**Expected result:**
Your `main.go` compiles without errors and the config reflects your local Dolos instance.

---

### Step 4: Run the Adder Publisher

**What to do:**

```bash
go run ./cmd/adder-publisher
```

**Why it matters:**
This starts the indexer, which connects to your Dolos instance via the Unix socket and begins processing blockchain events through ChainSync.

**Expected result:**
You should see console output showing:
* A ChainSync status update confirming the connection and current chain tip
* Blockchain events streaming — blocks and transactions appearing in real-time

---

### Step 5: Confirm the Indexer is Running

**What to do:**
Watch the terminal output for a few seconds to confirm the indexer is connected and processing events. You should see slot numbers incrementing as new blocks arrive (roughly every 20 seconds on preprod).

Press `Ctrl+C` to stop when satisfied.

**-- INSERT SCREENSHOT 3 HERE: terminal output showing ChainSync status update and events streaming --**

**Why it matters:**
Confirming the connection works verifies that your Dolos instance is correctly configured and that Adder can follow the chain. You're now observing the Cardano blockchain in real-time from your own infrastructure.

**Expected result:**
Continuous stream of blockchain events in your terminal showing real-time chain activity from the preprod testnet.

---

## You'll Know You're Successful When:

* The adder-publisher connects to your Dolos instance without errors
* You see blockchain events streaming in your terminal in real-time
* Block slots increment as new blocks are produced
* You can stop and restart the indexer and it reconnects successfully

## Real Project Examples

When contributing to Projects, you'll use this capability in scenarios like:

### Scenario 1: NFT Marketplace Indexer
A project needs to track all NFT minting and trading activity for a marketplace dashboard. You'd adapt the starter kit pattern to filter for specific policy IDs and transaction types.

**Adaptation needed:**
* Add filters for specific NFT policy IDs
* Parse metadata from minting transactions
* Store indexed data in a database
* Handle chain rollbacks correctly

### Scenario 2: Treasury Monitoring System
An organisation wants real-time alerts when their treasury address receives or sends funds. You'd modify the indexer to watch specific addresses and trigger notifications.

**Adaptation needed:**
* Filter transactions involving treasury addresses
* Calculate balance changes
* Integrate with notification systems
* Track transaction confirmations

## Common Issues and Solutions

### Issue: "no such file or directory" error on the socket path
**Why it happens:** The socket path is incorrect, or your Dolos instance isn't running.
**How to fix it:** Verify Dolos is running (`dolos daemon`) and that the socket path in your code matches the full path to `dolos.socket` in your Dolos directory.

### Issue: "network magic mismatch" error
**Why it happens:** The magic number in your code doesn't match the network your Dolos instance is following.
**How to fix it:** Check `[upstream] network_magic` in your `dolos.toml`. For preprod it should be `1`.

### Issue: No blockchain events appearing
**Why it happens:** Dolos may still be syncing to the chain tip, or preprod activity is low.
**How to fix it:** Check your Dolos terminal — if it's still logging rapid slot numbers it hasn't reached tip yet. Wait for it to catch up.

### Issue: "Module not found" errors when running
**Why it happens:** Go dependencies haven't been downloaded yet.
**How to fix it:** Run `go mod download` before `go run ./cmd/adder-publisher`.

## Tips from Experience

**Tip 1**: Watch for a few blocks, then stop the indexer (Ctrl+C) to examine the output pattern. Understanding the data structure is crucial before building custom indexing logic.

**Tip 2**: The starter kit is intentionally simple — it just prints events. Real projects add database storage, event filtering, and error recovery. View this as your foundation template.

**Tip 3**: Keep your Dolos terminal open in a separate window while developing. Seeing Dolos sync logs alongside your Adder output helps when debugging connection issues.

## Practice This Capability

1. **Practice Task 1**: Run the indexer, then identify which block events correspond to a transaction you can find on [Cardanoscan Preprod](https://preprod.cardanoscan.io/)
2. **Practice Task 2**: Stop and restart the indexer a few times — observe how it reconnects and picks up from the chain tip
3. **Practice Task 3**: Look at the structure of a transaction event in the output and identify the transaction hash, inputs, and outputs

## What You've Built

You now have the capability to run the Adder starter kit against your own local Dolos data node. You've demonstrated that you can clone the repository, configure it for your local infrastructure, and observe real-time Cardano blockchain events. This is the foundation of any indexer.

## Next Steps

* Experiment with modifying the example code to filter specific events
* Review the Module Assignment to see how you'll demonstrate this capability in a project context
* Explore the Adder library documentation to understand additional ChainSync features
