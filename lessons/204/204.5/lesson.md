# SLT 204.5: I Can Read a Protobuf Spec and Use It to Interpret How Data Is Structured in a System

CBOR runs on-chain. Once data leaves the chain — through an indexer, an RPC, an event bus — you will often meet **Protobuf** instead. This lesson is a quick reference: enough to read a `.proto` file, picture the matching Go types, and consume the data without surprises.

---

## What Protobuf Is, in One Paragraph

Protobuf is a schema language for binary messages. You write a `.proto` file describing your data (fields, types, numbers); a code generator (`protoc`) produces typed structs in your target language. The wire format is compact and self-describing-by-number — a renamed field still decodes, but a renumbered field does not. Most Cardano APIs that publish events outside the chain (e.g. the [UTxORPC / u5c](https://utxorpc.org) spec) use Protobuf for exactly this reason.

---

## Reading a `.proto`

```proto
syntax = "proto3";
package chain.events.v1;

message TransactionEvent {
  string tx_hash = 1;
  uint64 slot = 2;
  repeated Output outputs = 3;
  EventKind kind = 4;
  oneof source {
    MempoolSource mempool = 5;
    BlockSource block = 6;
  }
}

message Output {
  string address = 1;
  uint64 lovelace = 2;
}

enum EventKind {
  EVENT_KIND_UNSPECIFIED = 0;
  EVENT_KIND_APPLIED = 1;
  EVENT_KIND_ROLLED_BACK = 2;
}
```

Three things to notice:

| Construct | What it means |
|-----------|---------------|
| `= 1`, `= 2`, … | Wire field numbers — the only thing on the wire. **Never renumber.** |
| `repeated` | A list (Go slice). |
| `oneof` | Exactly one of the listed variants is set; generated as a Go interface. |

---

## How It Maps to Go

`protoc` turns the schema above into Go that looks roughly like:

```go
type TransactionEvent struct {
    TxHash  string
    Slot    uint64
    Outputs []*Output
    Kind    EventKind
    Source  isTransactionEvent_Source // oneof — interface
}

type Output struct {
    Address  string
    Lovelace uint64
}

type EventKind int32
const (
    EventKind_EVENT_KIND_UNSPECIFIED EventKind = 0
    EventKind_EVENT_KIND_APPLIED     EventKind = 1
    EventKind_EVENT_KIND_ROLLED_BACK EventKind = 2
)
```

You consume the generated code; you never write these types by hand.

---

## Generate the Code

```bash
protoc --go_out=. --go_opt=paths=source_relative chain_events.proto
```

The output is a `chain_events.pb.go` next to the `.proto`. Import it from your application like any other Go package.

---

## Three Things That Will Bite You

**Renumbering fields.** Field number = identity on the wire. Renaming `tx_hash` is fine; changing `= 1` to `= 7` breaks every existing client.

**Zero values vs missing.** In `proto3`, `Slot == 0` does not mean "absent". If you need optional, use `optional uint64 slot = 2;` (proto3 supports it) or a wrapper type.

**Unhandled `oneof` variants.** A `switch` on the oneof interface should always have a default branch — new variants get added in newer schema versions, and older clients must not crash.

---

## Where You Will Meet Protobuf in Cardano

| Service | What it ships in Protobuf |
|---------|--------------------------|
| [UTxORPC (u5c)](https://utxorpc.org) | Common Cardano service spec — query, sync, submit |
| [Dolos](https://github.com/txpipe/dolos) gRPC API | Block streaming and chain sync |
| Many event bridges | Kafka / NATS / gRPC payloads |

If you see a `.proto` in a Cardano repo, expect it to describe events shaped like the example above — slot, hash, outputs, kind.

---

## Summary

- A `.proto` defines messages, fields, numbers, and enums; field numbers are forever.
- `protoc --go_out=...` generates idiomatic Go structs you import directly.
- `repeated` → slice, `oneof` → interface, `enum` → typed `int32` constants.
- Watch for renumbering, zero-value-as-missing, and unknown oneof variants.

In 204.6 you will look at the schema language Cardano *itself* uses for its on-chain types — CDDL — and read the `cardano-ledger` spec as a reference for any transaction byte you encounter.
