# Configure Adder to Connect to a Cardano Node

Understanding how to configure Adder to connect to any Cardano node—whether local or remote—is essential for contributing to blockchain development projects. While Demeter.run provides pre-configured nodes for learning, production projects often require connecting to self-hosted infrastructure or remote node services. The ability to configure these connections gives you the flexibility to work in any development environment.

## What is Node Configuration in Adder?

When you ran the adder starter kit on Demeter.run, the connection to the Cardano node "just worked" because Demeter automatically set the required environment variables. But understanding what's happening under the hood is crucial for real-world development.

Adder connects to Cardano nodes through the **Ouroboros Node-to-Client protocol**, which can work in two ways:
* **Unix socket connection** - For local nodes running on the same machine (typical for development)
* **TCP connection** - For remote nodes accessible over a network (typical for production)

The Adder library needs three key pieces of information to establish a connection:
1. **Connection path** - Where the node is (socket path or TCP address)
2. **Network magic** - Which Cardano network (mainnet, preprod, preview, etc.)
3. **Protocol version** - Which version of the Ouroboros protocol to use

## Prerequisites

Before you begin, make sure you have:

* The adder-library-starter-kit repository (from the previous lesson)
* Either:
  - A locally running Cardano node, OR
  - Access credentials for a remote Cardano node service
* Basic understanding of environment variables
* Familiarity with the Go programming language

## Overview of the Process

Here's what you'll do to configure Adder for a custom node connection:

1. Understand the current Demeter configuration
2. Identify your target node connection details
3. Modify the connection configuration in the code
4. Set the required environment variables
5. Test the connection
6. Verify blockchain data is streaming

## Materials and Resources

* Adder Library Documentation: https://github.com/blinklabs-io/adder
* Cardano Node Documentation: https://developers.cardano.org/docs/get-started/running-cardano/
* Network Magic Numbers Reference:
  - Mainnet: `764824073`
  - Preprod: `1`
  - Preview: `2`

## Step-by-Step Instructions

### Step 1: Understand the Current Configuration

**What to do:**
Open `./cmd/adder-publisher/main.go` in your editor and locate the node connection configuration. Look for where the connection is established—typically in the `main()` function.

You'll see code that reads environment variables like:
```go
socketPath := os.Getenv("CARDANO_NODE_SOCKET_PATH")
networkMagic := os.Getenv("CARDANO_NODE_MAGIC")
```

**Why it matters:**
Understanding how Demeter's automatic configuration works gives you insight into what you need to replicate in other environments. The environment variables act as the "adapter" between your code and the node infrastructure.

**Expected result:**
You should identify where in the code the connection parameters are being read and how they're passed to the Adder library's connection functions.

---

### Step 2: Determine Your Node Connection Details

**What to do:**
Decide which node you'll connect to and gather the necessary information:

**Option A: Local Node (Unix Socket)**
If you're running a Cardano node locally:
1. Locate your node's socket path (commonly `/opt/cardano/cnode/sockets/node.socket` or similar)
2. Confirm which network your node is synced to (preprod, preview, or mainnet)
3. Note the corresponding network magic number

**Option B: Remote Node (TCP)**
If you're using a remote node service:
1. Obtain the TCP address (host and port, e.g., `cardano-node.example.com:3001`)
2. Confirm the network (preprod, preview, or mainnet)
3. Note any authentication requirements

**Why it matters:**
Different deployment scenarios require different connection methods. Local development typically uses Unix sockets for speed and simplicity, while production deployments often use TCP connections to separate indexer infrastructure from node infrastructure.

**Expected result:**
You have documented:
* Connection path (socket path or TCP address)
* Network name and magic number
* Any authentication credentials needed

---

### Step 3: Configure Environment Variables

**What to do:**
Set the environment variables that Adder will use to connect to your node.

**For Unix Socket Connection:**
```bash
export CARDANO_NODE_SOCKET_PATH="/path/to/your/node.socket"
export CARDANO_NODE_MAGIC="1"  # 1 for preprod
```

**For TCP Connection:**
You'll need to modify the code to accept a TCP address instead of a socket path. In `main.go`, look for the connection setup and adapt it to use TCP:

```go
// Instead of socket path, use TCP address
nodeAddress := os.Getenv("CARDANO_NODE_ADDRESS")  // e.g., "localhost:3001"
networkMagic := os.Getenv("CARDANO_NODE_MAGIC")
```

