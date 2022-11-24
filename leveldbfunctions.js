/*
    Helper function to interact with LevelDB
 */

    const { Level } = require('level');
    const chainDB = './ugoChain';
    const db = new Level(chainDB, { valueEncoding: 'json' });

    // Create a Mempool to store requests seprately
    const mempoolDB = './chaindata/mempool';
    const mp = new Level(mempoolDB, { valueEncoding: 'json' });

    // Require Bitcoin Message
    const bitcoinMessage = require('bitcoinjs-message');

    // Define timeout
    const MINUTES = 5;

    
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
    exports.getMaxHeight = async function () {

        let chainLength = 0;
        try {
            for await (const {height, data} of db.iterator()) {
                chainLength += 1;
            }
          } catch (err) {
            console.error(err)
          }

          return chainLength;
          
    }

    // Create a new request
    exports.createRequest = async function (address) {
        return new Promise((resolve, reject) => {
            let timestamp = Date.now();
            let validationWindow = MINUTES * 60; //5 minutes
            let message = `${address}:${timestamp}:starRegistry`;

            let data = {
                "address": address,
                "requestTimeStamp": timestamp,
                "message": message,
                "validationWindow": validationWindow
            }
            // stringify data
            console.log('calling put')
            console.log(data.address);
            console.log(data)
            mp.put(address, JSON.stringify(data), function (err) {
                if (err) reject('Block ' + key + ' submission failed', err);
                resolve(data);
            })
        })
    }

    // validate a wallet address' signature

    exports.validateSignature = async function (address, signature) {
        return new Promise((resolve, reject) => {
            mp.get(address, (err, value) => {
                if (err){
                    if (err.type == 'NotFoundError') {
                        reject('Address not found in mempool');
                    }

                    reject("Error: "+ err);
                }

                value = JSON.parse(value);
                let xMinutes = MINUTES * 60 * 1000;
                let xMinutesBeforeNow = Date.now() - xMinutes;

                const isExpired = value.requestTimeStamp < xMinutesBeforeNow;

                let isValidMessage = false;

                if (isExpired) {
                    //if expired, restart process
                    value.validationWindow = 0
                    value.messageSignature = 'invalid'
                    console.log('Unable to verify signature. Session expired after ' + MINUTES + 'minutes.');

                    //delete junk data
                    mp.del(address, function (err) {
                        if(err) {
                            console.log('Error while deleting junk data')
                        }
                    });

                    reject('User session expired after 5 minutes');
                }
                else {
                    console.log("Message Signature is not expired");
                    value.validationWindow = Math.floor((value.requestTimeStamp - xMinutesBeforeNow) / 1000);
                    isValidMessage = bitcoinMessage.verify(value.message, address, signature);
                    value.messageSignature = isValidMessage ? 'valid' : 'invalid';

                    mp.put(address, JSON.stringify(value));
                    const returnData = {
                        registerStar: !isExpired && isValidMessage,
                        status: value
                    }

                    resolve(returnData);
                }
                
            })
        })
    }

    // Check if a wallet address is validated
    exports.isValidatedAddress = async function (address) {
        return new Promise(function (resolve, reject) {
            mp.get(address, function (err, value) {
                if (err) {
                    if (err.type == 'NotFoundError') {
                        reject('Address not found in mempool');
                    }
                    reject("Error: "+ err);
                }
                let value = JSON.parse(value);
                resolve(value.messageSignature === 'valid');
            })
        })
    }

    // Remove an Address from the mempool / Invalidate Address in the Mempool

    exports.invalidateAddress = async function(address) {
        return new Promise(function (resolve, reject) {

            //Invalidate initial request
            console.log('Invalidating request for ' + addr);
            mp.del(address, function (err) {
                if(err) {
                    console.log('Error while deleting junk data')
                    reject('Unable to invalidate request');
                }
                console.log('Record with address ' + addr + ' was deleted');
                resolve("Request invalidated");
            })


        });
    }
    
    
    //Get block
    exports.getBlock = function (key) {
        // key = key.toString()
        return new Promise((resolve, reject) => {
            db.get(key, function (err, value) {
                if (err) reject('Block ' + key + ' not found!');
                // console.log('LEVEL Value = ' + value);
                // console.log("LEVEL " + typeof  value);
                // console.log("LEVEL " + typeof JSON.parse(value));
                resolve(value);//returns a string
            })
        })
    
    }


    // Get Block by hash

    exports.getBlockByHash = function (hash) {
        return new Promise( async (resolve, reject) => {
            try {
                for await (const {height, data} of db.iterator()) {
                    console.log(data.key, '=', data.value)
                    block = JSON.parse(data.value);
                    if (hash === block.hash) {
                        console.log(block)
                        block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
                        resolve(block);
                    }
                }
              } catch (err) {
                console.error("Block not found\n Error: " + err);
                reject(err);
              }
        })
    }


    // Get Block by Address

    exports.getBlockByAddress = function (address) {
        return new Promise( async (resolve, reject) => {
            
            let blocks = [];

            try {
                for await (const {height, data} of db.iterator()) {
                    console.log(data.key, '=', data.value)
                    console.log('==================')

                    block = JSON.parse(data.value);
                    if (address === block.body.address) {
                        console.log(block)
                        block.body.star.storyDecoded = new Buffer.from(block.body.star.story, 'hex').toString();
                        // resolve(block);
                        blocks.push(block);
                        console.log('----------');
                    }
                }
              } catch (err) {
                console.log("Block not found\n Error: " + err);
                reject(err);
              }

              resolve(blocks);
        })
    }