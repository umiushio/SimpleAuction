const SimpleAuction = artifacts.require("SimpleAuction");

const biddingTime = 300;
const beneficiary = '0xbC70a8340C3Dc9dE1E70f873B730fF2b6053e0dF';
const reservePrice = 5000;
const certificateHash = 0;

module.exports = function (deployer) {
  deployer.deploy(SimpleAuction, biddingTime, beneficiary, reservePrice, certificateHash);
};
