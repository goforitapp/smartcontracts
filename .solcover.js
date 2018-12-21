"use strict";

module.exports = {
    port: 8555,
    norpc: false,
    testrpcOptions: "",
    testCommand: "truffle test",
    copyPackages: ["openzeppelin-solidity"],
    skipFiles: ["Migrations.sol"],
    dir: ".",
    buildDirPath: "/build/contracts",
};

