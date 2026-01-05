# Run the Adder Starter Kit

Building blockchain indexers is essential for contributing to Cardano development projects. The ability to run the adder starter kit on Demeter.run gives you hands-on experience with the adder library—a tool that enables you to observe blockchain events through the ChainSync protocol. This capability is fundamental for projects that need to track, analyze, or respond to on-chain activity.

## What is Adder?

Adder is a Go library that facilitates communication with Cardano nodes through the ChainSync protocol. It enables developers to observe all events that happen on the blockchain by establishing Node-to-Client connections. Think of it as your window into the blockchain—instead of querying a database after the fact, you're watching the chain in real-time as blocks are created.

The starter kit demonstrates how to build a simple indexer that connects to a Cardano node and processes blockchain events as they occur.

## Prerequisites

Before you begin, make sure you have:

* A Demeter.run account (sign up at https://demeter.run if you don't have one)
* Basic familiarity with Go programming language
* Understanding of what a Cardano node does
* Web browser to access the Demeter.run workspace

## Overview of the Process

Here's what you'll do to run the adder starter kit:

1. Access the starter kit workspace on Demeter.run
2. Verify your cloud environment is properly configured
3. Run the adder-publisher example
4. Observe the indexer processing blockchain events
5. Verify successful connection to the Cardano node

## Materials and Resources

* GitHub Repository: https://github.com/blinklabs-io/adder-library-starter-kit
* Demeter.run Platform: https://demeter.run
* Adder Library Documentation: Available in the repository README

## Step-by-Step Instructions

### Step 1: Access the Demeter.run Workspace

**What to do:**
Navigate to Demeter.run and create or access a workspace for the adder starter kit. The platform provides a cloud-based development environment with a preconfigured Cardano node already running and synced.

**Why it matters:**
Running a local Cardano node requires significant disk space and sync time. Demeter.run eliminates this barrier, letting you focus on building indexer capabilities rather than infrastructure setup. This mirrors how many production projects use managed infrastructure to accelerate development.

**Expected result:**
You should see a workspace interface with access to a terminal and file system. The workspace automatically provides two critical environment variables:
* `CARDANO_NODE_SOCKET_PATH` - Location of the node's Unix socket
* `CARDANO_NODE_MAGIC` - Network identifier for the connected node

---

### Step 2: Clone the Starter Kit Repository

**What to do:**
In your Demeter.run terminal, clone the adder library starter kit:
```bash
git clone https://github.com/blinklabs-io/adder-library-starter-kit.git
cd adder-library-starter-kit
```

**Why it matters:**
The starter kit contains a working example (`./cmd/adder-publisher/main.go`) that demonstrates the core pattern for building indexers. Understanding this example gives you a template you can adapt for project-specific indexing needs.

**Expected result:**
You should have the repository cloned with the following key files visible:
* `./cmd/adder-publisher/main.go` - The main example code
* `go.mod` - Go module dependencies
* `README.md` - Documentation

---

### Step 3: Run the Adder Publisher Example

**What to do:**
Execute the example indexer:
```bash
go run ./cmd/adder-publisher
```

**Why it matters:**
This command starts the indexer, which connects to the Cardano node via the Unix socket and begins processing blockchain events through ChainSync. Seeing this work demonstrates the fundamental capability every blockchain indexer needs: establishing and maintaining a connection to observe chain activity.

**Expected result:**
You should see console output showing:
* Connection established to the Cardano node
* Blocks being processed as they're produced
* Transaction events being logged
* Real-time blockchain activity streaming through your terminal

---

### Step 4: Observe Blockchain Events

**What to do:**
Watch the terminal output as the indexer processes blockchain events. Pay attention to:
* Block numbers incrementing
* Transaction data being displayed
* Event types being logged
* Connection status messages

**Why it matters:**
Understanding what data flows through an indexer is crucial for contributing to projects that need to react to on-chain events—whether it's tracking NFT mints, monitoring treasury movements, or indexing smart contract interactions.

**Expected result:**
Continuous stream of blockchain data in your terminal showing real-time chain activity. You're now observing the Cardano blockchain through the ChainSync protocol.

---

## You'll Know You're Successful When:

You've successfully run the adder starter kit when all of the following are true:

* The adder-publisher connects to the Cardano node without errors
* You see blockchain events streaming in your terminal in real-time
* Block numbers increment as new blocks are produced
* No connection errors or socket issues appear in the output
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
An organization wants real-time alerts when their treasury address receives or sends funds. You'd modify the indexer to watch specific addresses and trigger notifications.

**Adaptation needed:**
* Filter transactions involving treasury addresses
* Calculate balance changes
* Integrate with notification systems
* Track transaction confirmations

## Common Issues and Solutions

### Issue: "Cannot connect to socket" error
**Why it happens:** The `CARDANO_NODE_SOCKET_PATH` environment variable is not set or points to an invalid location.
**How to fix it:** On Demeter.run, this should be automatically configured. If you see this error, verify you're in a Demeter workspace (not running locally) or check that the workspace's Cardano node service is running.

### Issue: No blockchain events appearing
**Why it happens:** The node might still be syncing, or you're connected to a testnet with low activity.
**How to fix it:** Check the network you're connected to via `CARDANO_NODE_MAGIC`. Mainnet will show constant activity. Testnets may have sparse blocks.

### Issue: "Module not found" errors when running
**Why it happens:** Go dependencies haven't been downloaded yet.
**How to fix it:** Run `go mod download` before `go run ./cmd/adder-publisher` to fetch all dependencies.

## Tips from Experience

💡 **Tip 1**: Watch for a few blocks, then stop the indexer (Ctrl+C) to examine the output pattern. Understanding the data structure is crucial before building custom indexing logic.

💡 **Tip 2**: Demeter.run workspaces time out after inactivity. Keep your terminal active if you need the indexer running for extended periods.

💡 **Tip 3**: The starter kit is intentionally simple—it just prints events. Real projects add database storage, event filtering, and error recovery. View this as your foundation template.

## Practice This Capability

Now apply what you've learned:

1. **Practice Task 1**: Run the indexer, then identify which block events correspond to your own wallet transactions on a block explorer
2. **Practice Task 2**: Modify the code to only log blocks from a specific time range
3. **Practice Task 3**: Research what other events adder can observe beyond basic transactions (hint: check the library documentation)

## What You've Built

You now have the capability to run the adder starter kit on Demeter.run. This procedural knowledge is essential for contributing effectively to Cardano development projects that need blockchain indexing capabilities. You've demonstrated you can set up a development environment, connect to a Cardano node, and observe chain events in real-time—the foundation of any indexer.

## Next Steps

* Experiment with modifying the example code to filter specific events
* Review the Module Assignment to see how you'll demonstrate this capability in a project context
* Consider how indexing capabilities connect to other blockchain development skills in this Module
* Explore the adder library documentation to understand additional ChainSync features

---

*Generated with Andamio Lesson Coach*
