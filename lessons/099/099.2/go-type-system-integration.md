# Work with Go's Type System to Make Program Parts Fit Together

In this lesson, you will use Go's type system to solve a real design problem: calculating the balance of a Cardano address from UTxOs. You will start with a simple concrete implementation, then improve it with an interface where substitution is useful, and finally use generics only where repeated logic actually exists.

## Prerequisites

- Go 1.21+
- Comfort with structs, methods, and basic interfaces

## What You Will Learn

1. When a concrete struct is the right choice
2. When an interface helps and when it does not
3. How dependency injection makes Go code easier to test
4. Where generics fit in a real Go codebase

## The Problem

Suppose you want to calculate the balance of a Cardano address.

That means:

1. Load UTxOs for an address
2. Sum their lovelace amounts
3. Keep the code easy to test

We will build one small system all the way through:

```text
Address -> Loader -> []UTxO -> BalanceService -> Total balance
```

## Step-by-Step Practice

### Step 1: Model Data with Structs

Start with a concrete struct for the domain data:

```go
type UTxO struct {
    TxHash string
    Index  uint32
    Amount int64
}
```

This is the job of a struct:

- describe the shape of real data
- give names to fields
- let the compiler catch incorrect usage

At this stage, a struct is better than `map[string]any` because the data has a known shape.

### Step 2: Start with a Concrete Dependency

Imagine you load UTxOs from Blockfrost:

```go
type BlockfrostLoader struct{}

func (b BlockfrostLoader) Load(address string) ([]UTxO, error) {
    // Call external API and decode response.
    return nil, nil
}
```

A first attempt at a balance service might look like this:

```go
type BalanceService struct {
    loader BlockfrostLoader
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

This works, but the dependency is very specific.

Problems:

- you cannot switch to another data source easily
- tests now depend on a real API unless you change the design
- the service knows more than it needs to know

### Step 3: Introduce an Interface When Behavior Needs to Vary

The service does not need "a Blockfrost client." It only needs "something that can load UTxOs."

That is a good reason to define a small interface:

```go
type UTxOLoader interface {
    Load(address string) ([]UTxO, error)
}
```

Now update the service:

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

This is better because `BalanceService` now depends on behavior, not one specific implementation.

Use this rule:

- If a component only needs one behavior, define a small interface for that behavior.
- If there is only one implementation and no testing benefit, stay concrete.

### Step 4: Use a Fake Implementation for Tests

Once the dependency is an interface, testing becomes simple:

```go
import "fmt"

type FakeLoader struct{}

func (f FakeLoader) Load(address string) ([]UTxO, error) {
    return []UTxO{
        {TxHash: "a", Index: 0, Amount: 10},
        {TxHash: "b", Index: 1, Amount: 20},
    }, nil
}
```

```go
func ExampleBalanceService_Total() {
    svc := BalanceService{loader: FakeLoader{}}

    total, err := svc.Total("addr_test1...")
    if err != nil {
        panic(err)
    }

    fmt.Println(total)
    // Output: 30
}
```

This is the practical value of the interface:

- the service is easier to test
- the loader can be swapped without rewriting the service
- the API of the service stayed small

### Step 5: Add Generics Only for Repeated Algorithms

Generics help when the algorithm is reusable across different types.

For example, if several domain types expose an amount, you can sum them with one helper:

```go
type AmountLike interface {
    AmountValue() int64
}

func SumAmounts[T AmountLike](items []T) int64 {
    var total int64
    for _, item := range items {
        total += item.AmountValue()
    }
    return total
}
```

This is more useful than a generic `Map` example because it stays close to the problem domain.

Use this rule:

- Use generics when one algorithm should work across multiple concrete types.
- Do not use generics to avoid naming your domain types.

### Step 6: Let the Compiler Guide Refactors

Suppose you rename `Amount` to `Lovelace` in `UTxO`.

Run:

```bash
go test ./...
```

The compiler will show you every place that still expects the old field name. In Go, type-system refactors are often safer because compile errors show you exactly what to fix next.

## Wrong vs Better

Concrete dependency when the behavior should vary:

```go
type BalanceService struct {
    loader BlockfrostLoader
}
```

Better:

```go
type BalanceService struct {
    loader UTxOLoader
}
```

Why the second version is better:

- `BalanceService` only depends on what it needs
- tests can use a fake loader
- production code can switch data sources later

## Common Type-System Mistakes

- Reaching for an interface before there is a real substitution need
- Using `any` when the shape of the data is already known
- Hiding domain data inside overly generic helpers
- Adding generics where one concrete function would be easier to read

Keep these rules in mind:

1. Use structs to model real data.
2. Use interfaces to describe needed behavior.
3. Keep interfaces small.
4. Use generics for repeated algorithms, not for basic domain modeling.
5. Start simple, then abstract only when the code gives you a reason.

## You'll Know You're Successful When

- You can explain why `UTxO` is a struct instead of `any`
- You can explain why `BalanceService` depends on `UTxOLoader`
- You can swap in a fake loader for tests without changing service code
- You can point to one real repeated algorithm before using generics

## Practice Tasks

1. Write a `BalanceService` that depends directly on `BlockfrostLoader`, then refactor it to depend on `UTxOLoader`.
2. Add a fake loader and verify the service returns the expected total without calling an API.
3. Find one helper in your codebase that uses `any` and replace it with either a concrete type or a generic constraint.

## Next Steps

- Continue to SLT 099.3 to apply the same design discipline in a multi-command CLI.
