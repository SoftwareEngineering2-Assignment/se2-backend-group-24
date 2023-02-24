const express = require('express');
const {validation, authorization} = require('../middlewares');
const {helpers: {jwtSign}} = require('../utilities/authentication');

const {mailer: {mail, send}} = require('../utilities');

const router = express.Router();

const User = require('../models/user');
const Reset = require('../models/reset');

// Define a POST request handler for '/create' endpoint
router.post('/create',
  (req, res, next) => validation(req, res, next, 'register'),
  //Αsynchronous function to create a new user based on the request body
  async (req, res, next) => {
    const {username, password, email} = req.body;
    try {
      // Check if a user with the given username or email already exists
      const user = await User.findOne({$or: [{username}, {email}]});
      // If a user with the given username or email already exists, return an error response
      if (user) {
        return res.json({
          status: 409,
          message: 'Registration Error: A user with that e-mail or username already exists.'
        });
      }
      // If a user with the given username or email does not exist, create a new user and save it to the database
      const newUser = await new User({
        username,
        password,
        email
      }).save();
      // Return a success response with the ID of the newly created user
      return res.json({success: true, id: newUser._id});
    } catch (error) {
      return next(error);
    }
  });

// Define a POST request handler for '/authenticate' endpoint
router.post('/authenticate',
  (req, res, next) => validation(req, res, next, 'authenticate'),
  //Αsynchronous function to authenticate a user based on the request body
  async (req, res, next) => {
    const {username, password} = req.body;
    try {
      // Find a user with the given username and retrieve their hashed password from the database      
      const user = await User.findOne({username}).select('+password');
      // If a user with the given username does not exist, return an error response
      if (!user) {
        return res.json({
          status: 401,
          message: 'Authentication Error: User not found.'
        });
      }
      // Compare the hashed password from the database with the password provided in the request body      
      if (!user.comparePassword(password, user.password)) {
        return res.json({
          status: 401,
          message: 'Authentication Error: Password does not match!'
        });
      }
      // If the password is correct, generate a JSON Web Token (JWT) and return it along with the user information
      return res.json({
        user: {
          username, 
          id: user._id, 
          email: user.email
        },
        token: jwtSign({username, id: user._id, email: user.email})
      });
    } catch (error) {
      return next(error);
    }
  });

// Define a POST request handler for '/resetpassword' endpoint
router.post('/resetpassword',
  (req, res, next) => validation(req, res, next, 'request'),
  // Define an asynchronous function to reset the password for a user based on the request body
  async (req, res, next) => {
    const {username} = req.body;
    try {
      // Find a user with the given username in the database
      const user = await User.findOne({username});
      // If a user with the given username does not exist, return an error response
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // Generate a JSON Web Token (JWT) containing the username
      const token = jwtSign({username});
      // Remove any existing reset token for the user from the database, if present
      await Reset.findOneAndRemove({username});
      // Save a new reset token for the user in the database
      await new Reset({
        username,
        token,
      }).save();
      // Generate an email containing the reset token and send it to the user's email address
      const email = mail(token);
      send(user.email, 'Forgot Password', email);
      // Return a success response indicating that the reset password email has been sent
      return res.json({
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
    } catch (error) {
      return next(error);
    }
  });

// Define a POST request handler for '/changepassword' endpoint
router.post('/changepassword',
  // Call a function named 'validation' to validate the request body against the 'change' schema
  (req, res, next) => validation(req, res, next, 'change'),
  authorization,
  // Define an asynchronous function to change the password for a user based on the request body
  async (req, res, next) => {
    const {password} = req.body;
    const {username} = req.decoded;
    try {
      // Find a user with the given username in the database
      const user = await User.findOne({username});
      // If a user with the given username does not exist, return an error response
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // Find and remove the reset token for the user from the database, if present
      const reset = await Reset.findOneAndRemove({username});
      // If a reset token for the user does not exist, return an error response
      if (!reset) {
        return res.json({
          status: 410,
          message: ' Resource Error: Reset token has expired.'
        });
      }
      // Update the user's password with the new password and save the changes to the database
      user.password = password;
      await user.save();
      // Return a success response indicating that the password has been changed
      return res.json({
        ok: true,
        message: 'Password was changed.'
      });
    } catch (error) {
      return next(error);
    }
  });

module.exports = router;
