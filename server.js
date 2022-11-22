const SHA256 = require('crypto-js/sha256');
const e = require('express');
const Block = require('./block.js');
const Blockchain= require("./simpleChain.js");
const blockchain = new Blockchain();

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
        // this.validateBlockchain();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/api/block/:index", async (req, res) => {
            // Add your code here
            let block = await {...blockchain.getBlock(req.params.index)};
            res.send(block);
            console.log(block);
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.app.post("/api/block", async (req, res) => {
            
            if (req.body.data){
                let newBlockHeight = await blockchain.addBlock(new Block(req.body.data));
                // console.log("New height is " + newBlockHeight);
                console.log(blockchain.getBlock(newBlockHeight));
                res.send(blockchain.getBlock(newBlockHeight));

            }
            else {
                res.send("Please enter data to add a new block");
            }
        });
    }

    // validateBlockchain() {
    //     this.app.get("/api/validate", (req, res) => { 
    //         let currentBlock;
    //         let blockHash;
    //         let height;
    //         let errorLog = [];
    //         for (let i = 0; i < this.blocks.length; i++) {
    //             // Check if any block has been mutated or tempered with
    //             currentBlock = {...this.blocks[i]};
    //             blockHash = currentBlock.hash;
    //             height = currentBlock.height;
    //             currentBlock.hash = '';
    //             if (blockHash != SHA256(JSON.stringify(currentBlock)).toString()) {
    //                 errorLog.push(`Hash Error at Block #${height}`);
    //             }
    //             // Make sure the chain is valid
    //             if (i > 0 && this.blocks[i].previousBlockHash != this.blocks[i-1].hash) {
    //                 errorLog.push(`Chain Error at Block #${height}`);
    //             }
    //         }

    //         if (errorLog.length > 0) {
    //             // res.send(`Block errors = ${errorLog.length}\nBlocks: ${errorLog}`);
    //             res.send({errorLog});
    //         }
    //         else {
    //             res.send("No errors detected");
    //         }
    //     });
    // }

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    async initializeMockData() {
        let height = await blockchain.getBlockHeight();
        if (height === 0) {
            (function theLoop(i) {
                setTimeout(function () {
                    blockchain.addBlock(new Block("Block " + i)).then(() =>{
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
    blockchain.validateChain().then;
}, 2500)

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}