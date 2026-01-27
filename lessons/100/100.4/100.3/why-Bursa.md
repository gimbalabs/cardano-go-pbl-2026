# Understanding Bursa

To understand **Bursa**, you first need to understand **Cardano wallets**.

Cardano wallets are not just “addresses with money”.
They are **hierarchical key systems**, deterministically derived from a **single seed**.

We’ll start with a **glossary**, then explain the **wallet hierarchy**, and finally explain **how extended keys and normal keys relate**.

---

## Glossary

### Key

A **cryptographic secret** used to sign messages or transactions.

If you control a key, you control the authority that key represents
(spending funds, staking, voting, governance, etc.).

---

### Extended Key

An **extended key** is a private key **plus extra derivation data** (called a *chain code*) that allows it to **derive more keys**.

* File name usually ends with `Extended.skey`
* Can generate a virtually unlimited number of child keys
* Acts as the **parent key for a specific role**

Think of it like:

> a factory that can produce many related keys

---

### Hot Key

A **hot key** is a key that is **kept online** and used frequently.

* Used for day-to-day actions
* **Limited authority by design**
* Easier to rotate or replace

Examples:

* payment keys
* committee hot keys

Hot keys are more exposed, but typically carry **less authority**.

---

### Cold Key

A **cold key** is a key that is **kept offline** and used rarely.

* Used for identity or long-term authority
* **High authority**
* Difficult or expensive to rotate

Examples:

* committee cold keys
* stake pool cold keys

Cold keys are less exposed, but **far more dangerous if compromised**.

---

### Wallet

A **wallet** is **not a blockchain object**.

It is a **local structure** that owns:

* one seed
* all keys derived from that seed
* all addresses derived from those keys

In practice:

> **A wallet is a directory that owns one seed and everything derived from it.**

---

### Seed

The **seed** (usually shown as 24 words) is the **root secret** of the wallet.

* Stored as a mnemonic (e.g. `seed.txt`)
* Usually follows the BIP-39 standard
* Used to deterministically recreate all keys

If you lose the seed, you lose the wallet forever.

---

### Root Key

The **root key** is the **first cryptographic key derived from the seed**.

* Usually not stored as a file
* Exists implicitly
* All accounts and keys descend from it

Think of it as:

> the root of the entire key tree

---

### Account

An **account** is a logical subdivision under the root key.

* Indexed as `Account 0`, `Account 1`, etc.
* Each account has its own payment, stake, and governance keys
* Used to separate identities or use-cases

Accounts are **siblings**, not children of each other.

---

### Payment Keys

Keys that control **spending ADA and native tokens**.

* Used to sign transactions
* Generate payment addresses (`addr1...`)
* Typically hot keys

If you lose a payment key, you cannot spend the funds it controls.

---

### Stake Keys

Keys that control **staking and reward withdrawal**.

* Used to delegate stake
* Used to withdraw staking rewards
* Generate stake addresses (`stake1...`)

Stake keys **do not spend funds directly**.

---

### DRep Keys

Keys used for **on-chain governance voting**.

* Represent a Delegated Representative (DRep)
* Used to vote on governance actions
* Completely separate from money and staking

---

### Committee Keys

Keys used by **Constitutional Committee members**.

* **Cold key**: long-term identity and authority
* **Hot key**: operational voting key
* Split for security and key rotation

---

## Wallet Hierarchy

This diagram shows **how one wallet is structured** and how a wallet UI can manage multiple wallets.

```
Cardano Wallet Universe (one root key space)

├─ Wallet A (mnemonic-backed; software wallet)
│  ├─ seed.txt  (mnemonic → root key, implicit)
│  │
│  ├─ User Wallet Domain (what normal wallets expose)
│  │  ├─ Account 0
│  │  │  ├─ Payment keys
│  │  │  │  ├─ paymentExtended.skey
│  │  │  │  ├─ payment.skey
│  │  │  │  ├─ payment.vkey
│  │  │  │  └─ payment.addr
│  │  │  │
│  │  │  ├─ Stake keys
│  │  │  │  ├─ stakeExtended.skey
│  │  │  │  ├─ stake.skey
│  │  │  │  ├─ stake.vkey
│  │  │  │  └─ stake.addr
│  │  │  │
│  │  │  ├─ Addresses (derived combinations)
│  │  │  │  ├─ Base address (payment + stake)
│  │  │  │  ├─ Enterprise address (payment only)
│  │  │  │  └─ Reward address (stake only)
│  │  │  │
│  │  │  ├─ Governance keys
│  │  │  │  ├─ DRep
│  │  │  │  │  ├─ drepExtended.skey
│  │  │  │  │  ├─ drep.skey
│  │  │  │  │  └─ drep.vkey
│  │  │  │  │
│  │  │  │  └─ Constitutional Committee
│  │  │  │     ├─ committee-cold
│  │  │  │     │  ├─ committee-cold-extended.skey
│  │  │  │     │  ├─ committee-cold.skey
│  │  │  │     │  └─ committee-cold.vkey
│  │  │  │     │
│  │  │  │     └─ committee-hot
│  │  │  │        ├─ committee-hot-extended.skey
│  │  │  │        ├─ committee-hot.skey
│  │  │  │        └─ committee-hot.vkey
│  │  │  │
│  │  │  └─ (multiple payment / stake indices possible)
│  │  │
│  │  └─ Account 1
│  │     └─ (same structure as Account 0)
│  │
│  ├─ Native Asset / Minting Domain
│  │  └─ Policy keys
│  │     ├─ policyExtended.skey
│  │     ├─ policy.skey
│  │     └─ policy.vkey
│  │
│  ├─ Stake Pool / Node Operator Domain
│  │  ├─ Pool cold keys (long-term pool identity)
│  │  │  ├─ poolColdExtended.skey
│  │  │  ├─ poolCold.skey
│  │  │  └─ poolCold.vkey
│  │  │
│  │  ├─ VRF keys (leader election)
│  │  │  ├─ vrf.skey
│  │  │  └─ vrf.vkey
│  │  │
│  │  ├─ KES keys (hot block-signing keys; rotate)
│  │  │  ├─ kes.skey
│  │  │  └─ kes.vkey
│  │  │
│  │  └─ Pool certificates
│  │     └─ Operational certificate
│  │        └─ binds KES key + pool cold key + counter + period
│  │
│  └─ Multi-signature / Script Domain
│     ├─ Script definition (JSON)
│     ├─ Script hash
│     └─ Script address
│
├─ Wallet B (software wallet)
│  └─ seed.txt → different mnemonic → different universe
│
└─ Wallet C (hardware wallet)
   ├─ Seed exists (generated and stored inside secure hardware)
   ├─ Seed may be backed up by user (recovery words)
   ├─ Private keys never leave device
   ├─ Public keys and addresses are exported
   └─ Signing requests are approved on-device

```

