const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../Ethereum/build/Factory.json');
const compiledCompaign = require('../Ethereum/build/Compaign.json');

let accounts;
let factory;
let compaignAddress;
let compaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();                          //assign

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
  .deploy({data: compiledFactory.bytecode})
  .send({from: accounts[0], gas: '1000000'});

  await factory.methods.createCompaign('100').send({
    from: accounts[0],
    gas: '1000000'
  });

  [compaignAddress] = await factory.methods.getDeployedCompaign().call();

  compaign = await new web3.eth.Contract(JSON.parse(compiledCompaign.interface), compaignAddress );

});

describe('Compaigns', () => {
  it('deploy the factory and compaign', async () => {

    assert.ok(factory.options.address);
    assert.ok(compaign.options.address);
  });

  it('I am compaign manager', async () =>{
      const manager = await compaign.methods.creator().call();
      assert.equal(accounts[0], manager);
  });

  it('allow people to contribute, and add them to approver', async ()=>{
    await compaign.methods.contribute().send({
        value: '200',
        from: accounts[1]
    });
    const isContributor = await compaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  it('Require a min contribution', async()=>{
    try{
      await compaign.methods.contribution().send({
        value: '5',
        from: accounts[1]
      })
      assert(false);
    }
    catch(err){
      assert(err);
    }
  });

  it('allow a manager to request payment',async()=>{
      await compaign.methods
      .createRequest('buy better','100',accounts[1])
      .send({
        from: accounts[0],
        gas: '1000000'
      });
      const request = await compaign.methods.requests(0).call();

      assert.equal('buy better', request.description);
  });
  it('process a request', async()=> {
      await compaign.methods.contribute().send({
        from: accounts[0],
        value: web3.utils.toWei('10', 'ether')
      });

      await compaign.methods
      .createRequest('A',web3.utils.toWei('5', 'ether'),accounts[1])
      .send({
        from: accounts[0],
        gas: '1000000'
      });
      await compaign.methods.approveRequest(0).send({
        from: accounts[0],
        gas: '1000000'
      });
      await compaign.methods.finalizeRequest(0).send({
        from: accounts[0],
        gas: '1000000'
      });

      let balance = await web3.eth.getBalance(accounts[1]);
      balance = web3.utils.fromWei(balance,'ether');
      balance = parseFloat(balance);
      console.log(balance);
      assert(balance > 104);
  });

});
