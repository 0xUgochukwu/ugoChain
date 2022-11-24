/*
    General Helper functions */
/*
Taking into account the printable ASCII characters,
it starts with a space char and ends with a tilde,
hence the following regular expression.
 */
const PRINTABLE_ASCII_CHARS = '/[^ -~]+/g'
const MAX_BUFFER_SIZE = 500;

// var exports = module.exports = {};
class HelperFunctions {

    sanitizeASCII(str) {
        str = str.replace(/[^ -~]+/g, "");
        return str;
    }


    validStarData(data) {
        const MAX_BUFFER_SIZE = 500;

        //Use destructuring assignment to assign at-once
        // const {star} = data
        let {dec, ra, story} = data

        dec = this.sanitizeASCII(dec);
        ra = this.sanitizeASCII(ra);
        story = this.sanitizeASCII(story);



        if(dec.length < 1 || ra.length < 1) {
            throw new Error('Please make sure you included your star coordinates.');
        }

        if (story.length < 1) {
            throw new Error('Please make sure you include a star story with printable ASCII characters.')
        }

        if (new Buffer(story).length > MAX_BUFFER_SIZE) {
            throw new Error('Your star story must be less than 500 bytes.')
        }

        return true;
    }
}

//Export the class
module.exports = HelperFunctions