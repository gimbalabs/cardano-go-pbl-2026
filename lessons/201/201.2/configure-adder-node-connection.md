# Configure Adder to Connect to a Cardano Node

Understanding how Adder connects to a node is essential for building real-world indexers. In the previous lesson the connection "just worked" because you configured it directly. This lesson explains what's actually happening under the hood, and how to adapt that connection for different environments.

## What Protocol Does Adder Use?

Adder connects to Cardano nodes through the **Ouroboros Node-to-Node (N2N) protocol**. It's important to be precise here because there are two distinct Ouroboros protocol families:

| Protocol | Transport | Who uses it |
|----------|-----------|-------------|
| **Node-to-Node (N2N)** | TCP or Unix socket | Relay nodes, Adder, gOuroboros |
| **Node-to-Client (N2C)** | Unix socket, local only | Wallet software, local tooling |

Adder uses **N2N** — the same protocol Cardano relay nodes use to communicate with each other. This is why Adder can connect to public relay nodes over TCP, and why your Dolos instance exposes an Ouroboros socket that Adder can reach: Dolos speaks N2N on that socket.

## What Dolos Is Doing

When Adder connects to your Dolos instance, here's what's happening:

```
Cardano Network (preprod relays)
        ↓  N2N over TCP
   [ Dolos ]  ←  syncing the chain continuously
        ↓  N2N via Unix socket
   [ Adder ]  ←  your indexer, following the chain
```

Dolos connects outward to the Cardano network and keeps a local copy of the chain. Adder connects inward to Dolos via the Unix socket and follows that chain. Your code never needs to talk to the wider network directly.

## The Three Connection Values

Adder needs three pieces of information to establish a connection:

| Value | What it is | Your Dolos value |
|-------|-----------|-----------------|
| **Socket path** | Where to find the Ouroboros socket | Full path to `dolos.socket` in your Dolos directory |
| **Network magic** | Which Cardano network | `1` (preprod) |
| **Protocol version** | Which Ouroboros version to negotiate | Handled automatically by the library |

## Prerequisites

Before you begin, make sure you have:

* Completed Lesson 201.1 (running the Adder Starter Kit)
* Your Dolos instance running
* Basic understanding of Go and environment variables

## Overview of the Process

1. Understand how the current connection is configured
2. Understand what the socket path represents
3. Learn the TCP alternative for connecting to remote nodes
4. Verify your connection values

## Step-by-Step Instructions

### Step 1: Understand the Current Configuration

**What to do:**
Open `./cmd/adder-publisher/main.go` and locate the `Config` struct and the `inputOpts` slice in `main()`:

```go
type Config struct {
    SocketPath string `split_words:"true"`
    Magic      uint32
}

func main() {
    cfg := Config{
        Magic:      1,
        SocketPath: "/home/yourname/code/dolos/dolos.socket",
    }
    // ...
    inputOpts := []input_chainsync.ChainSyncOptionFunc{
        input_chainsync.WithAutoReconnect(true),
        input_chainsync.WithIntersectTip(true),
        input_chainsync.WithStatusUpdateFunc(updateStatus),
        input_chainsync.WithNetworkMagic(cfg.Magic),
        input_chainsync.WithSocketPath(cfg.SocketPath),
    }
}
```

**Why it matters:**
`WithSocketPath` tells Adder to connect via a Unix socket. `WithNetworkMagic` tells it which Cardano network to expect. These two values are all that change between environments.

**Expected result:**
You can locate both values in the code and trace them back to your `dolos.toml`.

---

### Step 2: Understand the Socket Path

**What to do:**
Open your `dolos.toml` and find:

```toml
[serve.ouroboros]
listen_path = "dolos.socket"
```

This is where Dolos listens for Ouroboros connections. When you run `dolos daemon`, it creates a socket file at this path relative to your Dolos directory.

Verify the socket file exists:
```bash
ls /path/to/your/dolos/directory/dolos.socket
```

**Why it matters:**
The socket file only exists while `dolos daemon` is running. If Dolos stops, the socket disappears and Adder will fail to connect. This is expected behaviour — the `WithAutoReconnect(true)` option in Adder handles reconnection automatically when Dolos comes back up.

