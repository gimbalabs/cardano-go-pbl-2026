# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Cardano Go PBL (Project-Based Learning) Course** repository - a Gimbalabs and Blink Labs collaboration to teach Cardano development using Go tooling. The course is hosted on the Andamio platform.

## Repository Structure

- `lessons/` - Course content organized by module (100, 102, 201, 202, etc.)
  - Each lesson is a markdown file following the pattern `{module}.{lesson}/lesson-name.md`
- `adder/` - Sample Go code demonstrating Adder library usage
- `outline.md` - Course structure with all Student Learning Targets (SLTs)
- `glossary.md` - Cardano Go development terminology
- `course-upload.json` - JSON structure for importing course to Andamio platform
- `infrastructure-options.md` - Node access and infrastructure alternatives

## Key Blink Labs Go Libraries

These are the core tools taught in this course:

| Library | Purpose | GitHub |
|---------|---------|--------|
| **Bursa** | Programmatic backend wallet (key management, signing) | blinklabs-io/bursa |
| **Apollo** | Transaction building (the "Mesh" of Go) | Salvionied/apollo |
| **Adder** | Blockchain indexer and event handler | blinklabs-io/adder |
| **gOuroboros** | Node communication (N2N/N2C protocols) | blinklabs-io/gouroboros |
| **Cardano Up** | Environment setup automation | blinklabs-io/cardano-up |

## Infrastructure Context

The course no longer uses Demeter.run (discontinued). Current infrastructure options:

- **Node-to-Node (N2N)**: Public relay nodes work for ChainSync, BlockFetch (Modules 101, 201)
- **Blockfrost/Koios**: REST APIs for UTxO queries and tx submission (Module 102)
- **Local node**: Dolos (Go) or cardano-node (Docker) for mempool access (101.4 only)

Network magic values:
- Mainnet: `764824073`
- Preprod: `1`
- Preview: `2`

## Running Adder Sample Code

```bash
cd adder
go run main.go
```

Requires either:
- Socket path to local Dolos/cardano-node
- Or uncomment remote node address in code

## Course Content Conventions

- SLTs (Student Learning Targets) are "I can..." statements
- Lessons include: Prerequisites, Step-by-Step Instructions, Common Issues, Practice Tasks
- Screenshots referenced with relative paths: `/lessons/{module}/{lesson}/screenshots/`

## Andamio Platform Upload

```bash
curl -X POST http://localhost:4000/api/v0/courses/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt>" \
  -d @course-upload.json
```

Course NFT Policy ID: `fd28cf17d1869bcb1f1f3ceaa7daf02d14358ba74691fd679ba3b633`