### Key invariants

* **One wallet = one seed**
* **One seed = one deterministic universe**
* **Accounts are siblings**
* **Roles (Payment / Stake / DRep / Committee) live under an account**

---

## How Extended Keys and Normal Keys Work Together

### 1. What an Extended Key Actually Produces

An **extended signing key** (`*Extended.skey`) does **not** just produce another signing key.

It produces a **keypair**:

* a **signing key** (`*.skey`)
* its matching **verification key** (`*.vkey`)

These two always come together and are mathematically linked.

The real relationship is:

```
Extended signing key
 └─ (index N)
     ├─ signing key (skey)
     └─ verification key (vkey)
```

You never derive a `vkey` directly on its own.
It is always derived from the `skey`, which itself is derived from the extended key.

---

### 2. Multiple Keypairs from One Extended Key

An extended key (`*Extended.skey`) can derive **virtually infinite signing/verification keypairs** by changing the **final index** in the derivation path.

Example for a DRep role:

* `drepExtended.skey` can derive:

  * index `0` → `drep.skey` + `drep.vkey`
  * index `1` → `drep_1.skey` + `drep_1.vkey`
  * index `2` → `drep_2.skey` + `drep_2.vkey`
  * …

Each index produces:

* **exactly one signing key (`skey`)**
* **exactly one matching verification key (`vkey`)**

They are inseparable.

---

### 2. Subset vs. Same Level

Extended keys, normal keys, and verification keys are **not siblings**.
They have a **parent → child** relationship.

#### Extended Key (`*Extended.skey`)

* The **parent**
* Contains:

  * private key
  * chain code (required for derivation)
* Can derive many child keys

#### Non-Extended Key (`*.skey`)

* A **child**
* Derived from the extended key
* Used for actual signing

#### Verification Key (`*.vkey`)

* Public version of a specific child key
* Safe to share
* Used to verify signatures or build addresses

---

### Why Keep All of Them Together?

**Security**

* Extended keys serve as long-term backups
* Normal keys are used operationally

**Compatibility**

* Many tools (including `cardano-cli`) require non-extended keys

**Convenience**

* `.vkey` and `.addr` are public
* Easy to inspect or share without touching secrets

---
---

## Where Bursa Fits In

Bursa sits **on top of the Cardano wallet and key model** described above.
It does not change how keys, accounts, or derivation work.
It implements and enforces that structure in a consistent backend system.

---

### Bursa as a Wallet Manager

Bursa is a wallet management backend.

* It can manage **multiple wallets**
* Each wallet corresponds to **one seed**
* Each seed defines **one deterministic key universe**
* Wallets are isolated from each other by design

In other words:

> **Bursa manages many independent Cardano wallet trees under a single system.**

---

### What Bursa Manages

For each wallet, Bursa is responsible for:

* Storing or loading the seed
* Deriving the root key
* Deriving account-level keys
* Deriving role-specific extended keys
* Deriving operational keypairs (`skey` + `vkey`)
* Deriving addresses and identities from verification keys

All derivation follows Cardano standards.

---

### Interaction Surfaces

Bursa exposes two interfaces that operate on the same underlying model.

#### CLI (Terminal)

The CLI is a direct operator interface to the wallet system.

Used for:

* Creating and restoring wallets
* Loading existing wallets
* Inspecting keys and derived artifacts
* Running deterministic workflows

---

#### HTTP APIs

The HTTP APIs expose the same wallet and key operations programmatically.

Used for:

* Backend services
* Automation
* Long-running systems that need wallet control

Both the CLI and HTTP APIs operate on:

* the same wallet abstractions
* the same derivation rules
* the same key hierarchy

---

### Key Invariant

> **Bursa operationalizes the Cardano wallet model in a backend-friendly form.**

