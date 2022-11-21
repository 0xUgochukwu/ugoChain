//Include LevelDB helper functions
const l_DB = require('./leveldbfunctions.js');

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
    constructor(data) {
        this.hash = "",
            this.height = 0,
            this.body = data,
            this.time = 0,
            this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
    constructor() {
        this.getBlockHeight().then( height => {
            // console.log("Constructor height is " + height);
            if (height === 0) {
                // this.addBlock(new Block("Genesis Block")).then(() => console.log("Genesis Block created."))
                this.addBlock(new Block("Genesis block")).then(() => console.log("Genesis block created."))
            }
        })

    }

    // Add new block
    async addBlock(newBlock) {

        //get max height
        let chainLength = await l_DB.getMaxHeight();

        // Block height
        newBlock.height = chainLength;

        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0, -3);

        // previous block hash (Do not look for hash if Genesis block
        if (chainLength > 0) {
            let previousBlockHeight = parseInt(chainLength, 10) - parseInt(1, 10);
            const previousBlock = JSON.parse(await l_DB.getBlock(previousBlockHeight));
            newBlock.previousBlockHash = previousBlock.hash;
        }

        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        await l_DB.addBlock(newBlock.height, JSON.stringify(newBlock));

        console.log("Added Block #" + newBlock.height + " w/ hash " + newBlock.hash + " (previous hash: " + newBlock.previousBlockHash + ")");
    }

    // Get block height
    async getBlockHeight() {
        return JSON.parse(await l_DB.getMaxHeight());
    }

    // get block
    async getBlock(blockHeight) {
        // retrieve data from levelDB
        let retVal = await l_DB.getBlock(blockHeight)
        console.log(retVal);
        return JSON.parse(retVal);
    }

    // validate block
    async validateBlock(blockHeight) {

        // get block object
        let block = JSON.parse(await l_DB.getBlock(blockHeight));

        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // console.log("Hashes: " + blockHash + " <> " + validBlockHash);

        // Compare
        if (blockHash === validBlockHash) {
            return true;
        } else {
            console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
            return false;
        }
    }

    // Validate blockchain
    async validateChain() {
        let chainLength = await l_DB.getMaxHeight();
        chainLength = parseInt(chainLength, 10);

        let errorLog = [];

        for (let i = 0; i < (chainLength - 1); i++) {
            let curBlo = i.toString()
            let nextBlo = (i + 1).toString()

            // validate block
            if (!this.validateBlock(i)) errorLog.push(i);

            //getcurrent block and previous block
            let currentBlock = JSON.parse(await l_DB.getBlock(curBlo));
            let nextBlock = JSON.parse(await l_DB.getBlock(nextBlo));

            let blockHash = currentBlock.hash;
            let previousHash = nextBlock.previousBlockHash;

            if (blockHash !== previousHash) {
                errorLog.push(i);
            }
        }

        if (errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: ' + errorLog);
        } else {
            console.log('No errors detected');
        }
    }
}


//Create Blockchain instance
let blockchain = new Blockchain();

//Add 20 blocks
(function theLoop(i) {
    setTimeout(function () {
        blockchain.addBlock(new Block("Block " + i)).then(() =>{
            if (--i) theLoop(i);
        })
    }, 100);
})(20);

//Validate chain

setTimeout(function () {
    console.log("-------");
    console.log("Validating chain");
    blockchain.validateChain().then;
}, 2500)
