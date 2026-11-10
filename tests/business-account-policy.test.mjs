import test from 'node:test';import assert from 'node:assert/strict';import {OPERATING_ACCOUNT,assessMoneyAction,classifyBankActivity} from '../worker/lib/business-account-policy.js';
test('only masked account details stored',()=>assert.equal(OPERATING_ACCOUNT.last4,'8061'));
test('outgoing transfer requires founder approval',()=>assert.equal(assessMoneyAction({action:'payout',providerSupported:true,verifiedAccountLast4:'8061',beneficiaryVerified:true}).allowed,false));
test('approved transfer still requires supported provider and verified beneficiary',()=>assert.equal(assessMoneyAction({action:'payout',founderApproved:true,verifiedAccountLast4:'8061'}).allowed,false));
test('own-account transfer is not revenue',()=>assert.equal(classifyBankActivity({source:'collection',verifiedCustomerPayment:true,transferBetweenOwnAccounts:true}).revenue,false));
test('only verified customer payments count as revenue',()=>assert.equal(classifyBankActivity({source:'collection',verifiedCustomerPayment:true}).revenue,true));
