/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
// token creation 
const {jwtSign} = require('../src/utilities/authentication/helpers');

// before run the specific test file run the server
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

// after running the tests close the server
test.after.always((t) => {
  t.context.server.close();
});

// test the get request of general/statistics
// to pass the test the number of sources, the success value and the statuscode that the server returns is necessary
test('GET /statistics returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got('general/statistics');
  t.assert(body.success);
  t.is(statusCode, 200);
});


// test the get request of sources/sources
// using a token we expect statusCode 200 
test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});

// test the get request of dashboards/dashboards to test the authentication middleware  
// without using a token we expect statusCode 403
test('GET /dasboards returns correct response and status code without token', async (t) => {
  const {statusCode} = await t.context.got(`dashboards/dashboards`);
  t.is(statusCode, 403);
});

// test the get request of dashboards/dashboards to test the authentication middleware  
// without using a token we expect statusCode 403
test('GET /dasboards returns correct response and status code with token', async (t) => {
  const token = jwtSign({id: 2});
  const {body} = await t.context.got(`dashboards/dashboards?token=${token}`);
  t.assert(body.success);
});

// test the get request of general/test-url
// using the http://localhost:3000 test url
test('GET /general/test-url returns correct response and status code', async (t) => {
  const url = "http://localhost:3000";
  const {body, statusCode} = await t.context.got(`general/test-url?url=${url}`);
  t.is(body.status, 200);
  t.assert(body.active);
  t.is(statusCode, 200);

});

test('POST /users/create with empty body to test validation middleware', async (t) => {
  const body = await t.context.got.post(`users/create`).json();
  t.is(body.status, 400);
});

test('POST /users/create with body to test validation middleware', async (t) => {
const body = await t.context.got.post(`users/create`, {
  json: {"username":"maria","password":"12345","confirm":"12345","email":"adfa@adfa.com"}
}).json();
t.is(body.status, 409);
});

test('POST /dashboards/create-dashboard test dashboard routes', async (t) => {   
  const token = jwtSign({id: 3});
  const name = 'tester';
const body = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {
    json: {name}
  }).json();
  //if the dashboard already exists
  if (body.status) {
    t.is(body.status, 409);
  }
  //if dashboard doesn't exist 
  else {
    t.assert(body.success);
  }
});


test('POST /dashboards/delete-dashboard test dashboard routes', async (t) => {   
  const token = jwtSign({id: 3});
  const id = '63cd0cbb95333e63f4896781';
const body = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, {
    json: {id}
  }).json();

  //if the dashboard has not been found
  if (body.status) {
    t.is(body.status, 409);
  }
  //if dashboard deleted succesfully 
  else {
    t.assert(body.success);
  }
});

test('POST /dashboards/check-password test dashboard routes', async (t) => {   
  const token = jwtSign({id: 3});
  const id = '63cd0cbb95333e63f4896781';
  const password = 12345;
const body = await t.context.got.post(`dashboards/check-password?token=${token}`, {
    json: {id, password}
  }).json();

  //if the dashboard has not been found
  if (body.status) {
    t.is(body.status, 409);
  }
  //if dashboard deleted succesfully 
  else {
    t.assert(body.success);
  }
});