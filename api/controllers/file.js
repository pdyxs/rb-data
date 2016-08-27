/**
 * Created by pdyxs on 27/08/2016.
 */
'use strict';

var util = require('util');
var Project = require('../../model/Project');
var File = require('../../model/File');

module.exports = {
  get_data: get_data,
  save_data: save_data
};

function get_data(req, res) {
  var project = new Project(req.swagger.params.project.value);
  project.ifexists()
    .then(function() {
      var file = new File(project, req.swagger.params.file.value);
      file.ifexists()
        .then(function() {
          file.readJSON().then(function(data) {
            res.json(data);
          });
        }, function () {
          res.status(404).end();
        })
    }, function () {
      res.status(404).end();
    });
}

function save_data(req, res) {
  var project = new Project(req.swagger.params.project.value);
  var file = new File(project, req.swagger.params.file.value);
  project.getOrCreate()
    .then(function() {
      var data = req.swagger.params.body.value.data;
      return file.writeJSON(data);
    })
    .then(function() {
      var message = req.swagger.params.body.value.message;
      var email = req.swagger.params.body.value.email;
      var name = req.swagger.params.body.value.name;
      return project.commit(message, name, email);
    })
    .then(function() {
      res.json({});
    });
}
