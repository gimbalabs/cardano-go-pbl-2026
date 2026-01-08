# Using Bursa as a Programmable Backend Wallet (CLI + HTTP)

Bursa is a programmable backend wallet provider written in Go, designed for software-controlled wallets, not human interaction. It is used in systems that require deterministic wallet behavior, such as backend services, indexers, or agents.

---

## Prerequisites

- Git
- Go
- Terminal access
- Ability to make HTTP requests (e.g. curl)

---

## One-Time Setup

Run once before any workflow:

```bash
git clone https://github.com/blinklabs-io/bursa
cd bursa
go mod download
go mod tidy
```

All commands assume you are inside the `bursa/` repository.

---

## Core Concepts

### Backend Wallet

A backend wallet is controlled entirely by software. Your system has direct access to:

- Private keys
- Addresses
- Mnemonics
- Role-specific keys (payment, stake, committee, dRep)

![Backend Wallet Diagram](/lessons/102/102.1/screenshots/Screenshot%202025-12-19%20at%202.58.26%E2%80%AFpm.png)

### Responsibility Model

- Bursa enforces no permissions or policies
- Your application defines:
  - Authorization
  - Limits
  - Usage rules
- Bursa executes instructions deterministically

Bursa can also manage multiple wallets under a single backend system.

---

## Interaction Methods

Bursa exposes two interfaces:

### 1. CLI (Terminal)

Used mainly for:

- Wallet creation
- Wallet loading
- Manual workflows
- Development and testing

### 2. HTTP APIs

Used by backend services for programmatic control.

---

## CLI Usage

### Create a Wallet

**Non-persistent (printed only):**

```bash
go run ./cmd/bursa wallet create
```

**Persistent (saved to disk):**

```bash
go run ./cmd/bursa wallet create --output wallets
```

### Load a Wallet

```bash
go run ./cmd/bursa wallet load --dir wallets
```

**Optional:**

- `--show-secrets` prints private key hex values (use carefully)

> **Note:** wallet load is required for all CLI-based workflows.

---

## HTTP API Usage

### Start the API Server

```bash
go run ./cmd/bursa api
```

The API runs at:

```
http://localhost:8080/api/wallet
```

Open a second terminal for client requests.

**Endpoint overview:**

![Endpoint Overview Diagram](/lessons/102/102.1/screenshots/Screenshot%202025-12-23%20at%208.24.14%E2%80%AFam.png)

---

## Persistence Note

- Wallet persistence is currently backed by Google Cloud
- Without persistence:
  - Only Create and Restore endpoints work
  - All other endpoints require persistence to be enabled

---

## API Examples (No Persistence)

### Create Wallet

```bash
curl -X GET \
  'http://localhost:8080/api/wallet/create' \
  -H 'accept: application/json'
```

**Behavior:**

- Generates all keys and addresses
- Does not store anything

**Implicit defaults:**

- `account_id = 0`
- All other IDs = 0
- `password = ""`

These values affect deterministic key derivation.

---

### Restore Wallet

```bash
curl -X POST \
  'http://localhost:8080/api/wallet/restore' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": 0,
    "address_id": 0,
    "committee_cold_id": 0,
    "committee_hot_id": 0,
    "drep_id": 0,
    "mnemonic": "test test test test test test test test test test test test test test test test test test test test test test test test",
    "password": "",
    "payment_id": 0,
    "stake_id": 0
  }'
```

If all parameters match, the wallet is recreated exactly.

---

## Key Takeaway

Bursa gives you a fully deterministic backend wallet that is:

- Created and restored programmatically
- Controlled entirely by application logic
- Suitable for production backend systems

Policy, permissions, and safety are enforced outside Bursa, in your software.
