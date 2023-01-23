/* eslint-disable no-console */
const {pipe, has, ifElse, assoc, identity, allPass, propEq} = require('ramda');

//  checks if the status code is 500 and that the enviroment of the aplliocation is production
//  if one or more of these conditions are false reuturns the message else it does nothing
const withFormatMessageForProduction = ifElse(
  allPass([propEq('status', 500), () => process.env.NODE_ENV === 'production']),
  assoc('message', 'Internal server error occurred.'),
  identity
);

module.exports = (error, res, ) => 
  /**
     * @name error
     * @description Middleware that handles errors
     */
  pipe(
    (e) => ({...e, message: e.message}),
    ifElse(has('status'), identity, assoc('status', 500)),
    withFormatMessageForProduction,
    (fError) => res.status(fError.status).json(fError)
  )(error);
