var http = require('http');
var dispatcher = require('httpdispatcher');
var nodegit = require('nodegit');
var ReadWriteLock = require('rwlock');
var fsp = require('fs-promise');
var path = require('path');
var _ = require('underscore');

var lock = new ReadWriteLock();

const PORT = 4286;

function handleRequest(request, response){
    try {
        dispatcher.dispatch(request, response);
    } catch (err) {
        console.log(err);
    }
}

function getProject(url) {
    return url.split('/')[1];
}
function getDataKey(url) {
    return url.split('/')[2];
}

function projectDir(projectName) {
    return path.resolve(__dirname, './repos/' + projectName);
}

function filePath(projectName, dataKey) {
    return path.resolve(projectDir(projectName), './' + dataKey);
}

dispatcher.onGet(/\/\w+\/\w+/, function(req, res) {
    var projectName = getProject(req.url);
    var dataKey = getDataKey(req.url);

    return fsp.exists(filePath(projectName, dataKey))
    .then(function(exists) {
        if (exists) {
            lock.readLock(projectName, function(release) {
                return fsp.readFile(filePath(projectName, dataKey))
                .then(function(data) {
                    release();
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(data);
                })
                .catch(function(err) {
                    release();
                    console.log(err);
                });
            });
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Data doesn\'t exist');
        }
    });

});

dispatcher.onGet(/\/\w+/, function(req, res) {
    var projectName = getProject(req.url);
    var projDir = projectDir(projectName);

    return fsp.exists(projDir)
    .then(function(exists) {
        if (exists) {
            return fsp.readdir(projDir)
            .then(function(files) {
                files = _.without(files,'.git');
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(files,null,2)); 
            });
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Data doesn\'t exist');
        }
    });
});

function buildRepo(projectName) {
    console.log("Building");
    return fsp.ensureDir(projectDir(projectName))
    .then(function(ret) {
        return nodegit.Repository.init(projectDir(projectName), 0);
    });
}

function checkRepo(projectName) {
    return fsp.exists(projectDir(projectName))
    .then( function (exists) {
        if (!exists) {
            return buildRepo(projectName);
        } else {
            return nodegit.Repository.open(projectDir(projectName));
        }
    });
}

dispatcher.onPost(/\/\w+\/\w+/, function(req, res) {
    var projectName = getProject(req.url);
    var dataKey = getDataKey(req.url);
    var repository, index;

    lock.writeLock(projectName, function(release) {
        //if there's no repo, make a repo
        checkRepo(projectName, dataKey)
        .then(function(repo) {
            repository = repo;

            //submit the data
            if (req.params && req.params.data) {
                var strData = req.params.data;
                try {
                    var obj = JSON.parse(req.params.data);
                    strData = JSON.stringify(obj, null, 2);
                } catch (e) {
                    console.log("Not a JSON string");
                    strData = req.params.data;
                }
                return fsp.writeFile(filePath(projectName, dataKey), strData)
                .catch(function(err) {
                    console.log(err);
                });
            }
        })
        .then(function() {
            return repository.refreshIndex();
        })
        .then(function(idx) {
            return idx.addByPath(dataKey);
        })
        .then(function() {
            return repository.getStatus({});
        })
        .then(function(st) {
            if (st.length > 0)
            {
                //commit
                var name = req.params.name || "No one";
                var email = req.params.email || "no@email.here";
                var message = req.params.message || "No commit message";
                var signature = nodegit.Signature.now(name, email);

                return repository.createCommitOnHead([dataKey], signature, signature, message)
                .catch(function(err) {
                    console.log(err);
                });
            }
        })
        .then(function() {
            release();
            res.writeHead(200);
            res.end();
        });
    });
});

dispatcher.onError(function(req, res) {
    console.log("404");
    res.writeHead(404);
    res.end();
});

var server = http.createServer(handleRequest);

server.listen(PORT, function() {
    console.log("Server listening on: http://localhost:%s", PORT);
});
