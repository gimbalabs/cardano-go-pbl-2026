# Store and Retrieve Data Using Adder

In Lesson 202.2, you saw that event handlers are stateless — events flow through and are gone. If you need to answer questions about what happened while your handler was running, you need somewhere to put the data. This lesson adds a SQLite storage layer to an Adder pipeline, turning it into a minimal custom indexer.

By the end of this lesson, transactions arriving at your watched address will be persisted to a local database that you can query at any time.

---

## Prerequisites

- Completed Module 201 (Reacting to Chain Events with Adder)
- Read Lessons 202.1 and 202.2
- Dolos running locally (see 099 — Setting Up Dolos)
- Go installed

---

## What We're Building

```
Dolos (local node)
    ↓  Unix socket
Adder pipeline
    ↓  address filter
handleEvent callback
    ↓
SQLite database  ←  you can query this at any time
```

Adder handles the chain connection and filtering. Our job is to add storage inside the callback — and then read it back out.

---

## Step 1: Add the SQLite driver

From inside the `adder-library-starter-kit` directory, add the SQLite dependency:

```bash
go get modernc.org/sqlite
```

`modernc.org/sqlite` is a pure Go SQLite driver — no C compiler required.

---

## Step 2: Add imports

Open `cmd/event-address-filter/main.go`. Add two lines to the existing import block:

```go
import (
    "database/sql"
    "fmt"
    "log/slog"

    "github.com/blinklabs-io/adder/event"
    filter_chainsync "github.com/blinklabs-io/adder/filter/chainsync"
    filter_event "github.com/blinklabs-io/adder/filter/event"
    input_chainsync "github.com/blinklabs-io/adder/input/chainsync"
    output_embedded "github.com/blinklabs-io/adder/output/embedded"
    "github.com/blinklabs-io/adder/pipeline"
    "github.com/kelseyhightower/envconfig"
    _ "modernc.org/sqlite"
)
```

The `_` in front of `modernc.org/sqlite` is important — it tells Go to import the package for its side effects only (registering the SQLite driver), without us calling it directly.

---

## Step 3: Declare a package-level database variable

After the closing `}` of the `Config` struct, add:

```go
var db *sql.DB
```

This makes the database connection available to both `main()` and `handleEvent`.

---

## Step 4: Open the database and create the table

After the `envconfig.Process` call in `main()`, add:

```go
// Open SQLite database
var err error
db, err = sql.Open("sqlite", "indexer.db")
if err != nil {
    panic(err)
}
defer db.Close()

_, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS transactions (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_hash   TEXT NOT NULL UNIQUE,
        slot      INTEGER NOT NULL,
        stored_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`)
