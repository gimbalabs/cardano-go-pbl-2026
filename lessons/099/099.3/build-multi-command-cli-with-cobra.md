# Build a Command-Line Tool with Multiple Commands Using Cobra

In this lesson, you will build a beginner-friendly multi-command CLI in Go using Cobra. You will set up `main.go`, understand `cmd/root.go`, add subcommands, and run the tool end to end.

## Prerequisites

- Go 1.21+
- Basic familiarity with terminal commands
- Basic understanding of Go files and functions

## What You Will Learn

1. What `main.go` does in a Cobra app
2. What `cmd/root.go` is responsible for
3. How subcommands are added and wired
4. How to use command flags and return errors clearly

## Recommended Project Layout

```text
mycli/
  go.mod
  main.go
  cmd/
    root.go
    version.go
    greet.go
```

## Step-by-Step Build

### Step 1: Initialize Project and Install Cobra CLI

```bash
mkdir mycli
cd mycli
go mod init example.com/mycli
go install github.com/spf13/cobra-cli@latest
```

If `cobra-cli` is not found, add your Go bin path and retry:

```bash
export PATH="$(go env GOPATH)/bin:$PATH"
```

### Step 2: Generate Boilerplate (`main.go` and `root.go`)

```bash
cobra-cli init
```

This creates:

- `main.go` as the app entry point
- `cmd/root.go` as the root command definition

### Step 3: Understand and Confirm `main.go`

Your `main.go` should call the root command execution:

```go
package main

import "example.com/mycli/cmd"

func main() {
    cmd.Execute()
}
```

`main.go` should stay very small. It just starts your CLI.

### Step 4: Understand and Confirm `cmd/root.go`

`root.go` defines the base command and central execution path:

```go
package cmd

import (
    "os"

    "github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
    Use:   "mycli",
    Short: "A short description of your application",
    Long:  "A longer description you can customize for beginners.",
}

var jsonOutput bool

func Execute() {
    err := rootCmd.Execute()
    if err != nil {
        os.Exit(1)
    }
}

func init() {
    // Persistent flag: available to root and all subcommands.
    rootCmd.PersistentFlags().BoolVar(&jsonOutput, "json", false, "output as JSON")
}
```

Why this matters:

- `rootCmd` is the parent for all subcommands
- `Execute()` parses arguments and runs the matching command
- Every added command eventually hangs off `rootCmd`

### Step 5: Add Subcommands

```bash
cobra-cli add version
cobra-cli add greet
```

Cobra generates `cmd/version.go` and `cmd/greet.go`, and wires each command into `rootCmd`.

### Step 6: Implement and Register `version` Command

Update `cmd/version.go`:

```go
package cmd

import "github.com/spf13/cobra"

var versionCmd = &cobra.Command{
    Use:   "version",
    Short: "Print CLI version",
    Run: func(cmd *cobra.Command, args []string) {
        cmd.Println("mycli v0.1.0")
    },
}

func init() {
    // Registration is required: without this, Cobra does not know this command exists.
    rootCmd.AddCommand(versionCmd)
}
```

Why this step matters:

- Defining `versionCmd` only creates a variable in memory.
- `rootCmd.AddCommand(versionCmd)` attaches it to the CLI command tree.
- `go run . version` only works after registration.

### Step 7: Implement and Register `greet` Command with a Required Flag

Update `cmd/greet.go`:

```go
package cmd

import (
    "fmt"

    "github.com/spf13/cobra"
)

var name string

var greetCmd = &cobra.Command{
    Use:   "greet",
    Short: "Print a greeting",
    RunE: func(cmd *cobra.Command, args []string) error {
        if name == "" {
            return fmt.Errorf("--name is required")
        }
        if jsonOutput {
            cmd.Printf("{\"message\":\"hello, %s\"}\n", name)
            return nil
        }

        cmd.Printf("hello, %s\n", name)
        return nil
    },
}

func init() {
    // Required: attach this subcommand to the root command.
    rootCmd.AddCommand(greetCmd)

    // Then configure command-specific flags.
    greetCmd.Flags().StringVar(&name, "name", "", "name to greet")
}
```

Why this step matters:

- `RunE` lets you return a real error for invalid input (like missing `--name`).
- `rootCmd.AddCommand(greetCmd)` is what makes `mycli greet` discoverable.
- If you skip registration, Cobra returns: `unknown command "greet"`.

How this flag configuration works:

```go
greetCmd.Flags().StringVar(&name, "name", "", "name to greet")
```

- `greetCmd.Flags()`: gets the flag set for `greet` only.
- `StringVar(...)`: defines a string flag and binds it to a Go variable.
- `&name`: pointer to the destination variable; Cobra writes the parsed value here.
- `"name"`: the CLI flag key, used as `--name`.
- `""`: default value when user does not pass `--name`.
- `"name to greet"`: help text shown in `greet --help`.

Example flow:

- User runs `go run . greet --name ada`.
- Cobra parses `--name ada` before `RunE` starts.
- `name` is set to `"ada"`.
- Your `RunE` logic reads `name` and prints `hello, ada`.

## Local vs Persistent Flags

- Local flag: defined with `command.Flags()`. Only that command can use it.
- Persistent flag: defined with `command.PersistentFlags()`. That command and all child commands can use it.

When to use local flags:

- The option only makes sense for one command.
- Example: `greet --name ada`.

When to use persistent flags:

- The option is cross-cutting and useful across many commands.
- Example: formatting, config path, environment selection, verbosity.

In this lesson:

- Local: `greetCmd.Flags().StringVar(&name, "name", "", "name to greet")`
- Persistent: `rootCmd.PersistentFlags().BoolVar(&jsonOutput, "json", false, "output as JSON")`

Usage examples:

- `go run . greet --name ada`
- `go run . --json greet --name ada`

### Step 8: Run and Verify

```bash
go run . --help
go run . version
go run . greet --name ada
go run . --json greet --name ada
go run . greet
```

First verification checkpoint:

- In `go run . --help`, confirm both `version` and `greet` appear under `Available Commands`.
- If `greet` is missing, check that `cmd/greet.go` contains `rootCmd.AddCommand(greetCmd)` inside `init()`.

Expected behavior:

- `--help` shows available commands
- `version` prints `mycli v0.1.0`
- `greet --name ada` prints `hello, ada`
- `--json greet --name ada` prints `{"message":"hello, ada"}`
- `greet` without `--name` returns `--name is required`

If you still see `unknown command`:

1. Run `go run . --help` and verify command list.
2. Check `cmd/greet.go` for `func init() { rootCmd.AddCommand(greetCmd) ... }`.
3. Confirm the file starts with `package cmd`.
4. Run `go run . greet --name ada` again.

## Beginner Mental Model

- `main.go`: starts app
- `root.go`: defines base CLI and execution
- `cmd/*.go`: each file defines one subcommand
- `init()` functions: register flags and attach commands

## You'll Know You're Successful When

- You can explain what `rootCmd` does
- Your CLI runs at least two subcommands
- Errors are clear and deterministic for invalid input
- Help output is readable for a first-time user

## Practice Tasks

1. Add a `sum` command with `--a` and `--b` integer flags.
2. Add a persistent `--json` flag in `root.go` and use it in one command.
3. Add command examples (`Example:` field) to improve `--help` output.

## Next Steps

- Reuse this `main.go` + `root.go` + `cmd/` structure in later Cardano-focused CLI lessons.
