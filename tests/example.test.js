/* eslint-disable import/no-unresolved */
const test = require('ava').default;

// example tests

// simple that is passed always
test('Test to pass', (t) => {
  t.pass();
});

// simple addition function test
test('Test value', async (t) => {
  const a = 1;
  t.is(a + 1, 2);
});

const sum = (a, b) => a + b;

// sum of 2 numbers test
test('Sum of 2 numbers', (t) => {
  t.plan(2);
  t.pass('this assertion passed');
  t.is(sum(1, 2), 3);
});
