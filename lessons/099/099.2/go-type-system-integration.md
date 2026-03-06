# Work with Go's Type System to Make Program Parts Fit Together

In this lesson, you will use Go's type system to compose reliable code: concrete types for data shape, interfaces for behavior contracts, and generics for reusable logic without losing type safety.

## Prerequisites

- Go 1.21+
- Comfort with structs, methods, and basic interfaces

## What You Will Learn

1. How to choose between concrete types, interfaces, and generics
2. How to avoid common anti-patterns (over-interface, `any` everywhere)
3. How to design APIs that are easy to test and hard to misuse

## Core Design Rules

- Start concrete, abstract later when duplication or substitution is real
- Accept interfaces, return concrete types (most of the time)
- Keep interfaces small and behavior-focused
- Use generics for algorithm reuse, not as a replacement for domain modeling

## Step-by-Step Practice

### Step 1: Model Data with Structs

Prefer explicit structs for domain data:

```go
type UTxO struct {
    TxHash string
    Index  uint32
    Amount int64
}
```

This gives compile-time guarantees and self-documenting field names.

### Step 2: Extract Behavior with a Small Interface

Use an interface only when multiple implementations are expected or testing needs substitution:

```go
type UTxOLoader interface {
    Load(address string) ([]UTxO, error)
}
```

Avoid large "god interfaces" that bundle unrelated behavior.

### Step 3: Compose Dependencies Explicitly

Inject interfaces into services:

```go
type BalanceService struct {
    loader UTxOLoader
}

func (s BalanceService) Total(address string) (int64, error) {
    utxos, err := s.loader.Load(address)
    if err != nil {
        return 0, err
    }
    var total int64
    for _, u := range utxos {
        total += u.Amount
    }
    return total, nil
}
```

This makes testing straightforward without reflection or globals.

### Step 4: Apply Generics Where Reuse Is Real

Use generics for reusable transformations:

```go
func Map[T any, R any](in []T, fn func(T) R) []R {
    out := make([]R, len(in))
    for i, v := range in {
        out[i] = fn(v)
    }
    return out
}
```

Keep domain logic concrete unless generic behavior is clearly repeated.

### Step 5: Validate with Compiler-Driven Refactoring

When changing a type, rely on compile errors as a to-do list:

```bash
go test ./...
```

Treat compiler feedback as a migration guide, not an obstacle.

## Common Type-System Mistakes

- Returning interfaces unnecessarily instead of useful concrete types
- Using `interface{}`/`any` where a precise type is known
- Declaring interfaces in producer packages instead of consumer packages
- Adding generics where a plain function would be clearer

## You'll Know You're Successful When

- You can explain why each interface exists
- Your tests substitute dependencies without fragile mocks
- Type-related refactors are mostly compile-error guided
- Public APIs are concise and predictable

## Practice Tasks

1. Refactor one service from concrete dependency to a small interface and add a unit test with a fake implementation.
2. Replace one `any`-based helper with a generic function and explicit constraints.
3. Identify one oversized interface and split it into focused behavior contracts.

## Next Steps

- Continue to SLT 099.3 to apply the same design discipline in a multi-command CLI.
