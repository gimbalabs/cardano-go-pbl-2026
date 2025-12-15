# Project Outline

This course is a prerequisite for the DNS CLI project...

A CLI and an API have a lot in common.

We can re-use 90% of the code we write in both CLI and API contexts.

In this course, we can use Blink Labs VPN as an example project. We will see how it used for both API and CLI functionality.


## Links
- Bursa: https://github.com/blinklabs-io/bursa - programmatic wallet functions
- Apollo: https://github.com/Salvionied/apollo - this is the tx-building library (e.g. the "Mesh" of Go)
- Adder: https://github.com/blinklabs-io/adder - indexer
    - Starter Kit: https://github.com/blinklabs-io/adder-library-starter-kit
- Cardano Up: https://github.com/blinklabs-io/cardano-up
- Cobra: https://github.com/spf13/cobra

note Andrew 15-12-25. I've been playing with Adder today and added some sample go code. 
A cool idea for a lesson could be for the user to create a listening event handler that searches for some particular text in a transaction metadata.
Then get them to submit a transaction with the matching text whilst their instance of Adder is running, which logs out/captures the transaction