**Expected result:**
The socket file is present and your code's `SocketPath` matches its full path.

---

### Step 3: The TCP Alternative

**What to do:**
Look at this commented line in the starter kit's `inputOpts`:

```go
// input_chainsync.WithAddress("52.15.49.197:3001"),
```

This is the alternative to `WithSocketPath`. Instead of connecting to a local socket, you can point Adder directly at any Cardano relay node over TCP — no Dolos required.

Public preprod relay:
```
preprod-node.world.dev.cardano.org:3001
```

To use it, comment out `WithSocketPath` and uncomment `WithAddress`:

```go
inputOpts := []input_chainsync.ChainSyncOptionFunc{
    input_chainsync.WithAutoReconnect(true),
    input_chainsync.WithIntersectTip(true),
    input_chainsync.WithNetworkMagic(cfg.Magic),
    // input_chainsync.WithSocketPath(cfg.SocketPath),
    input_chainsync.WithAddress("preprod-node.world.dev.cardano.org:3001"),
}
```

**Why it matters:**
Adder is protocol-level flexible — it doesn't care whether it reaches the Ouroboros N2N protocol via a local socket or a remote TCP connection. Understanding this distinction matters when deploying indexers in different environments: local development via Dolos socket, production via a dedicated relay or hosted node.

**Expected result:**
You understand both connection modes and when you'd use each.

---

### Step 4: Verify Your Connection

**What to do:**
Ensure your `main.go` is configured with the socket path option pointing at your Dolos instance, then run:

```bash
go run ./cmd/adder-publisher
```

Confirm you see a ChainSync status update followed by events streaming.

**Expected result:**
```
INFO ChainSync status update: {<block_hash> <block_hash> <slot> 0 <height> <slot> false}
INFO Received event: {...chainsync.block...}
```

---

## You'll Know You're Successful When:

* You can explain the difference between N2N and N2C
* You can trace the socket path from `dolos.toml` to the code
* You understand when you'd use `WithSocketPath` vs `WithAddress`
* Adder connects and streams events consistently

## Common Issues and Solutions

### Issue: "no such file or directory" on the socket path
**Why it happens:** Dolos isn't running, or the path in your code doesn't match where Dolos created the socket.
**How to fix it:** Start Dolos with `dolos daemon` and verify the socket path matches the full path to `dolos.socket` in your Dolos directory.

### Issue: "network magic mismatch"
**Why it happens:** The magic number doesn't match the network your Dolos instance is following.
**How to fix it:** Check `[upstream] network_magic` in `dolos.toml`. For preprod it should be `1`.

### Issue: TCP connection times out
**Why it happens:** Firewall blocking the port, or incorrect relay address.
**How to fix it:** Verify the relay address and that port 3001 is accessible from your machine.

## Tips from Experience

**Tip 1**: Keep Dolos running in a separate terminal while developing. The `WithAutoReconnect(true)` option means Adder will reconnect automatically if Dolos restarts, but you need Dolos up first.

**Tip 2**: The socket approach is faster than TCP for local development — no network overhead. Use it while building and testing, switch to TCP or a hosted node for production deployments.

**Tip 3**: The network magic is your safeguard against accidentally running against the wrong network. If you ever see unexpected transactions, check your magic number first.

## Practice This Capability

1. **Practice Task 1**: Switch from `WithSocketPath` to `WithAddress` using the public preprod relay, run the indexer, and confirm you see the same events
2. **Practice Task 2**: Stop your Dolos instance, observe what happens to Adder, then restart Dolos and observe the auto-reconnect
3. **Practice Task 3**: Create a `.env.example` file documenting the connection values your indexer needs, with comments explaining what each one does

## What You've Built

You now understand how Adder connects to a Cardano node, the difference between N2N and N2C protocols, and how to switch between local socket and remote TCP connections. This makes you infrastructure-independent — your indexer code works in any deployment environment by changing two values.

## Next Steps

* Learn to filter blockchain events by type (Lesson 201.3)
* Consider how connection configuration relates to production deployment patterns
* Explore the Adder library documentation to understand additional connection options
