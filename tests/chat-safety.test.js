const test = require('node:test');
const assert = require('node:assert/strict');
const { rwChatRisk } = require('../js/social/chat-safety.js');

test('flags money and credential asks', () => {
  assert.match(rwChatRisk('bro just tell me the OTP you got'), /OTP/);
  assert.match(rwChatRisk('pay me at rahul.k@okaxis'), /UPI/);
  assert.match(rwChatRisk('IFSC HDFC0001234 account number 1234'), /bank/);
  assert.match(rwChatRisk('send the advance amount today'), /money/);
  assert.match(rwChatRisk('use this link rzp.io/l/abc'), /payment link/);
});

test('leaves normal trip talk alone', () => {
  for(const t of ['see you at 6am at Dhangadi gate', 'can we pay for dinner tonight together?', 'my email is a@b.com', 'otpless? no idea', '']){
    assert.equal(rwChatRisk(t), '', t);
  }
});
