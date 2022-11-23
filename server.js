const SHA256 = require('crypto-js/sha256');
const e = require('express');
const Block = require('./block.js');
const Blockchain= require("./simpleChain.js");
const ugoChain = new Blockchain();

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
        this.app.get("/api/validate/chain", async (req, res) => {
            res.send(await ugoChain.validateChain());
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