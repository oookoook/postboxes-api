const AWS = require('aws-sdk');

const table = 'postboxes';
const index = 'lat-lon-index';
AWS.config.update({endpoint: 'https://dynamodb.eu-central-1.amazonaws.com', region: 'eu-central-1'});
const docClient = new AWS.DynamoDB.DocumentClient();

function prepareQueryDef(field, val, qd) {
    if(!qd) {
        qd = { updates: [], attrVals: {}};
    }
    var a = ':' + field.replace(/[_.]/g,'');
    qd.updates.push(`${field}=${a}`);
    qd.attrVals[a] = (val)  ? val : '?';
    return qd;
}

function get(id) {
    return new Promise(function(resolve, reject) {
        docClient.get({
            // params
            TableName : table,
            Key:{
                'id': id,
            }
            }
            , function(err, data) {
                if(err) {
                    console.log(err);
                    resolve(false);
                }
                resolve(data.Item);
            });
    })
};

function getExtent(specs) {
    return new Promise(function(resolve, reject) {
        var results = [];
        var params = {
            TableName : table,
            IndexName : index,
            ProjectionExpression:'id, lat, lon',
            FilterExpression: 'lat between :latmn and :latmx and lon between :lonmn and :lonmx',
            ExpressionAttributeValues: {
                ':latmn': parseFloat(specs.latMin),
                ':latmx': parseFloat(specs.latMax),
                ':lonmn': parseFloat(specs.lonMin),
                ':lonmx': parseFloat(specs.lonMax),
            }
        };

        const onScan = function(err, data) {
            if(err) {
                console.log(err);
                resolve(false);
            }
            
            data.Items.forEach(function(item) {
                results.push(item);
            });
            if (typeof data.LastEvaluatedKey != 'undefined') {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            } else {
                resolve(results);
            }
        }
        docClient.scan(params, onScan);
    });
}

function getExtentQuery(specs) {
    return new Promise(function(resolve, reject) {
        var ids = [];
        var params = {
            TableName : table,
            IndexName : index,
            ProjectionExpression:'id, lat, lon',
            KeyConditionExpression: 'lat between :latmn and :latmx and lon between :lonmn and :lonmx',
            ExpressionAttributeValues: {
                ':latmn': parseFloat(specs.latMin),
                ':latmx': parseFloat(specs.latMax),
                ':lonmn': parseFloat(specs.lonMin),
                ':lonmx': parseFloat(specs.lonMax),
            }
        };

        const onQuery = function(err, data) {
            if(err) {
                console.log(err);
                resolve(false);
            }
            
            data.Items.forEach(function(item) {
                ids.push(item.id);
            });
            if (typeof data.LastEvaluatedKey != 'undefined') {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onQuery);
            } else {
                resolve(ids);
            }
        }
        docClient.query(params, onQuery);
    });
}

module.exports = {
    prepareQueryDef,
    get,
    getExtent 
}