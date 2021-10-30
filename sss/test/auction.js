const SimpleAuction = artifacts.require("SimpleAuction");

const biddingTime = 10;
const beneficiary = '0x59111832f2B4E708b2D44b289Ba5563EE8CC31cD';

contract("SimpleAuction", async => {
  it("process", async () => {
    let instance = await SimpleAuction.new(biddingTime, beneficiary);
    let accounts = await web3.eth.getAccounts();
    let bid = await instance.highestBid.call();
    let bidder = await instance.highestBidder.call();
    console.log("beneficiary: ", beneficiary);
    console.log("higestBid: ", bid);
    console.log("higestBidder: ", bidder);
    let balance0 = await web3.eth.getBalance(accounts[0]);
    let balance1 = await web3.eth.getBalance(accounts[1]);
    console.log("accounts[0]'s balance: ", balance0);
    console.log("accounts[5]'s balance: ", balance1);

    await instance.bid({from: accounts[0], value: web3.utils.toWei('2', 'ether')});
    bid = await instance.highestBid.call();
    bidder = await instance.highestBidder.call();
    console.log("higestBid: ", bid);
    console.log("higestBidder: ", bidder);
    balance0 = await web3.eth.getBalance(accounts[0]);
    console.log("accounts[0]'s balance: ", balance0);

    await instance.bid({from: accounts[5], value: web3.utils.toWei('5', 'ether')});
    await instance.withdraw({from:accounts[0]});
    balance1 = await web3.eth.getBalance(accounts[1]);
    console.log("accounts[5]'s balance: ", balance1);
    bid = await instance.highestBid.call();
    bidder = await instance.highestBidder.call();
    console.log("higestBid: ", bid);
    console.log("higestBidder: ", bidder);
    balance0 = await web3.eth.getBalance(accounts[0]);
    console.log("accounts[0]'s balance: ", balance0);
    let ended = false;
    while(!ended){
        try {
            await instance.auctionEnd();
            ended = true;
        } catch(error){
            
        }
    }
    console.log("auction end");
  });

});