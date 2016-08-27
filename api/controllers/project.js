/**
 * Created by pdyxs on 27/08/2016.
 */
'use strict';

var util = require('util');
var Project = require('./../../model/Project');

module.exports = {
  list_files: list_files
};

function list_files(req, res) {
  var project = new Project(req.swagger.params.project.value);
  project.ifexists()
    .then(function() {
      project.list().then(function(files) {
        res.json(files);
      });
    }, function() {
      res.json([]);
    });
}
