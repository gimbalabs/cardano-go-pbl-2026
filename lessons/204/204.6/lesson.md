# SLT 204.6: I Can Use the CDDL Specification as a Reference to Understand the Structure of Cardano Transaction Data

Every Plutus interaction you ran in 203 produced a CBOR transaction. Every event you decoded in 204.3 was a CBOR transaction. The schema that defines exactly what those bytes are allowed to contain is **CDDL** — Concise Data Definition Language — and the canonical source lives in [`IntersectMBO/cardano-ledger`](https://github.com/IntersectMBO/cardano-ledger).

When something doesn't decode, this is the file you open.

---

## Prerequisites

- Completed 204.1 (decoding `PlutusData` from CBOR)
- Completed 204.3 (pulling fields out of a transaction CBOR)
- Comfortable reading hex byte strings

---

## What CDDL Is

CDDL ([RFC 8610](https://www.rfc-editor.org/rfc/rfc8610)) describes the shape of CBOR data the same way Protobuf describes wire messages. It defines maps, arrays, alternatives, byte strings — all in a small, readable syntax. Cardano's ledger ships one CDDL file per era; the current one for the Conway era lives at:

```
https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/cddl-files/conway.cddl
```

Treat it as the **source of truth** for any Cardano CBOR question. Apollo, Adder, gOuroboros, and every other library are implementations of this spec.

---

## A Tiny Tour of `conway.cddl`

The top-level transaction definition (paraphrased — open the file for the precise current version):

```cddl
transaction =
  [ transaction_body
  , transaction_witness_set
  , bool                       ; is_valid
  , auxiliary_data / null
  ]
```

Read that as: a transaction is a 4-element array. This is exactly the `tx` struct you decoded in 204.3.

The body is a CBOR map keyed by integer:

```cddl
transaction_body =
  { 0 : set<transaction_input>      ; inputs
  , 1 : [* transaction_output]      ; outputs
  , 2 : coin                        ; fee
  , ? 3 : uint                      ; ttl
  , ? 8 : uint                      ; validity_interval_start
  , ? 9 : multiasset<int>           ; mint
  , ? 11 : auxiliary_data_hash
  , ? 13 : nonempty_set<transaction_input> ; collateral
  , ? 14 : required_signers
  , ? 18 : set<transaction_input>          ; reference_inputs
  ; ... more keys
  }
```

The leading `?` marks an optional key. So a typical Conway tx body is just `{0: inputs, 1: outputs, 2: fee}` plus whichever optional keys the transaction needed.

Outputs are also a CBOR map (post-Babbage):

```cddl
transaction_output =
  { 0 : address
  , 1 : value
  , ? 2 : datum_option
  , ? 3 : script_ref
  }

datum_option = [ 0, $hash32 // 1, data ]   ; hash or inline
```

That `[0, $hash32 // 1, data]` is a tagged choice — `0` means "datum hash", `1` means "inline datum". You met both forms in 203.3 (`PayToContract` with `isInline=true` produces option `1`).

Witnesses for Plutus interactions — the structure 204.3 walked into:

```cddl
transaction_witness_set =
  { ? 0 : nonempty_set<vkeywitness>
  , ? 1 : nonempty_set<native_script>
  , ? 3 : nonempty_set<plutus_v1_script>
  , ? 4 : nonempty_set<plutus_data>          ; datums in the witness set
  , ? 5 : redeemers                          ; redeemers — what 204.3 read
  , ? 6 : nonempty_set<plutus_v2_script>
  , ? 7 : nonempty_set<plutus_v3_script>
  }
```

Now key `5` for redeemers (and `7` for the V3 scripts you `AttachV3Script`'d in 203.6) is no longer arbitrary — it's the spec.

---

## Using CDDL to Debug a Real Tx

A practical workflow when something does not decode:

1. **Get the bytes.** Either from Adder (`transactionCbor` in the event) or from a block explorer's "raw CBOR" view.
2. **Run them through a decoder you trust.** [`cbor.me`](https://cbor.me) prints a tree view; locally, `dasel` or a quick Go program with `cbor.Unmarshal(raw, &any)` works.
3. **Match the tree to the CDDL.** Outermost array of length 4 → `transaction`. The second element is a map → `transaction_witness_set`. Key `5` present → there are redeemers. Walk one level at a time.
4. **Spot the divergence.** When your Go decoder fails, compare the structure your code expects against the structure in `conway.cddl`. The mismatch is almost always: wrong era, optional key absent, or the array vs map encoding for `redeemers`.

---

## Worked Example: Where Does a Mint Actually Live?

You minted a token in 203.6. The ledger records that mint inside `transaction_body` at key `9` (the `mint` field). The CDDL definition:

```cddl
mint = multiasset<nonZeroInt64>

multiasset<a> = { + policy_id => { + asset_name => a } }
```

So if you decode the body and look at key `9`, you get a map of `policy_id` (28-byte hash) to a map of `asset_name` (byte string) to a non-zero integer (positive = mint, negative = burn). This matches exactly what Apollo emitted when you called `MintAssetsWithRedeemer` — and what your 204.3 listener saw on the way back.

A sketch in Go:

```go
type body struct {
    Inputs  cbor.RawMessage                 `cbor:"0,keyasint"`
    Outputs cbor.RawMessage                 `cbor:"1,keyasint"`
    Fee     uint64                          `cbor:"2,keyasint"`
    Mint    map[string]map[string]int64     `cbor:"9,keyasint,omitempty"`
}
```

You wrote that struct because the CDDL told you exactly which keys are required, which are optional, and what shapes their values have.

---

## Eras and Why They Matter

`cardano-ledger` keeps a separate CDDL per era because the ledger has been hard-forked many times. The keys you saw at the witness set (`5` for redeemers, `7` for V3 scripts) have **moved** between eras. If you decode a Conway tx with a Babbage parser, you will see the wrong field at the wrong key.

Heuristic: always decode against the CDDL for the era of the slot the tx landed in. For new code, default to Conway.

---

## Common Pitfalls

**Reading the wrong era.** The current CDDL lives at `eras/<era>/impl/cddl-files/<era>.cddl`. Conway is the latest as of writing — older eras (Babbage, Alonzo, Mary…) have their own files in the same repo and *are not* drop-in replacements.

**Treating maps as ordered.** CDDL maps in Cardano CBOR are *canonically* sorted by key. Some libraries enforce this; some don't. A non-canonical map round-trips with a different hash.

**Forgetting `?`** — optional keys may simply not be present in any given transaction. Failing to decode key `9` (mint) is fine for a transfer-only tx, not fine if you assumed every tx mints.

---

## Summary

- CDDL is the schema language for Cardano CBOR; the canonical file lives in [`IntersectMBO/cardano-ledger`](https://github.com/IntersectMBO/cardano-ledger).
- A transaction is `[body, witness_set, is_valid, aux_data]`. The body is a keyed map. Optional fields are flagged with `?`.
- Plutus data, redeemers, scripts, mint amounts — every byte you decoded in 204.1–204.4 traces back to a definition in this file.
- When a decoder gives you garbage, open the CDDL for the era and walk the tree. The answer is always there.

This closes Module 204. From here you have the full vocabulary: CBOR for bytes, CDDL for shape, Protobuf for off-chain payloads. In Module 301 you will use this vocabulary to debug failures that span all of them.

---

## Module 204 Summary

| Lesson | What you built |
|--------|---------------|
| 204.1 | Decoded a real datum and redeemer from raw CBOR with `PlutusData.UnmarshalCBOR` |
| 204.2 | Compiled a parameterised validator and minted a one-shot NFT pinned to a specific UTxO |
| 204.3 | Watched a chain transaction with Adder and pulled the redeemer out of the witness set |
| 204.4 | Decoded a datum, mutated a field, and re-encoded it with a matching round-trip hash |
| 204.5 | Read a Protobuf spec and predicted the generated Go shape without running `protoc` |
| 204.6 | Used `conway.cddl` from `cardano-ledger` to ground every byte in a real transaction |
