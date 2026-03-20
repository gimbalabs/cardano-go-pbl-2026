# Build a Basic Web API in Go Using Fiber

In this lesson, you will scaffold and run a minimal HTTP API with Fiber in Go. You will set up clean project structure, register routes, run the server, and verify JSON responses.

## Prerequisites

- Go 1.21+
- Terminal access
- Basic familiarity with HTTP requests (`GET`, URLs, JSON)

## What You Will Learn

1. Standard Go structure for a small API service
2. How to add Fiber and register routes
3. How request handling works at runtime
4. How to run and validate a local API server

## Recommended Project Layout

Note: Don't build this yet, we'll build this up as we go.

```text
fiber-api/
  go.mod
  cmd/
    server/
      main.go
  internal/
    api/
      routes.go
```

## Step-by-Step Build

### Step 1: Initialize Project

```bash
mkdir fiber-api
cd fiber-api
go mod init <your user/project name>/cardano-go-fiber-api
```

This creates the module root and import namespace for your code.

### Step 2: Create Directories

```bash
mkdir -p cmd/server internal/api
```

This separates executable entry points (`cmd/`) from internal app packages (`internal/`).

### Step 3: Add Fiber

```bash
go get github.com/gofiber/fiber/v2
```

Fiber is now available in your module dependencies.

### Step 4: Create Server Entry Point

Create `cmd/server/main.go`:

```go
// cmd/server/main.go
package main

import (
    "github.com/gofiber/fiber/v2"

    // Local package that defines routes.
    "github.com/gimbalabs/cardano-go-fiber-api/internal/api"
)

func main() {
    // Create the app.
    app := fiber.New()

    // Attach routes from internal/api.
    api.RegisterRoutes(app)

    // Start the server on port 3000.
    if err := app.Listen(":3000"); err != nil {
        panic(err)
    }
}
```

This starts Fiber and delegates route setup to an internal package.

### Step 5: Register Routes

Create `internal/api/routes.go`:

```go
// internal/api/routes.go
package api

import "github.com/gofiber/fiber/v2"

// RegisterRoutes wires endpoints onto the shared app.
// *fiber.App points to the same app created in main.go.
func RegisterRoutes(app *fiber.App) {
    // GET /health
    // *fiber.Ctx is the request context for one HTTP call.
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "status": "ok",
        })
    })

    // GET /hello/:name
    // :name is a dynamic path parameter (example: /hello/newman).
    app.Get("/hello/:name", func(c *fiber.Ctx) error {
        // Read :name from the URL.
        name := c.Params("name")

        return c.JSON(fiber.Map{
            "message": "hello " + name,
        })
    })
}
```

You now expose a health endpoint and a dynamic route parameter.

Pointer quick meaning in this lesson:

- `*fiber.App`: pointer to the long-lived app/router object.
- `*fiber.Ctx`: pointer to per-request context object created for each request.

How to think about `*fiber.Ctx`:
- It is your handler's toolbox for one request.
- Read request data from it (path params, query params, body).
- Write response data with it (status code, JSON/text body).

Minimal example:

```go
app.Get("/greet/:name", func(c *fiber.Ctx) error {
    name := c.Params("name")          // from path
    caps := c.Query("caps", "false")  // from query string

    msg := "hello " + name
    if caps == "true" {
        msg = "HELLO " + name
    }

    return c.Status(200).JSON(fiber.Map{"message": msg})
})
```

Dynamic route param means a variable part of the URL path.

- Route pattern: `/hello/:name`
- Example request: `/hello/newman`
- Captured value: `name = "newman"`
- Access in handler: `c.Params("name")`

### Step 6: Run and Verify

Start the server from project root:

```bash
go run ./cmd/server
```

In another terminal, validate endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/hello/newman
```

Expected JSON:

```json
{"status":"ok"}
{"message":"hello newman"}
```

## API Runtime Model

At runtime, your API process:

1. Starts once and keeps running
2. Listens on a port (`:3000`)
3. Matches incoming requests to registered routes
4. Runs handler functions and returns responses

This request/response boundary is the same boundary you will later use for Cardano-specific logic.

## Debugging and Route Development Workflow

When you add or edit routes, your running `go run` process does not hot-reload by default.

1. Stop server with `Ctrl+C`.
2. Re-run `go run ./cmd/server`.
3. Re-test route with `curl`.

Quick checks when a new route does not work:

- `404 Not Found`: route path or method does not match (for example `GET` vs `POST`).
- `500 Internal Server Error`: handler returned an error or panicked.
- Build/import error on restart: module path in imports does not match your `go.mod` module name.

Useful debug additions while learning:

- Log inside handlers (for example `fmt.Println("hit /hello")`).
- Return intermediate values in JSON while testing.

## You'll Know You're Successful When

- `go run ./cmd/server` starts without import/module errors
- `GET /health` returns `{"status":"ok"}`
- `GET /hello/:name` returns a personalized JSON response
- You can explain why `main.go` stays small and routes live in `internal/api`

## Practice Tasks

1. Add `GET /version` that returns `{ "version": "v0.1.0" }`.
2. Add query support to `/hello/:name`, for example `?caps=true`.
3. Move handler functions into a separate file and keep route registration focused on wiring.

## Next Steps

- Reuse this structure when exposing Cardano workflows behind HTTP endpoints.
- Keep `cmd/` for executables and `internal/` for application behavior as your service grows.

This completes **SLT 099.4**.
