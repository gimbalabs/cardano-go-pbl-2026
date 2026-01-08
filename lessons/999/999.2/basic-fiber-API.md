# SLT 099.2 – I can use Fiber to build an API

## Context

This lesson is part of **099 – Golang BBK**, a set of beginner-friendly modules for Cardano developers who are new to Go.

In this SLT, you will build and run a **minimal HTTP API** using **Fiber**, a fast and popular Go web framework.

The goal is *not* to learn all of Go or all of Fiber, but to build intuition around:

- what an API is *at runtime*
- how Go projects are typically structured
- how Fiber fits into real Cardano Go tooling

---

## Learning Target

By the end of this lesson, you can truthfully say:

> **I can scaffold and run a simple HTTP API in Go using Fiber, with a clean project structure.**

---

## Prerequisites

Before starting this lesson, you should have:

- A **current, working development environment** on macOS, Linux, or Windows
  - You are able to open a terminal in your OS
  - You are comfortable navigating directories and running basic commands
- A **working Go installation** available on your PATH
  - You can verify this by running:

    ```bash
    go version
    ```

  - You should see output similar to:

    ```bash
    go version go1.25.x <os>/<arch>
    ```

- No prior experience with Go is required, but familiarity with:
  - basic programming concepts
  - HTTP requests (GET, URLs, JSON) will be helpful

---

## Conceptual Grounding: What Is an API?

At runtime, an API is:

- a program that is already running
- listening on a network port
- waiting for HTTP requests
- executing a function when a request arrives
- returning structured data (often JSON)

In other words, an API is not something you "run once" — it stays alive and responds to incoming requests over time.

Fiber helps us write this kind of long-running program in Go with minimal overhead.

---

## Why Fiber?

Fiber is useful in Cardano Go projects because it:

- provides a clean HTTP boundary around Cardano logic
- feels familiar to developers coming from Express or Fastify
- is fast, simple, and production-ready

In many Cardano systems, Fiber acts as an **adapter layer** between:

- wallets, frontends, or scripts
- Go-based tooling (Bursa, Apollo, Adder)
- the Cardano node or Cardano CLI

---

## Why We Start With Project Structure

Before writing any application code, we start by **scaffolding the project structure**.

This is intentional.

Seeing the full shape of the project up front helps you:

- understand *where things will live*
- build a mental map of the system before details appear
- avoid the common feeling of "where does this code go later?"

In Go, structure matters. It communicates intent to both humans and tooling.

We want you to see the destination before we start walking.

---

## Step 0 – Project Scaffolding

### What to do

Create the project directory and initialize a Go module:

```bash
mkdir fiber-api
cd fiber-api
go mod init github.com/gimbalabs/cardano-go-fiber-api
```

### Why it matters

This establishes the **module root** for the project. In Go, the module defines:

- how imports are resolved
- what code belongs to this project
- how other packages may depend on it

Starting here prevents confusion later when adding files and imports.

### Expected result

A new project directory containing:

```text
fiber-api/
└── go.mod
```

---

## Step 1 – Go Project Structure

### What to do here

Create the following directory structure:

```text
fiber-api/
├── cmd/
│   └── server/
└── internal/
    └── api/
```

You can create this structure with:

```bash
mkdir -p cmd/server internal/api
```

### Why it matters here

Go projects are structured to clearly separate:

- **executables** (in `cmd/`)
- **reusable application logic** (in `internal/`)

This makes it obvious:

- what runs
- what is shared
- what is private to the module

### Expected result

Your project tree now looks like:

```text

fiber-api/
├── go.mod
├── cmd/
│   └── server/
└── internal/
└── api/

```

---

## Step 2 – Adding Fiber

### What to do

Add Fiber as a dependency:

```bash
go get github.com/gofiber/fiber/v2
```

### Why it matters

Fiber provides the HTTP server and routing functionality used to expose APIs.

Adding it now ensures dependencies are managed before writing application code.

### Expected result

- `go.mod` and `go.sum` are updated
- Fiber is available for import in your project

---

## Step 3 – Minimal Server

### What to do

Create the file:

```text
cmd/server/main.go
```

Add the following code:

```go
// cmd/server/main.go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gimbalabs/cardano-go-fiber-api/internal/api"
)

// This import works because the module name in go.mod is
// github.com/gimbalabs/cardano-go-fiber-api and internal/api
// is inside the same module

func main() {
    app := fiber.New()

    api.RegisterRoutes(app)

    app.Listen(":3000")
}
```

### Why it matters

This file defines the **executable** for your API server. It is responsible for:

- starting the Fiber app
- registering routes
- listening for HTTP requests

Keeping this file small makes the system easier to reason about.

### Expected result

You now have the **server entry point** defined under `cmd/server`.

At this stage:

- the file compiles structurally
- the project shape is complete enough to understand how pieces connect
- **the server is not yet runnable**, because the routes it imports will be created in the next step

This is expected. In the next step, you will complete the implementation by defining the routes, after which the server can be run successfully.

---

## Step 4 – Routes

### What to do

Create the file:

```text
internal/api/routes.go
```

Add the following code:

```go
// internal/api/routes.go
package api

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(app *fiber.App) {
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "status": "ok",
        })
    })

    app.Get("/hello/:name", func(c *fiber.Ctx) error {
        name := c.Params("name")

        return c.JSON(fiber.Map{
            "message": "hello " + name,
        })
    })
}
```

### Why it matters

Routes define the **HTTP interface** of your application.

Separating routes from `main.go`:

- keeps the entry point simple
- makes behavior easier to test and extend
- routes are registered at startup
- handlers run only when a request matches
- request data lives on `*fiber.Ctx`

### Expected result

Your API now exposes:

- `GET /health`
- `GET /hello/:name`

---

## Step 5 – Running the Server

### What to do

From the project root, run:

```bash
go run ./cmd/server
```

### Why it matters

This is the first point where all parts of the project come together:

- the module name
- the directory structure
- internal package imports
- Fiber as an HTTP server

If something is misaligned, Go will fail loudly here, which is helpful.

### Expected result

The server starts successfully **without import errors**.

Visiting:

- `http://localhost:3000/health`
- `http://localhost:3000/hello/newman`

returns JSON responses.

---

---

---

## Reflection Questions

- What is the difference between startup time and request-handling time?
- Why is `cmd/server` a better place for `main.go` than the repo root?
- Why is HTTP a good boundary for Cardano tooling?

---

## What Comes Next

From here, you can:

- split handlers from routes
- add query parameters
- mock Cardano-shaped endpoints (e.g. `/utxos/:address`)
- integrate real CLI calls later

This completes **SLT 099.2**.
