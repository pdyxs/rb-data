/**
 * Created by pdyxs on 27/08/2016.
 */
var _ = require('underscore');
var path = require('path');
var nodegit = require('nodegit');
var ReadWriteLock = require('rwlock');
var fsp = require('fs-promise');

function File(project, name) {
  this.project = project;
  this.name = name;
  this.filepath = project.dirpath + '/' + name;
}

File.prototype = {

  ifexists: function() {
    var path = this.filepath;
    return new Promise(function(resolve, reject) {
      fsp.exists(path)
        .then(function(exists) {
          if (exists) {
            resolve();
          } else {
            reject();
          }
        });
    });
  },

  exists: function() {
    return fsp.exists(this.filepath);
  },

  read: function() {
    return fsp.readFile(this.filepath);
  },

  readJSON: function() {
    return this.read().then(function(data) {
      return JSON.parse(data);
    })
  },

  write: function(data) {
    var t = this;
    return fsp.writeFile(this.filepath, data)
      .then(function() {
        return t.project.addFile(t.name);
      });
  },

  writeJSON: function(data) {
    var strData = data;
    try {
      var obj = JSON.parse(data);
      strData = JSON.stringify(obj, null, 2);
    } catch (e) {
      strData = data;
    }
    return this.write(strData);
  }
};

module.exports = File;