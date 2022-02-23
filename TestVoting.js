const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require('Voting');

contract('Voting', function (accounts) {
const owner = accounts[0];
const voter1 = accounts[1];
const voter2 = accounts[2];
const voter3 = accounts[3];
const acc3 = accounts[3];
const zero = new BN(0);
const one = new BN(1);
const two = new BN(2);
const Prop1 = "Here is my proposal1";
const Prop2 = "Here is my proposal2";

 beforeEach(async function () {
  this.VotingInstance = await Voting.new({from: owner});
 });

 it('checks the owner', async function (){
   let foundOwner = await this.VotingInstance.owner();
   expect(foundOwner).to.be.equal(owner);
 });


 it("checks initial status is 0", async function (){
  const jsstatus = await this.VotingInstance.status();
  assert.equal(jsstatus, 0, 'test failed'); 
 });

 it("checks only owner can change status", async function (){
  await expectRevert(this.VotingInstance.changeStatus(1,{from: voter1}), 'only owner can change status');
 });


 it("checks the owner can put the status to the next one and no other - 70 tests involved", async function (){
   for (let step = 0; step < 10; step++) { //6
     for (let step2 = step+2 ; step2 < step+8; step2++){
      if(step2 == step+7) {
      change = await this.VotingInstance.changeStatus(step2 %6,{from: owner}); 
      let afterStatus = await this.VotingInstance.status() ;
      assert.equal(afterStatus, step2 %6, 'we have a problem');  
      } 
      else {
     await expectRevert(this.VotingInstance.changeStatus(step2 %6,{from:owner}), 'wrong step');
 }}};  
 });

it("checks event emission when the owner put the status to the next one - 20 tests involved", async function (){
 for (let step = 1; step < 21; step++) {
  let change = await this.VotingInstance.changeStatus(step %6,{from: owner});
  STEP = new BN(step %6); STEP_ = new BN((step+5) %6);
  let afterStatus = await this.VotingInstance.status();
  expectEvent(change, 'WorkflowStatusChange', {
  previousStatus: STEP_,
  newStatus: STEP ,
 });}; 
  //change =  await this.VotingInstance.changeStatus(0,{from: owner});
  //let afterStatus4 = await this.VotingInstance.status();
  //expectEvent(change, 'WorkflowStatusChange', {
  //previousStatus: new BN(5),
  //newStatus: zero ,
 //});
});

 it("checks the owner can register voters and corresponding event is emitted", async function () {
  
  let Reg1 = await this.VotingInstance.Register(voter1, {from: owner});
  let Reg2 = await this.VotingInstance.Register(voter2, {from: owner});
  let profile1 = await this.VotingInstance.profil.call(voter1) ; 
  let bool1 = await profile1.isRegistered ;
  let profile2 = await this.VotingInstance.profil.call(voter2) ; 
  let bool2 = await profile2.isRegistered ;
  
  expect(bool1).to.be.true ;
  expect(bool2).to.be.true ;
  expectEvent(Reg1, 'VoterRegistered', {
  voterAddress: voter1 ,
  });
  expectEvent(Reg2, 'VoterRegistered', {
  voterAddress: voter2 ,
  });
 });
 
 it("checks that accounts 1,2,3 can't register accounts 0,1,2,3 with accounts 1,2 being registered - 12 tests involved", async function () {
  
  await this.VotingInstance.Register(voter1, {from: owner});
  await this.VotingInstance.Register(voter2, {from: owner});
  for (i=0 ; i<4 ; i++) {
   for (j=1 ; j<4 ; j++){
    await expectRevert(this.VotingInstance.Register(accounts[i],{from: accounts[j]}), 'only owner can register voters');
   }}
 });

 it("checks that registered voters can submit proposals - triggering events - and that unregistered cannot" , async function () { 
  
  await this.VotingInstance.Register(voter1, {from: owner});
  await this.VotingInstance.Register(voter2, {from: owner});
  await this.VotingInstance.changeStatus(1);
  let RegProp1 = await this.VotingInstance.RegisterProposal('Here is my proposal1', {from: voter1});
  let RegProp2 = await this.VotingInstance.RegisterProposal('Here is my proposal2', {from: voter2});
   
  let props = await this.VotingInstance.propositions.call ;
  let prop1 = await props(0); // props(0)[0] déconne et (props(0))[0] aussi alors qu'en Solidity props[0][0] et (props[0])[0] marchent
  let prop2 = await props(1);
  let descrProp1 = await prop1[0];
  let descrProp2 = await prop2[0];
  let initVC = await prop1[1];
  
  expect(descrProp1).to.equal(Prop1);
  expect(descrProp2).to.equal(Prop2); 
  expectEvent(RegProp1, 'ProposalRegistered', { proposalId: one}); 
  expectEvent(RegProp2, 'ProposalRegistered'); 
  expect (initVC).to.be.bignumber.equal(zero); 
  await expectRevert(this.VotingInstance.RegisterProposal('Here is my prop',{from: owner}), 'you are not registered');
  await expectRevert(this.VotingInstance.RegisterProposal('Here is my prop',{from: accounts[3]}), 'you are not registered');
 });

 it("cheks that registered voters can vote once when voting session is open, not before, triggering events and increasing voteCount", async function () {

  await this.VotingInstance.Register(voter1, {from: owner});
  await this.VotingInstance.Register(voter2, {from: owner});
  await this.VotingInstance.Register(voter3, {from: owner});
  await this.VotingInstance.changeStatus(1);
  await this.VotingInstance.RegisterProposal('Here is my proposal1', {from: voter1});
  await this.VotingInstance.RegisterProposal('Here is my proposal2', {from: voter2});
  await this.VotingInstance.changeStatus(2);

  await expectRevert(this.VotingInstance.RegisterVote(1), 'you are not registered');
  await expectRevert(this.VotingInstance.RegisterVote(1, {from: voter1}), 'this is no time for vote');
  await this.VotingInstance.changeStatus(3);

  let Vote1 = await this.VotingInstance.RegisterVote(1, {from: voter3});
  let Vote2 = await  this.VotingInstance.RegisterVote(2, {from: voter1});
  let Vote3 = await  this.VotingInstance.RegisterVote(1, {from: voter2});
  let props = await this.VotingInstance.propositions.call ;
  let prop1 = await props(0); 
  let prop2 = await props(1);
  let voteCount1 = await prop1[1];
  let voteCount2 = await prop2[1];

  await expectRevert(this.VotingInstance.RegisterVote(2, {from: voter3}), 'you have already voted');
  await expectEvent(Vote1, 'Voted', {
  voter: voter3,
  proposalId: one ,
  });
  await expectEvent(Vote2, 'Voted', {
  voter: voter1,
  proposalId: two ,
  });
  await expectEvent(Vote3, 'Voted', {
  voter: voter2,
  proposalId: one ,
  });
  expect(voteCount1).to.be.bignumber.equal(two); 
  expect(voteCount2).to.be.bignumber.equal(one);
 });

 it("cheks the list of winners", async function () {

  await this.VotingInstance.Register(voter1, {from: owner});
  await this.VotingInstance.Register(voter2, {from: owner});
  await this.VotingInstance.Register(voter3, {from: owner});
  await this.VotingInstance.changeStatus(1);
  await this.VotingInstance.RegisterProposal('Here is my proposal1', {from: voter1});
  await this.VotingInstance.RegisterProposal('Here is my proposal2', {from: voter2});
  await this.VotingInstance.changeStatus(2);
  await this.VotingInstance.changeStatus(3);
  await this.VotingInstance.RegisterVote(2, {from: voter3});
  await this.VotingInstance.RegisterVote(1, {from: voter1});
  await this.VotingInstance.changeStatus(4);

  let Win0 = await this.VotingInstance.Winners;
  expectRevert(this.VotingInstance.getWinner({from: owner}),'this is no time for getting winner');

  await this.VotingInstance.changeStatus(5);

  let Win = await this.VotingInstance.Winners;
  let win1 = await Win(0);
  let win2 = await Win(1);
  let getWin = await this.VotingInstance.getWinner({from: accounts[8]});
  
  expect(getWin[0]).to.be.bignumber.equal(win1);
  expect(getWin[1]).to.be.bignumber.equal(win2);
  expect(win1).to.be.bignumber.equal(two); 
  expect(win2).to.be.bignumber.equal(one);

       
 });


});

