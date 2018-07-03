'use strict';

var _ = require('lodash');

var task = require('../models/task');
var project = require('../models/project');
var discussion = require('../models/discussion');
var office = require('../models/office');
var folder = require('../models/folder');
var document = require('../models/document');

var entityNameMap = {
  tasks: {
    controller: task,
  },
  projects: {
    controller: project,
  },
  discussions: {
    controller: discussion,
  },
  offices: {
    controller: office,
  },
  folders: {
    controller: folder,
  },
  officeDocuments: {
    controller: document,
  }
};

function boldUpdate(req, res, next) {
  console.log('boldUpdate');

  let {entity_id, user_id, entity_type, action} = req.body;
  let entityController = entityNameMap[entity_type].controller;
  console.log('PROBLEM entity_id: ', entity_id);

  entityController
    .findOne({
      _id: entity_id
    })
    .exec(function (err, entity) {
      if (err) return next(err);
      console.log('PROBLEM entity: ', entity);
      switch (action) {
        case 'viewed':
          console.log('action: ', action);

          goOverBoldedArray(entity, action, user_id);
          break;

        case 'updated':
          console.log('updated: ', action);

          syncBoldUsers(
            {
              body: entity,
              controller: entityController,
              actionType: 'update'
            });
          goOverBoldedArray(entity, action, user_id);
          break;
      }
      res.status(200).send(entity);
    });
}

function syncBoldUsers(req, res, next) {
  console.log('syncBoldUsers');

  let entity = req.locals.result || req;

  if(!entity){
    next();
  }
  console.log('req.locals.data.entityName: ', req.locals.data.entityName);
  let entityController = req.controller || entityNameMap[req.locals.data.entityName].controller;

  let actionType = req.actionType || 'created';

  switch (actionType) {

    case 'created':
      console.log('created: ', actionType);
      console.log('entity: ', entity);
      console.log('entity._id: ', entity._id);
      // console.log('req.body: ',req.body);

      entity.bolded = [];
      entity.bolded.push(createBoldedObject(entity.creator));
      console.log('createBoldedObject(entity.creator): ', createBoldedObject(entity.creator));
      console.log('entity.bolded: ', entity.bolded);

      let data = {$set: {bolded: entity.bolded}};
      saveEntity(entityController, entity, data);

      next();
      break;

    case 'updated':
      console.log('updated: ', actionType);

      data = {$set: {bolded: compareWatchers(entity)}};
      console.log('entityController: ',entityController);
      saveEntity(entityController, entity, data);
      next();
      break;
  }
}

function saveEntity(entityController, entity, data){
  console.log('saveEntity');
  console.log('find id: ',entity._id);
  entityController.findOneAndUpdate({_id: entity._id}, data,
    function (err, updatedEntity) {
      if (err) {
        req.locals.error = err;
      }
      console.log('updatedEntity: ', updatedEntity);
    });
}

function goOverBoldedArray(entity, action, user_id) {
  console.log('goOverBoldedArray');
  console.log('entity: ', entity);
  console.log('user_id: ', user_id);

  for (let i = 0; i < entity.bolded.length; i++) {
    if (action === 'updated') {
      console.log('action: ', action);
      entity.bolded[i].bolded = true;
    }
    console.log('bolded: ', entity.bolded[i].id);
    console.log('user_id: ', user_id);
    if (entity.bolded[i].id == user_id) {
      entity.bolded[i] = changeBolded(entity.bolded[i], false)
    }
  }
}

function compareWatchers(entity) {
  console.log('compareWatchers');

  for (let i = 0; i < entity.length; i++) {
    let bolded = entity.bolded.find((bolded) => {
      return entity.watchers[i]._id === bolded.id;
    });
    if (!bolded) {
      entity.bolded.push(createBoldedObject(entity.watchers[i]._id || entity.watchers[i]));
    }
  }
  return entity.bolded;
}

function changeBolded(boldedObject, type) {
  console.log('changeBolded');

  boldedObject.bolded = type;
  boldedObject.lastViewed = Date.now();
  return boldedObject;
}

function createBoldedObject(userId) {
  console.log('createBoldedObject');

  return {
    id: userId,
    bolded: false,
    lastViewed: Date.now(),
  }
}

module.exports = {
  boldUpdate: boldUpdate,
  syncBoldUsers: syncBoldUsers,
};
