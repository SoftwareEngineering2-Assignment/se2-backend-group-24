/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');

const router = express.Router();

const Source = require('../models/source');

// This route retrieves all sources owned by the authenticated user
router.get('/sources',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.decoded;
      // Find all sources owned by the user with the retrieved ID
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(id)});
      // Map the retrieved sources into a new array containing only the necessary fields
      const sources = [];
      foundSources.forEach((s) => {
        sources.push({
          id: s._id,
          name: s.name,
          type: s.type,
          url: s.url,
          login: s.login,
          passcode: s.passcode,
          vhost: s.vhost,
          active: false
        });
      });

      return res.json({
        success: true,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  });

// Route to create a new source
router.post('/create-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {name, type, url, login, passcode, vhost} = req.body;
      const {id} = req.decoded;
      // Check if source with the same name already exists for the user
      const foundSource = await Source.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundSource) {
        return res.json({
          status: 409,
          message: 'A source with that name already exists.'
        });
      }
      // Create new source and save to database
      await new Source({
        name,
        type,
        url,
        login,
        passcode,
        vhost,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

// Route to update an existing source 
router.post('/change-source', 
  authorization,
  async (req, res, next) => {
    try {
      // Extract source details, source id, and user id from request body and decoded token
      const {id, name, type, url, login, passcode, vhost} = req.body;
      const foundSource = await Source.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      // If the source is not found, return an error response
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }

      // Check if another source with the same name exists for the user 
      const sameNameSources = await Source.findOne({_id: {$ne: mongoose.Types.ObjectId(id)}, owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (sameNameSources) {
        return res.json({
          status: 409,
          message: 'A source with the same name has been found.'
        });
      }

      // Update source details and save to database
      foundSource.name = name;
      foundSource.type = type;
      foundSource.url = url;
      foundSource.login = login;
      foundSource.passcode = passcode;
      foundSource.vhost = vhost;
      await foundSource.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

// Route to delete an existing source 
router.post('/delete-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;
      // Find the source by ID and owner, and remove it from the database
      const foundSource = await Source.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        // If the source is not found, return an error response
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      // Return a success response
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

// Get information about a source
router.post('/source',
  async (req, res, next) => {
    try {
      const {name, owner, user} = req.body;
      // Determine the user ID to use for finding the source
      const userId = (owner === 'self') ? user.id : owner;
      // Find the source by name and owner
      const foundSource = await Source.findOne({name, owner: mongoose.Types.ObjectId(userId)});
      if (!foundSource) {
        // If the source is not found, return an error response
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }

      // Construct an object with the relevant source information to return
      const source = {};
      source.type = foundSource.type;
      source.url = foundSource.url;
      source.login = foundSource.login;
      source.passcode = foundSource.passcode;
      source.vhost = foundSource.vhost;

      // Return a success response with the source information
      return res.json({
        success: true,
        source
      });
    } catch (err) {
      return next(err.body);
    }
  });

router.post('/check-sources',
  authorization,
  async (req, res, next) => {
    try {
      const {sources} = req.body;
      const {id} = req.decoded;

      const newSources = [];

      // loop through the sources array and check if each source exists in the database for the current user
      for (let i = 0; i < sources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await Source.findOne({name: sources[i], owner: mongoose.Types.ObjectId(id)});
        if (!result) {
          // if the source doesn't exist, add it to the newSources array
          newSources.push(sources[i]);
        }
      }

      // loop through the newSources array and create a new Source object for each new source
      for (let i = 0; i < newSources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Source({
          name: newSources[i],
          type: 'stomp',
          url: '',
          login: '',
          passcode: '',
          vhost: '',
          owner: mongoose.Types.ObjectId(id)
        }).save();
      } 
      
      // return a response with success and the newSources array
      return res.json({
        success: true,
        newSources
      });
    } catch (err) {
      return next(err.body);
    }
  });

module.exports = router;
