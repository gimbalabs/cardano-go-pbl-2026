# Read a Protobuf Spec and Interpret Data Structures in Go

In this lesson, you will learn to read `.proto` definitions and turn them into reliable Go mental models. This is a core skill when integrating with APIs, event streams, and service boundaries.

## Prerequisites

- Go 1.21+
- Basic understanding of structs and JSON
- Familiarity with request/response APIs

## What You Will Learn

1. How to read message fields, numbers, and types in `.proto`
2. How `repeated`, `enum`, `oneof`, and nested messages map to Go
3. How field numbering and backward compatibility affect design
4. How to avoid common decoding and schema-evolution mistakes

## Example Protobuf Spec

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

message MempoolSource {
  string node_id = 1;
}

message BlockSource {
  string block_hash = 1;
  uint64 block_height = 2;
}
```

## How to Read It

- `tx_hash = 1` means field number `1` on the wire; never renumber in existing schemas
- `repeated Output outputs = 3` means a list/slice
- `enum EventKind` maps to generated Go enum constants
- `oneof source` means exactly one variant should be set (`mempool` or `block`)

## Go Mapping Mental Model

Generated Go shape is conceptually similar to:

```go
type TransactionEvent struct {
    TxHash  string
    Slot    uint64
    Outputs []*Output
    Kind    EventKind
    // oneof source represented by interface/wrapper types in generated code
}

type Output struct {
    Address string
    Lovelace uint64
}
```

You should rely on generated code directly rather than hand-writing these structs.

## Step-by-Step Integration Workflow

### Step 1: Read Schema for Domain Meaning

Before coding, answer:

- Which fields are identity keys? (`tx_hash`)
- Which fields are ordering/time context? (`slot`)
- Which fields are optional/variant? (`oneof source`)

### Step 2: Generate Go Types

Use `protoc` with the Go plugin (exact command depends on your toolchain):

```bash
protoc --go_out=. --go_opt=paths=source_relative chain_events.proto
```

### Step 3: Decode and Validate

In consuming code, validate required business assumptions even in `proto3`:

- Non-empty IDs
- Positive quantities where expected
- Valid enum ranges for your business logic

### Step 4: Handle `oneof` Safely

Use type switches on generated oneof wrappers to avoid invalid assumptions.

### Step 5: Plan Schema Evolution

When updating schemas:

- Add new fields with new numbers
- Deprecate old fields; do not reuse numbers
- Preserve existing semantics for backward compatibility

## Common Mistakes

- Renumbering fields in a published schema
- Treating zero values as "missing" without explicit checks
- Ignoring unknown enum values in forward-compatible systems
- Assuming `oneof` variants without checking which is actually set

## You'll Know You're Successful When

- You can explain what each field number means and why it matters
- You can map protobuf constructs to Go usage without guessing
- You can read a new `.proto` file and design decoder logic quickly
- You can propose safe schema changes without breaking consumers

## Practice Tasks

1. Add an optional `network` field to the example schema using a new field number and describe compatibility impact.
2. Write decoder checks that reject empty `tx_hash` and zero `slot` for applied events.
3. Extend `EventKind` with a new enum value and define fallback behavior for older services.

## Next Steps

- Apply this schema-reading workflow when consuming blockchain event payloads and service APIs in later modules.