**Why it matters:**
Environment variables keep configuration separate from code, following the [12-factor app](https://12factor.net/) methodology. This allows the same code to work in development, staging, and production by simply changing environment variables.

**Expected result:**
Your terminal session has the required environment variables set, and you can verify them:
```bash
echo $CARDANO_NODE_SOCKET_PATH  # or $CARDANO_NODE_ADDRESS
echo $CARDANO_NODE_MAGIC
```

---

### Step 4: Modify Connection Code (If Using TCP)

**What to do:**
If connecting via TCP instead of Unix socket, you'll need to update the Adder connection setup in `main.go`.

Look for code similar to:
```go
connection, err := ouroboros.NewConnection(
    ouroboros.ConnectionConfig{
        Address: socketPath,
    },
)
```

Modify it to:
```go
connection, err := ouroboros.NewConnection(
    ouroboros.ConnectionConfig{
        Network: "tcp",
        Address: nodeAddress,
    },
)
```

**Why it matters:**
The Adder library (via the Ouroboros library) supports multiple connection types. Unix sockets are the default, but production deployments often need TCP for flexibility in infrastructure design.

**Expected result:**
Your `main.go` file is updated to use the appropriate connection method for your node setup.

---

### Step 5: Test the Connection

**What to do:**
Run the modified adder-publisher to test your connection:

```bash
go run ./cmd/adder-publisher
```

Watch for connection success messages or errors in the output.

**Why it matters:**
Testing confirms that all configuration is correct: the node is reachable, the network magic matches, and your code has the necessary permissions to connect.

**Expected result:**
You should see output similar to what you saw on Demeter:
* "Connected to Cardano node" or similar success message
* Chain sync beginning
* Block data starting to stream

Common initial errors and what they mean:
* "No such file or directory" - Socket path is incorrect
* "Connection refused" - Node isn't running or TCP address is wrong
* "Network magic mismatch" - Your magic number doesn't match the node's network

---

### Step 6: Verify Blockchain Data Streaming

**What to do:**
Let the indexer run for a minute and observe:
* Block numbers incrementing
* Transaction data appearing
* No connection errors or timeouts

Press `Ctrl+C` to stop when satisfied.

**Why it matters:**
Sustained data flow confirms not just that you can connect, but that the connection is stable and the node is fully synced. A node that's still syncing may have intermittent performance.

**Expected result:**
Continuous stream of blockchain events without interruption, confirming your Adder configuration is production-ready.

---

## You'll Know You're Successful When:

You've successfully configured Adder to connect to a Cardano node when:

* The adder-publisher connects without socket path or connection errors
* You see blockchain events streaming from your configured node
* Block numbers increment showing real-time chain activity
* You can stop and restart the indexer, and it reconnects successfully
* The connection works consistently over several minutes without timeouts

## Real Project Examples

When contributing to Projects, you'll use this capability in scenarios like:

### Scenario 1: Development to Production Pipeline
A project runs indexers against preprod during development but needs mainnet connections in production. You'd maintain the same codebase but change environment variables between environments.

**Configuration needed:**
* Development: `CARDANO_NODE_MAGIC=1` (preprod socket)
* Production: `CARDANO_NODE_MAGIC=764824073` (mainnet TCP)
* Same code, different configuration

### Scenario 2: Distributed Architecture
An organization runs multiple indexers for different purposes (NFT tracking, treasury monitoring, analytics) all connecting to a shared node infrastructure via TCP.

**Adaptation needed:**
* Central Cardano node accessible via TCP
* Multiple indexer instances with different filtering logic
* Connection pooling for multiple TCP connections
* Monitoring for node availability

## Common Issues and Solutions

### Issue: "Cannot connect to socket" error with local node
**Why it happens:** Either the socket path is incorrect, the node isn't running, or you don't have permission to access the socket.
**How to fix it:**
1. Verify the node is running: `ps aux | grep cardano-node`
2. Check the socket path in your node's configuration
3. Verify permissions: `ls -l /path/to/node.socket`
4. You may need to add your user to the appropriate group

### Issue: TCP connection times out
**Why it happens:** Firewall blocking the port, node not configured to accept TCP connections, or incorrect address.
**How to fix it:**
1. Verify the node is listening on the expected port: `netstat -an | grep 3001`
2. Check firewall rules allow the connection
3. Verify the node's configuration has TCP enabled (some nodes default to Unix socket only)

### Issue: "Network magic mismatch" error
**Why it happens:** Your `CARDANO_NODE_MAGIC` value doesn't match the network your node is synced to.
**How to fix it:** Double-check which network your node is running (look at the node's startup logs or configuration file) and set the correct magic number:
* Preprod: `1`
* Preview: `2`
* Mainnet: `764824073`

### Issue: Connection works but no data streaming
**Why it happens:** The node may still be syncing or has stalled.
**How to fix it:** Check the node's sync status. Most nodes expose metrics or have CLI commands to check sync percentage. Wait for full sync before expecting data.

## Tips from Experience

💡 **Tip 1**: When developing locally, keep a dedicated terminal window showing your node's logs. This helps debug connection issues faster—you can see if the node accepts your connection attempts.

💡 **Tip 2**: For production deployments, wrap your connection code in retry logic. Nodes occasionally restart for upgrades, and a robust indexer should reconnect automatically.

💡 **Tip 3**: Consider using Docker containers for running local nodes. This makes network configuration more predictable and isolates the node from your development environment.

💡 **Tip 4**: Document your connection configuration in a `.env.example` file in your repository. This helps other contributors quickly set up their environments.

## Practice This Capability

Now apply what you've learned:

1. **Practice Task 1**: Create a `.env.example` file documenting all required environment variables with comments explaining what each does

2. **Practice Task 2**: Modify the code to log connection details (without exposing credentials) when starting up, helping with troubleshooting

3. **Practice Task 3**: Research connection pooling patterns and consider how you'd implement multiple indexers sharing one node connection

## What You've Built

You now have the capability to configure Adder to connect to any Cardano node, whether local or remote. This operational knowledge is essential for contributing effectively to projects that deploy indexers outside of managed platforms like Demeter. You've demonstrated you can:

* Identify the required connection parameters
* Configure environment variables appropriately
* Modify connection code when needed
* Troubleshoot common connection issues
* Verify successful blockchain data streaming

This skill makes you infrastructure-independent—you can build indexers that work in any deployment environment.

## Next Steps

* Experiment with connecting to different networks (preview, preprod, mainnet)
* Review the Module Assignment to see how you'll demonstrate this capability in a project context
* Consider how connection configuration relates to other Adder capabilities you'll learn in this Module
* Explore monitoring and alerting for node connection health in production deployments

---

*Generated with Andamio Lesson Coach*
