/*
    Helper function to interact with LevelDB
 */

    const level = require('level');
    const chainDB = './chaindata';
    const db = level(chainDB);
    
    var exports = module.exports = {};
    
    //Add block
    exports.addBlock = function (key, value) {
        return new Promise(function (resolve, reject) {
            db.put(key, value, function (err) {
                if (err) reject('Block ' + key + ' submission failed', err);
                resolve('Added block ' + key + ' to the chain');
            })
        });
    
    
    };
    
    //get Block height
    exports.getMaxHeight = function () {
        return new Promise(function (resolve, reject) {
            let chainLength = 0;
            let keyStream = db.createKeyStream();
            keyStream.on('data', function (data) {
                chainLength += 1;
            })
                .on('error', function(err) {
                    reject(err);
                })
                .on('close', function () {
                    //When the stream is finished, return found max height.
                    resolve(chainLength);
                });
        });
    
    }
    
    
    //Get block
    exports.getBlock = function (key) {
        // key = key.toString()
        return new Promise(function (resolve, reject) {
            db.get(key, function (err, value) {
                if (err) reject('Block ' + key + ' not found!');
                // console.log('LEVEL Value = ' + value);
                // console.log("LEVEL " + typeof  value);
                // console.log("LEVEL " + typeof JSON.parse(value));
                resolve(value);//returns a string
            })
        })
    
    }