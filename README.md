# rb-data
An Arbitrary Data service for quickly starting new projects

rb-data is a simple server for starting web projects which involve users creating some sort of data, where the actual internals of that data are only important to the front-end. The intention is to allow developers to start working on such projects without the need to build a new server each time.

rb-data is not intended for production, but is(? will be? hopefully?) great for early projects and proof of concepts.

Current features:
* POST and GET for arbitrary data
* Automatic prettification of JSON data passed in
* A single server can be used for several projects
* Data is versioned (endpoints for retrieving version data not yet available)

Intended features:
* Version access, reverting etc.
* Make it a library to call, with configuration options, rather than an application to run
* User authentication
* Data ownership and Data sharing

## Usage
###To install
To use rb-data, you need git and node installed.
```
git clone https://github.com/pdyxs/rb-data.git
cd rb-data
npm install
```

###To run
```
node rb-data.js
```
Currently, rb-data runs on port 4286

###API
####GET
```
/<project>
```
returns a list of the data available in <project>

```
/<project>/<data>
```
Returns a piece of data

####POST
```
/<project>/<data>
```
pushes data to the server

Properties:
```
data: The data to be sent
name (optional): name associated with the commit
email (optional): email associated with the commit
message (optional): commit message
```

## Implementation Notes
The current implementation of rb-data creates and manages git repositories on the server. This is for a number of reasons:
* ease of development
* good versioning tools are inbuilt
* the ability to easily see, backup and move development data around

This means that anyone using this tool can place arbitrary data (including code) on your computer. I don't think I can stress enough how much this should never be used in production.
