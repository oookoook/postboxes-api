const express = require('express');
const db = require('./db-service')
var cors = require('cors');

const app = express();
app.use(cors());

app.route('/postboxes/:id')
    .get(function(req, res) {
        db.get(req.params.id).then(item => res.send(item));
        
    });

app.route('/hello')
    .get(function(req, res) {
        res.send('Hello postboxes');
        
    });

app.route('/query/:latMin/:latMax/:lonMin/:lonMax/:certainity')
    .get(function(req, res) {
        console.log('Request received.');
        console.dir(req.params);
        db.getExtent(req.params).then(results => {
            console.log(`${results.length} results found.`);
            res.send(results)
        });
    });
   
module.exports = app;


