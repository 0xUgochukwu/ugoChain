const SHA256 = require('crypto-js/sha256');
const e = require('express');
const Block = require('./block.js');
const Blockchain= require("./ugoChain.js");
const ugoChain = new Blockchain();

// Include Level db helper functions
//Include LevelDB helper functions
const db = require('./leveldbfunctions.js');

// Import Helper Functions
const helper = require('./helper.js');
const help = new helper();

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
        this.blocks = [];
        this.initializeMockData();
        this.getBlockByIndex();
        this.postNewBlock();
        this.validateBlock();
        this.validateChain();
        this.requestValidation();
        this.validateMessageSignature();
        this.getStarByHash();
        this.getStarByAddress();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/api/block/:index", async (req, res) => {
            // Add your code here
            res.send(await ugoChain.getBlock(req.params.index));
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.app.post("/api/block", async (req, res) => {
            
            if (req.body.data){
                let newBlockHeight = await ugoChain.addBlock(new Block(req.body.data));
                // console.log("New height is " + newBlockHeight);
                
                res.send(await ugoChain.getBlock(newBlockHeight));

            }
            else if (req.body.star && req.body.address) {
                let star = JSON.parse(req.body.star);
                let address = req.body.address;
                // Check if address has a vaildated Signature
                try {
                    const validated = await db.isValidatedAddress(address);
                } catch (e) {
                    const data = {
                        respone: e
                    }
                    res.send(data);
                }

                try {
                    // Check if star has all the required fields
                    help.validStarData(star);

                    // Encode Story to Hex 
                    star.story = new Buffer.from(star.story).toString('hex');

                    // Check if the address has a validated signature in our mempool
                    if (await db.isValidatedAddress(address)) {
                        // Add the star to the blockchain
                        let newBlockHeight = await ugoChain.addBlock(new Block(star));
                        // console.log("New height is " + newBlockHeight);
                        console.log('The newly added block got height ' + newBlockHeight);

                        try {
                            // Remove the address from the mempool
                            await db.invalidateAddress(address);
                        } catch (e) {
                            console.log(e);
                        }

                        res.send(await ugoChain.getBlock(newBlockHeight));
                    }
                } catch (e) {
                    const data = {
                        response: e
                    }
                    res.send(data);
                }
            }
            else {
                res.send("Please enter data to add a new block");
            }
        });
    }

    // Validate a Block in the Blockchain 
    validateBlock() {
        this.app.get("/api/validate/block/:index", async (req, res) => {
            res.send(await ugoChain.validateBlock(req.params.index));
        })
    }

    // Validate the Blockchain
    validateChain() {
        this.app.get("/api/validate/ugochain", async (req, res) => {
            res.send(await ugoChain.validateChain());
        })
    }

    // Request Validation
    requestValidation() {
        this.app.post("/api/requestValidation", async (req, res) => {
            if (req.body.address){
                console.log("Requesting validation for " + req.body.address);

                let requestData = null;
                try {
                    requestData = await db.requestValidation(req.body.address);
                } catch (e) {
                    console.log("Caught exception - Wallet address not found");
                    requestData = await db.createRequest(address);
                }

                // Return the request data
                res.send(requestData);
            }
            else {
                res.send("Please enter an address to validate");
            }
        })
    }

    // Validate a Message Signature

    validateMessageSignature() {
        this.app.post("/api/message-signature/validate", async (req, res) => {
            if (req.body.address && req.body.signature) {

                let requestData = null;

                try {
                    requestData = await db.validateSignature(req.body.address, req.body.signature);
                } catch (e) {
                    requestData = 'Unable to verify signature. Session expired after 5 minutes. Re-start the process.'
                }

                res.send(requestData);
            }
            else {
                res.send("Please enter an address and signature to validate");
            }
        })
    }



    // Get Star by it's Block hash
    
    getStarByHash() {
        this.app.get("api/stars/:hash", async (req, res) => {
            const hash = req.params.hash ?
            encodeURIComponent(req.params.hash) :
            '0';

            console.log(hash);

            try {
                const starBlock = await ugoChain.getBlockByHash(hash);
                res.send(starBlock);
            } catch (e) {
                console.log('Block not found')
                res.send('Block not found');
            }
        })
    }

    // Get Star by the address that uploaded it
    getStarByAddress() {
        this.app.get("api/stars/:address", async (req, res) => {
            const address = req.params.address ?
            encodeURIComponent(req.params.address) :
            '0';

            console.log(address);

            try {
                const starBlock = await ugoChain.getBlockByAddress(address);
                res.send(starBlock);
            } catch (e) {
                console.log('Block not found')
                res.send('Block not found');
            }
        })
    }


    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    async initializeMockData() {
        let height = await ugoChain.getBlockHeight();
        if (height === 0) {
            (function theLoop(i) {
                setTimeout(function () {
                    ugoChain.addBlock(new Block("Block " + i)).then(() =>{
                        if (--i) theLoop(i);
                    })
                }, 100);
            })(20);
        }
    }

}


setTimeout(function () {
    console.log("-------");
    console.log("Validating chain");
    ugoChain.validateChain().then;
}, 2500)

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}