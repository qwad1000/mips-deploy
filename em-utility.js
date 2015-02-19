
//region Ініціалізація допоміжних функцій
if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (str){
        return this.indexOf(str) == 0;
    };
}
//endregion

/**
 * @param {Number} d
 * @return {string}
 */
function DexToHex(d) {
    return d.toString(16);
}

/**
 *
 * @param {String} h
 * @returns {Number}
 */
function HexToDex(h) {
    return parseInt(h,16);
}

/**
 * @param {Number} d
 * @return {string}
 */
function DexToBin(d) {
    return d.toString(2);
}

/**
 *
 * @param {String} b
 * @returns {Number}
 */
function BinToDex(b){
    return parseInt(b,2);
}

/**
 * Converts positive decimal d into binary with extending it to count bits
 * @param {Number} d
 * @param {Number} count
 * @return {String}
 */
function DexToFillBin(d,count){
    if(typeof d == "string"){
        d = parseInt(d,10);
    }
    var b = d.toString(2);
    
    var length = b.length;
    if (length>count){
        b = b.substring(0,count);
    }
    if (length<count){
        b = generateString(count-length,'0') + b;
    }
    return b;
}
/**
 * Converts binary number string b from two's complement to decimal value
 * @param b
 * @returns {number}
 */
function ComplementBinToDex(b){
    if(b.charAt(0)==='1') {
        b = b.replace(/0/g, 't');
        b = b.replace(/1/g, '0');
        b = b.replace(/t/g, '1');

        return -(BinToDex(b) + 1);
    }
    return BinToDex(b);

}

/**
 * Converts decimal number d into binary code. The length of binary code is count. 
 * If d is negative result will be represented in two's complement.
 * 
 * @param {Number} d
 * @param {Number} count
 * @return {String}
 */
function DexToFillComplementBin(d,count){//warning: overflow can be
    if(typeof d == "string"){
        d = parseInt(d,10);
    }

    var isNegative = d < 0;
    var b = "";

    if(isNegative){
        b = (-d).toString(2);
        var length = b.length;
        b = b.replace(/0/g,'t');
        b = b.replace(/1/g,'0');
        b = b.replace(/t/g,'1');

        var t = BinToDex(b) + 1;

        b = DexToFillBin(t, length);
        b = generateString(count - b.length,'1') + b;
    }else{
        b = DexToFillBin(d, count);
    }

    return b;
}


/**
 *
 * @param {Number} length
 * @param {String} symbol
 * @return {String}
 */
function generateString(length,symbol){
    var result = "";
    for (var i=0;i<length;i++){
        result+=symbol;
    }
    return result;
}
/**
 * Separating binary number string by spaces every 4 chars
 * @param {String} b
 * @return {String}
 */
function BinToViewBin(b){
    var lastIndex = b.length-1;
    var result = "";
    for (var i = 0;i< b.length;i++){
        if (i%4==0 && i!=lastIndex && i!=0){
            result+=" ";
        }
        result+= b[i];
    }
    return result;
}

/**
 * Взагалі, це чорна магія
 * @param {Number} x
 * @param {Number} y
 * @returns {number}
 */
function integerDivision(x,y){
    return x/y>>0;
}

/**
 * Fills hex string to length
 * @param {string} h      string with number in hex format
 * @param {number} count length to what h will be expanded
 * @return {string}
 */
function HexToFillHex(h, count){ //test
    var length = h.length;
    var concatStr = "";
    for(var i=0; i<count - length; i++){
        concatStr = concatStr + "0";
    }
    return concatStr + h;
}

/**
 * @return {string}
 */
function BinToHex(b) {
    var h = "";

    if(b.length % 4 !== 0){
        b = generateString(4 - b.length % 4, '0') + b;
    }
    var length = b.length;

    for(var i=0; i<length; i+=4){
        var bslice = b.slice(length-4-i, length-i);
        var d = BinToDex(bslice);
        h = DexToHex(d) + h;
    }
    return h;
}