"use strict";

require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();

module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_API_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 5000000000 // Correct format (5 Gwei)

    }
  }
};
//# sourceMappingURL=hardhat.config.dev.js.map
