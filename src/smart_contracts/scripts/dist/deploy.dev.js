"use strict";

var hre = require("hardhat");

function main() {
  var Voting, voting;
  return regeneratorRuntime.async(function main$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(hre.ethers.getContractFactory("Voting"));

        case 2:
          Voting = _context.sent;
          _context.next = 5;
          return regeneratorRuntime.awrap(Voting.deploy());

        case 5:
          voting = _context.sent;
          _context.next = 8;
          return regeneratorRuntime.awrap(voting.waitForDeployment());

        case 8:
          // ✅ Correct function
          console.log("Voting contract deployed at:", voting.target); // ✅ Correct way to log the address

        case 9:
        case "end":
          return _context.stop();
      }
    }
  });
}

main()["catch"](function (error) {
  console.error(error);
  process.exitCode = 1;
});
//# sourceMappingURL=deploy.dev.js.map
