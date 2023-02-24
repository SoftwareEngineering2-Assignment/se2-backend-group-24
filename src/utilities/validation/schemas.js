const {isNil} = require('ramda');

const yup = require('yup');
const {min} = require('./constants');

const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

const username = yup
  .string()
  .trim();

const password = yup
  .string()
  .trim()
  .min(min);

//make the username required
const request = yup.object().shape({username: username.required()});

// User authentication data is valid
const authenticate = yup.object().shape({
    username: username.required(),
    password: password.required()
  });

// register required data
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

// required data for update and checks of the parameters
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

// makes password required for change
const change = yup.object().shape({password: password.required()});

module.exports = {
  authenticate, register, request, change, update
};