if err != nil {
    panic(err)
}
slog.Info("database ready")
```

`CREATE TABLE IF NOT EXISTS` means this is safe to run every time — it only creates the table on the first run.

---

## Step 5: Switch to your local Dolos socket

In the input options, comment out the remote address and enable the socket:

```go
input_chainsync.WithSocketPath(cfg.SocketPath),
// input_chainsync.WithAddress("52.15.49.197:3001"),
```

---

## Step 6: Update the address filter

Replace the example address in `filter_chainsync.WithAddresses` with your own preprod address, and remove the asset fingerprint filter — that was specific to mainnet DJED and will block everything on preprod:

```go
filterChainsync := filter_chainsync.New(
    filter_chainsync.WithAddresses(
        []string{
            "your_preprod_address_here",
        },
    ),
)
```

---

## Step 7: Replace handleEvent

Replace the existing `handleEvent` function with one that stores to SQLite and then reads back what's been stored:

```go
func handleEvent(evt event.Event) error {
    payload, ok := evt.Payload.(event.TransactionEvent)
    if !ok {
        return nil
    }

    ctx, ok := evt.Context.(event.TransactionContext)
    if !ok {
        return nil
    }

    txHash := fmt.Sprintf("%x", payload.Transaction.Hash())
    slot := ctx.SlotNumber

    _, err := db.Exec(
        `INSERT OR IGNORE INTO transactions (tx_hash, slot) VALUES (?, ?)`,
        txHash, slot,
    )
    if err != nil {
        return fmt.Errorf("failed to store transaction: %w", err)
    }

    slog.Info("stored transaction", "tx_hash", txHash, "slot", slot)

    // Query and print everything stored so far
    rows, err := db.Query(`SELECT tx_hash, slot, stored_at FROM transactions ORDER BY slot DESC`)
    if err != nil {
        return err
    }
    defer rows.Close()

    fmt.Println("\n--- stored transactions ---")
    for rows.Next() {
        var txHash, storedAt string
        var slot uint64
        rows.Scan(&txHash, &slot, &storedAt)
        fmt.Printf("  slot=%-10d  tx=%s...  stored=%s\n", slot, txHash[:16], storedAt)
    }
    fmt.Println("--------------------------\n")

    return nil
}
```

**What's happening here:**

- `evt.Payload.(event.TransactionEvent)` and `evt.Context.(event.TransactionContext)` — both `Payload` and `Context` on an `event.Event` are typed as `any`, so you must assert each one to its concrete type. Both are defined in the `github.com/blinklabs-io/adder/event` package.
- `INSERT OR IGNORE` — safely skips duplicates if the same tx arrives twice
- After storing, we immediately query the full table to show the retrieve side of the pattern

---

## Step 8: Run it

Make sure Dolos is running, then:

```bash
go run cmd/event-address-filter/main.go
```

You should see:

```
database ready
ChainSync status update: ...
```

[SCREENSHOT: terminal showing database ready + chainsync connected]

Now send a transaction to your watched address from the preprod faucet or another wallet. When it lands on chain, you'll see:

```
stored transaction tx_hash=... slot=...

--- stored transactions ---
  slot=XXXXXXX    tx=abcdef1234567890...  stored=2026-03-26 10:42:00
--------------------------
```

[SCREENSHOT: terminal showing stored transaction + table output]

---

## What Just Happened

The pipeline handled everything up to the callback — connecting to Dolos, following the chain, filtering by address. Inside `handleEvent`, we added two things:

1. **Store** — write the transaction hash and slot to SQLite
2. **Retrieve** — immediately query and print the full table

The `indexer.db` file that appears in your directory is a real SQLite database. You can query it directly from the terminal while the indexer is running or after it stops. First install the SQLite CLI if you don't have it:

```bash
sudo apt install sqlite3
```

Then query the database:

```bash
sqlite3 indexer.db "SELECT * FROM transactions ORDER BY slot DESC"
```

Or open it in a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org) to browse the table interactively.

---

## A Note on Rollbacks

Cardano can occasionally reorganise the chain near the tip — a block (and its transactions) that appeared valid may be replaced by a competing fork. A production indexer needs to listen for rollback events and remove or flag any affected transactions from the database.

That's out of scope for this lesson, but worth knowing: data stored very close to the current tip has a small chance of being on an orphaned fork. The further a slot is from the tip, the safer it is to treat as final.

---

## The Key Insight

Adder doesn't store anything — that is intentional. It gives you the filtered event stream and leaves the storage decision entirely to you. This is what makes it a library rather than a product: you choose the database, the schema, and the query interface that fits your application.

What you've built here is the simplest possible custom indexer. The pattern scales: swap SQLite for PostgreSQL, extend the schema to capture outputs and lovelace amounts, add an HTTP endpoint to serve queries — and you have a production indexer.

---

## Common Issues

### `dolos.socket: no such file or directory`
Dolos is not running. Start it with `dolos daemon` from your Dolos directory.

### No transactions appearing
Check that your address in the filter matches the address you're sending to, and that Dolos has finished syncing to the chain tip (watch the slot numbers in the status logs).

### `indexer.db` already exists with old data
Safe to delete it and restart — `CREATE TABLE IF NOT EXISTS` will recreate the schema on the next run.

---

## Practice Tasks

1. Add a `lovelace` column to the schema and store the total ADA sent in each transaction
2. Modify the query in `handleEvent` to only show the 5 most recent transactions
3. Stop and restart the indexer — confirm that previously stored transactions are still there when it comes back up

---

## What's Next

- Lesson 202.4: Select the right query provider for your application
- Lesson 202.5: Combine live event data with historical query data

---

*Generated with Andamio Lesson Coach*
