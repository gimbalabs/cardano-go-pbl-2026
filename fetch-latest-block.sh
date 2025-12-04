#!/bin/bash

# Script to fetch the latest block from Cardano node
# This script:
# 1. Gets the current chain tip
# 2. Extracts the block hash and slot number
# 3. Fetches that block and saves to a file

echo "Getting chain tip..."
CHAIN_TIP_OUTPUT=$(go run ./cmd/chain-tip 2>&1)

echo "$CHAIN_TIP_OUTPUT"
echo ""

# Extract slot and hash from chain tip output
# Expecting format like: "Slot: 109166437  Block Hash: 1a1a75bcecbf6d0f335be137aa469917cb4310978781b369e3ade8651af6ded2"
SLOT=$(echo "$CHAIN_TIP_OUTPUT" | grep -oP 'Slot: \K[0-9]+' | head -1)
HASH=$(echo "$CHAIN_TIP_OUTPUT" | grep -oP 'Block Hash: \K[a-f0-9]+' | head -1)

if [ -z "$SLOT" ] || [ -z "$HASH" ]; then
    echo "Error: Could not extract slot and hash from chain tip output"
    exit 1
fi

echo "Fetching block at slot $SLOT with hash $HASH..."
echo ""

# Fetch the block with extracted values
BLOCK_FETCH_SLOT=$SLOT BLOCK_FETCH_HASH=$HASH go run ./cmd/block-fetch > block-fetch-latest.txt

echo "Block saved to block-fetch-latest.txt"
echo "Done!"
