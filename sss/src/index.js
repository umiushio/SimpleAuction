window.addEventListener('load', function() {
    if (!window.web3) {//用来判断你是否安装了metamask
      window.alert('Please install MetaMask first.');//如果没有会去提示你先去安装
      return;
    }
    if (!web3.eth.coinbase) {//这个是判断你有没有登录，coinbase是你此时选择的账号
      window.alert('Please activate MetaMask first.');
      return;
    }
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
       
        // Use the browser's ethereum provider
        web3.personal.sign(web3.fromUtf8("Hello from wanghui!"), web3.eth.coinbase, console.log);
    }
}