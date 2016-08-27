/**
 * Created by pdyxs on 27/08/2016.
 */
const REPO_DIRECTORY = '../repos/';

var _ = require('underscore');
var path = require('path');
var nodegit = require('nodegit');
var ReadWriteLock = require('rwlock');
var fsp = require('fs-promise');
var File = require('./File');

function Project(name) {
  this.name = name;
  this.dirpath = path.resolve(__dirname, REPO_DIRECTORY + name);
  this.changedFiles = [];
}

Project.prototype = {
  /**
   * Assumes that the project exists
   * @returns {Promise.<TResult>}
   */
  list: function() {
    return fsp.readdir(this.dirpath)
      .then(function (files) {
        return _.without(files, '.git');
      });
  },
  
  exists: function() {
    return fsp.exists(this.dirpath);
  },

  ifexists: function() {
    var path = this.dirpath;
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
  
  addFile: function(filename) {
    this.changedFiles.push(filename);
    return this.repository.refreshIndex()
      .then(function(idx) {
        return idx.addByPath(filename);
      });
  },
  
  getOrCreate: function() {
    var t = this;
    return this.exists()
      .then(function(exists) {
        if (exists) {
          return nodegit.Repository.open(t.dirpath);
        } else {
          return t.create();
        }
      })
      .then(function(repository) {
        t.repository = repository;
      });
  },

  create: function() {
    var t = this;
    return fsp.ensureDir(this.dirpath)
    .then(function (ret) {
      return nodegit.Repository.init(t.dirpath, 0);
    });
  },

  commit: function(message, name, email) {
    var t = this;
    if (!this.repository) {
      return;
    }
    return this.repository.getStatus({})
      .then(function(status) {
        if (status.length > 0) {
          //commit
          var name = name || "No one";
          var email = email || "no@email.here";
          var message = message || "No commit message";
          var signature = nodegit.Signature.now(name, email);
          return t.repository.createCommitOnHead(t.changedFiles, signature, signature, message)
            .then(function() {
              t.changedFiles = [];
            })
            .catch(function (err) {
              console.log(err);
            });
        }
      });
  }
};

module.exports = Project;