import React, { Component } from "react";
import moment from 'moment';
import SimpleAuctionContract from "./contracts/SimpleAuction.json";
import getWeb3 from "./getWeb3";

import {PageHeader, Descriptions, Tag, Button, Card, Input, Space, Badge} from 'antd';
import {HourglassOutlined } from '@ant-design/icons'

import "./App.css";


const constractAdsress = '0x0C3391E244440Ef79DA7B523dbA76636479EDDae';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      web3: null, 
      accounts: null, 
      contract: null, 

      highestBid: 0,
      highestBidderHash: null,
      reserveBid: 0,
      beneficiary: null,
      beneficiaryHash: null,
      startTime: null,
      auctionEndTime: null,
      pendingReturn: 0,
      recruit: '',

      currentTime: null,
      remainTime: 0,
      value: '',

      ended: false,
      isPurchaseClicked: false,
      isWithdrawClicked: false,
      isAuctionEndClicked: false,
      isCheckTransationClicked: false,
      displayPurchase: true,
      displayAuctionEnd: false,
      showAuctionDetails: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleWithdraw = this.handleWithdraw.bind(this);
    this.handleAuctionEnd = this.handleAuctionEnd.bind(this);
    this.handlePendingReturn = this.handlePendingReturn.bind(this);
    this.handleCheckTransation = this.handleCheckTransation.bind(this);
  }

  componentDidMount = async () => {

    try {
      // Get network provider and web3 instance.
      let web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      let accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      let contract = new web3.eth.Contract(
        SimpleAuctionContract.abi,
        constractAdsress,
      );

      let beneficiary = await contract.methods.beneficiary().call();
      let beneficiaryHash = await web3.eth.accounts.hashMessage(beneficiary);
      let ended = await contract.methods.ended().call();

      this.setState({ended});

      if(accounts[0] === beneficiary && !this.state.ended) this.setState({displayAuctionEnd: true});
      if(accounts[0] === beneficiary || this.state.ended) this.setState({displayPurchase: false});
      let highestBid = await contract.methods.highestBid().call();
      highestBid = await web3.utils.fromWei(highestBid, 'ether');
      let highestBidder = await contract.methods.highestBidder().call();
      let highestBidderHash = await web3.eth.accounts.hashMessage(highestBidder);
      let reserveBid = await contract.methods.reserveBid().call();
      reserveBid = await web3.utils.fromWei(reserveBid, 'ether');
      let auctionEndTime = await contract.methods.auctionEndTime().call();
      let startTime = await contract.methods.startTime().call();
      let currentTime = moment().format('X');
      let pendingReturn = await contract.methods.getPendingReturn(accounts[0]).call();
      pendingReturn = await web3.utils.fromWei(pendingReturn, 'ether');

      if(auctionEndTime <= moment().format('X') && this.state.displayAuctionEnd) this.handleAuctionEnd();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ highestBid, highestBidderHash, reserveBid, web3, accounts, contract, beneficiary, 
        beneficiaryHash, startTime, auctionEndTime, currentTime, pendingReturn});
      this.setState({currentAccount: accounts});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
    this.timer = setInterval(function() {
      this.setState({currentTime: moment().format('X')});
      let remainTime = 0;
      if(this.state.auctionEndTime > this.state.currentTime) {
        remainTime = this.state.auctionEndTime - this.state.currentTime;
      } 
      this.setState({remainTime});
    }.bind(this), 1000);
  };


  formatTime(durationTime) {
    let o = moment.duration(durationTime, 'seconds');
    let str = '';
    if(o.hours() > 9) {
      str = str + o.hours() + ":" 
    } else if(o.hours() !== 0) {
      str = str + '0' + o.hours() + ":" 
    }
    if(o.minutes() > 9) {
      str = str + o.minutes() + ":" 
    } else {
      str = str + '0' + o.minutes() + ":" 
    }
    if(o.seconds() > 9) {
      str = str + o.seconds()
    } else {
      str = str + '0' + o.seconds(); 
    }
    return str;
  };

  handleTime = async(event) => {
    this.getCurrentTime();
    alert(this.state.currentTime);
  };

  handleChange(event) {
    this.setState({value: event.target.value});
  };

  handlePendingReturn = async(event) => {
    let {web3, contract} = this.state;
    let accounts = await web3.eth.getAccounts();
    let pendingReturn = await contract.methods.getPendingReturn(accounts[0]).call();
    pendingReturn = await web3.utils.fromWei(pendingReturn, 'ether');
    this.setState({accounts, pendingReturn});
  }

  handleWithdraw = async(event) => {
    this.setState({ isWithdrawClicked: true });
    const {accounts, contract } = this.state;
    var flag = false;
    try {
      flag = await contract.methods.withdraw().send({
          from: accounts[0],
          value: 0,
          gas: '3000000',
      })
      this.setState({ isWithdrawClicked: false });
    } catch (e) {
      console.log(e)
      alert('error')
      this.setState({ isWithdrawClicked: false })
    }
    if(flag) {
      alert('Withdraw Successfully');
    } else {
      alert('Withdraw failed');
    }
    window.location.reload()
  };

  handleAuctionEnd = async(event) => {
    this.setState({isAuctionEndClicked: true});
    const {contract, beneficiary, ended} = this.state;
    if(!ended){
    try {
        await contract.methods.auctionEnd().send({
          from: beneficiary,
          value: 0,
          gas: '3000000',
      });
        this.setState({ isAuctionEndClicked: false, displayAuctionEnd: false, ended: true});
        clearInterval(this.timer);
        alert('Auction End Successfully');
      } catch (e) {
        console.log(e)
        this.setState({ isAuctionEndClicked: false })
        alert('Auction End falied');
      }
      }
  };

  handleSubmit = async(event) => {
    if(this.state.ended) {
      alert('Auction has been over')
    } else {
      this.setState({isPurchaseClicked: true});
      let { web3, accounts, contract } = this.state;
      try {
          await contract.methods.bid().send({
              from: accounts[0],
              value: web3.utils.toWei(this.state.value, 'ether'),
              gas: '3000000',
          })
          alert('Purchase successfully');
          this.setState({ isPurchaseClicked: false });
        } catch (e) {
          this.setState({ isPurchaseClicked: false })
          alert('Purchase falied')
        }
        window.location.reload();
    }
  };

  handleCheckTransation = async() => {
    this.setState({isCheckTransationClicked: true});
    let {contract, accounts} = this.state;
    var recruit;
    try {
      recruit = await contract.methods.recruit().send({
        from: accounts[0],
        value: 0,
        gas: '3000000',
      }).call();
    } catch(e){
      console.log(e)
      this.setState({ isCheckTransationClicked: false })
      alert('Check Transation falied')
    }
    this.setState({recruit});
  }

  pageHeader() {
    let startTime = moment.unix(this.state.startTime).format("YYYY-MM-DD HH:mm:ss");
    let auctionEndTime = moment.unix(this.state.auctionEndTime).format("YYYY-MM-DD HH:mm:ss");
    return (
    <div className="site-page-header-ghost-wrapper">
    <PageHeader
      ghost={this.state.ended}
      title="Auction NFT"
      tags={<Tag color="blue">{this.state.ended?'Over':'Onging'}</Tag>}
      extra={[
        <Button key="3">Help</Button>,
        <Button key="2" onClick={() => {
          this.setState({showAuctionDetails: true});
        }}>Details</Button>,
        <Button key="1" type="primary" onClick={()=>{
          let accounts = this.state.web3.eth.getAccounts();
          if(accounts !== this.state.accounts) window.location.reload();
        }}>
          Login
        </Button>,
      ]}
    >
      <Descriptions size="small" column={4} bordered>
        <Descriptions.Item label="Auction Item">SSS</Descriptions.Item>
        <Descriptions.Item label="Item Type">Art</Descriptions.Item>
        <Descriptions.Item label="Creation Time">{startTime}</Descriptions.Item>
        <Descriptions.Item label="Effective Time">{auctionEndTime}</Descriptions.Item>
        <Descriptions.Item label="Seller" span={2}>
          {this.state.beneficiaryHash}
        </Descriptions.Item>
        <Descriptions.Item label="Remarks">
          sss
        </Descriptions.Item>
      </Descriptions>
    </PageHeader>
  </div>);
  }

  pageMessageCard() {

    return (
    <div className="message-card">
      <Card title="Auction Information">
        <Card type="inner" title="reserve Bid" >
          {this.state.reserveBid}
        </Card>
        <Card type="inner" title="Highest Bid" >
          {this.state.highestBid}
        </Card>
        <Card
          style={{ marginTop: 16 }}
          type="inner"
          title="Highest Bidder Hash"
        >
          {this.state.highestBidderHash}
        </Card>
      </Card>,
    </div>
    );
  }

  pageOperation() {
    var value = this.state.value;
    let minValue = this.state.reserveBid;
    if(this.state.highestBid > minValue) minValue = this.state.highestBid;
    
      

    return (
      <div className="operation-card">
        <Card title="Your operation">
          {//this.state.displayPurchase &&
            <Card type="inner" title="Bid">
              <form onSubmit={this.handleSubmit}> 
                <Space direction="vertical" align="center">
                  <Input type="text" allowClear onChange={this.handleChange} value={value}
                    placeholder = {minValue}
                    addonBefore="Your price: "
                    suffix="Ether"
                  ></Input>
                  <Space direction="horizontal" align="center">
                    <Input type="submit" disabled={!this.state.displayPurchase} value="Purchase" ></Input>
                    <Button type="primary" danger onClick={() => {
                      this.setState({value: ''});
                    }}>Reset</Button>
                  </Space>
                </Space>
              </form>
            </Card>
          }
          <Card type="inner" title="Withdraw">
            <Space direction="horizontal" align="center">
              <Button type="default" onClick={this.handlePendingReturn} > Query refund </Button>
              <Button type="primary" onClick={this.handleWithdraw} disabled={this.state.isWithdrawClicked}>Withdraw</Button>
            </Space>
          </Card>
          { this.state.displayAuctionEnd &&
            <Card type="inner" title="Auction End">
              <Button onClick={this.handleAuctionEnd} disabled={this.state.isAuctionEndClicked}>Auction End</Button>
            </Card>
          }
        </Card>
      </div>
    );
  }

  pagePendingReturn() {
    return (
      <div className="pending-return-card">
        <Card title="My Refund">
          <h3>{this.state.pendingReturn} ether</h3>
        </Card>
      </div>
    );
  }

  pageCountdown() {
    let flag = (this.state.remainTime !== 0)
    return (
      <div className="countdown-card">
        <Card title="Remain Time">
          <HourglassOutlined spin={flag} style={{ fontSize: '40px' }} />
          <h3>{this.formatTime(this.state.remainTime)}</h3>
        </Card>
      </div>
    );
  }

  pageAuctionDetails() {
    if(this.state.showAuctionDetails) { 
      var success, labelBid, labelBidder, labelLog;
      let {startTime, auctionEndTime, reserveBid, highestBid, pendingReturn, 
        beneficiaryHash, highestBidderHash, ended} = this.state;
      if(highestBid > 0) {
        success = "Yes";
      } else {
        success = "No";
      }
      if(ended) {
        labelBid = 'Winner Bid';
        labelBidder = 'Winner';
        labelLog = 'Auction End'
      } else {
        labelBid = 'Highest Bid';
        labelBidder = 'Highest Bidder';
        labelLog = '...'
      }
      return (
        <div className="auction-details-card">
          <Space direction="vertical">
            <Descriptions title="Auction Details" bordered>
              <Descriptions.Item label="Auction Item">SSS</Descriptions.Item>
              <Descriptions.Item label="Type">Art</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status="processing" text={this.state.ended?"Over":"Ongoing"} />
              </Descriptions.Item>
              <Descriptions.Item label="Start time">{moment.unix(startTime).format('YYYY-MM-DD HH-mm-ss')}</Descriptions.Item>
              <Descriptions.Item label="End Time">{moment.unix(auctionEndTime).format('YYYY-MM-DD HH-mm-ss')}</Descriptions.Item>
              <Descriptions.Item label="Auction Success">{success}</Descriptions.Item>
              <Descriptions.Item label="Reserve Bid">{reserveBid} ether</Descriptions.Item>
              <Descriptions.Item label={labelBid}>{highestBid} ether</Descriptions.Item>
              <Descriptions.Item label="Refund Bid">{pendingReturn} ether</Descriptions.Item>
              <Descriptions.Item label="Beneficiary" span={3}>{beneficiaryHash}</Descriptions.Item>
              <Descriptions.Item label={labelBidder} span={3}>{highestBidderHash}</Descriptions.Item>
              <Descriptions.Item label="Auction Log">
                {labelLog}
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
                ...
                <br />
              </Descriptions.Item>
            </Descriptions>
            <Space direction="horizontal">
              <Button type="default" onClick={this.handleWithdraw}>Withdraw</Button>
              <Button type="primary" onClick={() => {
                this.setState({showAuctionDetails: false});
              }}>Confirm</Button>
            </Space>
          </Space>
        </div>
      );
    } else {
      return (
        <Space align="center">
          { this.state.accounts === this.state.highestBidder &&
            <Button type="default" onClick={this.handleCheckTransation}>Check Transation</Button>
          }
        </Space>
      )
    }
  }

  pageContent() {
    if(this.state.showAuctionDetails) {
      return (
        this.pageAuctionDetails()
      );
      } else {
        return (
          <Space direction="horizontal" align="center">
            {this.pageMessageCard()}
            {this.pageOperation()}
            <div className="pending-and-countdown-card">
              {this.pagePendingReturn()}
              {this.pageCountdown()}
            </div>
          </Space>
        );
    }
  }
  

  pageInProgress() {
    return (
      <div className="App">
        {this.pageHeader()}
        {this.pageContent()}
      </div>
    );
  }

  pageOver() {
    return (
      <div className="App">
        {this.pageHeader()}
        {this.pageAuctionDetails()}
      </div>
    );
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if(this.state.ended) {
      return this.pageOver();
    } else {
      return this.pageInProgress();
    }
  }
}

export default App;
