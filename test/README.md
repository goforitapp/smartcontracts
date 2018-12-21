Unit tests
----------

### The test network must

* support EVM snapshots
* return `require` messages as results of failed transactions

Ganache CLI v6.2.4+ fulfils these requirements.

*Note*, when running `solidity-coverage`, some tests will fail, because it uses its own test network which doesn't return `require` messages.

### To run the test suite

On a first terminal:

	node_modules/.bin/ganache-cli

On a second terminal:

	node_modules/.bin/truffle test --network ganache

### To run the coverage test

    node_modules/.bin/solidity-coverage

### To run the solidity linters

    node_modules/.bin/solhint contracts/*
    node_modules/.bin/solium -d contracts

