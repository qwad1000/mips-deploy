//region Memory
function initRamHolder() {
    var ramHolder = {};
    ramHolder.ramMap = [];

    ramHolder.getDex = function (dexAddress) {
        var value = this.ramMap[dexAddress];
        if(value !== undefined){
            return value;
        }
        return 0;
    };
    ramHolder.setDex = function (dexAddress, value) {
        if(value !== 0) {
            this.ramMap[dexAddress] = value;
        }else{
            delete this.ramMap[dexAddress]; //warning: may be reducing next indexes of array elements
        }
    };
    ramHolder.setHex = function (startIndex, value) {
        this.setDex(HexToDex(startIndex),value);
    };
    ramHolder.getHex = function (startIndex) {
        this.getDex(HexToDex(startIndex));
    };

    ramHolder.getHexWord = function (hexAddress) {
        return ramHolder.getDexWord(HexToDex(hexAddress));
    };
    ramHolder.setHexWord = function (hexAddress, value){
        return ramHolder.setDexWord(HexToDex(hexAddress), value);
    };
    ramHolder.getDexWord = function (decAddress) {
        var b = "";
        for(var i=0; i<4; i++){
            var d = this.getDex(decAddress + i);
            b += DexToFillBin(d, 8);
        }
        return ComplementBinToDex(b);
    };
    ramHolder.setDexWord = function(dexAddress, value) {
        var b = DexToFillComplementBin(value, 32);
        for(var i=0; i<4; i++){
            var partb = b.slice(8*i, 8*(i+1));
            var y = BinToDex(partb);
            ramHolder.setDex(dexAddress + i, y);
        }
    };

    ramHolder.isClear = function () {
        return this.ramMap.length == 0;
    };
    ramHolder.getMemorySize = function () {
        // body...
        return 0;
    };
    return ramHolder;
}

function initRegisterHolder() {
    var registerHolder = {};
    var registerMap = [];
    for (var i = 0; i < 32; i++) {
        registerMap[i] = 0;
    }
    registerHolder.registerMap = registerMap;
    registerHolder.get = function (index) {
        if (index > -1 && index < 32) {
            return this.registerMap[index];
        }
    };
    registerHolder.set = function (index, value) {
        if (index > 0 && index < 32) {
            this.registerMap[index] = value;
        }
    };
    return registerHolder;
}

function initCommandRamHolder() {
    var commandRamHolder = {};
    commandRamHolder.PC = 0;
    commandRamHolder.commandCodeList = [];
    commandRamHolder.labels = [];
    commandRamHolder.addCommandCodes = function (code) {
        this.commandCodeList.push(code);
    };
    commandRamHolder.getCurrent = function () {
        var result = this.commandCodeList[this.PC];
        return result;
    };
    commandRamHolder.setPC = function (newPC) {
        this.PC = newPC;
    };
    commandRamHolder.getPC = function () {
        return this.PC;
    };
    commandRamHolder.addLabel = function (label) {
        console.log(this.commandCodeList.length+" з міткою "+label);
        this.labels[label] = this.commandCodeList.length - 1;
    };
    commandRamHolder.setLabel = function (label,number){
        console.log(this.commandCodeList.length+" з міткою "+label+" та порядковим номером" + number);
        this.labels[label] = number;
    };
    commandRamHolder.getLabel = function (label) {
        console.log("Знаходимо мітку " + label);
        return this.labels[label];
    };
    commandRamHolder.getCurrentPC = function () {
        return this.PC - 1;
    };
    commandRamHolder.clear = function(){
        this.commandCodeList = [];
        this.labels = [];
        this.PC = 0;
    };
    commandRamHolder.isEnd = function () {
        return this.PC == this.commandCodeList.length;
    };
    return commandRamHolder;
}

//endregion

//region Розбір команд
/*
 Важливі спостереження:
 - Якщо команда починається з 1, то вона працює з пам’ятю. Інакше, все це добро потрібно надсилати в ALU
 - Всі арифметичні операції між трьома регістрами починаються з 000000
 */
cStart = {
    //Арифметичні операції з трьома регістрами
    'add': "000000",
    'addu': "000000",
    'and': "000000",
    'div': "000000",
    'divu': "000000",
    'jr': "000000",
    'mult': "000000",
    'multu': "000000",
    'or': "000000",
    'sllv': "000000",
    'slt': "000000",
    'sltu': "000000",
    'srlv': "000000",
    'sub': "000000",
    'subu': "000000",
    'xor': "000000",
    //Кінець
    //Розширені арифметичні
    'sra': "00000000000",
    'sll': "00000000000",
    'srl': "00000000000",
    'mfhi': "0000000000000000",
    'mflo': "0000000000000000",
    //Кінець
    'addi': "001000",
    'addiu': '001001',
    'andi': "001100",
    'beq': "000100",
    //Порівняння з нулем та стрибок
    'bgez': "000001",
    'bgezal': "000001",
    'bltz': "000001",
    'bltzal': "000001",
    //Кінець
    'bgtz': "000111",
    'blez': "000110",
    'bne': "000101",
    'j': "000010",
    'jal': "000011",
    'lb': "100000",
    'lui': "001111",
    'lw': "100011",
    'ori': "001101",
    'sb': "101000",
    'slti': "001010",
    'sltiu': "001011",
    'sw': "101011",
    'xori': "001110"
};

cEnd = {
    'add': "00000100000",
    'addu': "00000100001",
    'and': "00000100100",
    'div': "0000000000011010",
    'divu': "0000000000011011",
    'jr': "000000000000000001000",
    'mfhi': "00000010000",
    'mflo': "00000010010",
    'mult': "0000000000011000",
    'multu': "0000000000011001",
    'sll': "000000",
    'sllv': "00000000100",
    'slt': "00000101010",
    'sltu': "00000101011",
    'sra': "000011",
    'srl': "000010",
    'srlv': "00000000110",
    'sub': "00000100010",
    'subu': "00000100011",
    'xor': "00000100110",
    'or': "00000100101"
};

cMiddle = {
    'bgez': "00001",
    'bgezal': "10001",
    'bgtz': "00000",
    'blez': "00000",
    'bltz': "00000",
    'bltzal': "10000"
};

//TSImmGroup = ['addi','addiu','andi','ori','slti','sltiu','xori']
function convertTSImm(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillComplementBin(parseInt(splitedCode[3]), 16);//
}
//DSTGroup = ['add','addu','and','or','sllv','slt','sltu','srlv','sub','subu','xor']
function convertDST(splitedCode) {
    console.log(splitedCode);
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[3]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[1]), 5);
}
//SOffGroup = ['bgez','bgezal','bgtz','blez','bltz','bltzal']
function convertSOff(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + cMiddle[splitedCode[0]]
        + DexToFillComplementBin(splitedCode[2], 16);
}
//STGroup = ['div','divu','mult','multu']
function convertST(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[2]), 5);
}
//STOffGroup = ['beq','bne']
function convertSTOff(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[2]), 5)
        + DexToFillComplementBin(splitedCode[3], 16);
}
//TargetGroup=['j','jal']
function convertTarget(splitedCode) {
    return DexToFillBin(splitedCode[1], 26);
}
//TOffSGroup = ['lw','sw','lb','sb']
function convertTOffS(splitedCode) {
    var offS = splitedCode[2];
    var offSArr = offS.split("(");
    offSArr[1] = offSArr[1].substring(0, offSArr[1].length - 1);
    return DexToFillBin(getRegisterCode(offSArr[1]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillComplementBin(offSArr[0], 16);
}
//SorDGroup = ['mfhi','mflo','jr']
function convertSorD(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5);
}
//TImmGroup = ['lui']
function convertTImm(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillComplementBin(splitedCode[2], 16);
}
//commandDTHGroup = ['sll','sra','srl']
function convertDTH(splitedCode) {
    return DexToFillBin(getRegisterCode(splitedCode[2]), 5)
        + DexToFillBin(getRegisterCode(splitedCode[1]), 5)
        + DexToFillBin(splitedCode[3], 5);
}

var commandRegExp = new RegExp("\\s*,\\s*");

var numberRegExp = new RegExp("^-?(0x[0-9A-F]+|[0-9]+)");

/*commandTSImmGroup = ['addi','addiu','andi','ori','slti','sltiu','xori'];
 commandDSTGroup = ['add','addu','and','or','sllv','slt','sltu','srlv',
 'sub','subu','xor'];
 commandSOffGroup = ['bgez','bgezal','bgtz','blez','bltz','bltzal'];
 commandSTGroup = ['div','divu','mult','multu'];
 commandSTOffGroup = ['beq','bne'];
 commandTargetGroup=['j','jal'];
 commandTOffSGroup = ['lw','sw','lb','sb'];
 commandSorDGroup = ['mfhi','mflo','jr'];
 commandTImmGroup = ['lui'];
 commandDTHGroup = ['sll','sra','srl'];*/

function initCommandParser() {
    var commandParser = {};
    commandParser.commandHolder = initCommandRamHolder();
    commandParser.createCommand = function (code) {
        console.log(code);
        //Код команди виглядає так:
        //addi $t1,$t2,$t3
        //var firstSpilt = code.split(" ");
        var firstSpaceIndex = code.indexOf(" ");
        var firstSplit = [code.substring(0,firstSpaceIndex).trim(),code.substring(firstSpaceIndex+1).trim()];
        var end = [firstSplit[0]].concat(firstSplit[1].split(commandRegExp));
        console.log(code);
        return end;
    };
    commandParser.parse = function (splitedCode) {
        var code = splitedCode[0];
        switch (code) {
            //TImm Group
            case 'addi':
            case 'addiu':
            case 'andi':
            case 'ori':
            case 'slti':
            case 'sltiu':
            case 'xori':
                return cStart[code] + convertTSImm(splitedCode);
                break;
            //DST Group
            case 'add':
            case 'addu':
            case 'and':
            case 'or':
            case 'sllv':
            case 'slt':
            case 'sltu':
            case 'srlv':
            case 'sub':
            case 'subu':
            case 'xor':
                return cStart[code] + convertDST(splitedCode) + cEnd[code];
                break;
            //SOff Group
            case 'bgez':
            case 'bgezal':
            case 'bgtz':
            case 'blez':
            case 'bltz':
            case 'bltzal':
                var offsetLabel = splitedCode[2];
                if (!numberRegExp.test(offsetLabel)) {
                    var currentCommandNumber = this.commandHolder.commandCodeList.length;
                    var labelNumber = this.commandHolder.getLabel(offsetLabel);
                    var offset = labelNumber - currentCommandNumber;
                    splitedCode[2] = parseInt(offset) - 1;//Тому що збільшення PC відбувається постійной
                } else {
                    splitedCode[3] = parseInt(offsetLabel)-1;//Тому що збільшення PC відбувається постійной
                }
                return cStart[code] + convertSOff(splitedCode);
                break;
            //ST Group
            case 'div':
            case 'divu':
            case 'mult':
            case 'multu':
                return cStart[code] + convertST(splitedCode) + cEnd[code];
                break;
            //STOff Group
            case 'beq':
            case 'bne':
                offsetLabel = splitedCode[3];
                if (!numberRegExp.test(offsetLabel)) {
                    currentCommandNumber = this.commandHolder.commandCodeList.length;
                    labelNumber = this.commandHolder.getLabel(offsetLabel);
                    offset = labelNumber - currentCommandNumber;
                    splitedCode[3] = parseInt(offset) -1;//Тому що збільшення PC відбувається постійной
                } else {
                    splitedCode[3] = parseInt(offsetLabel)-1;//Тому що збільшення PC відбувається постійной
                }
                console.log("Offset Label",offsetLabel);
                return cStart[code] + convertSTOff(splitedCode);
                break;
            //Target Group
            case 'j':
            case 'jal':
                var targetLabel = splitedCode[1];
                if (!numberRegExp.test(targetLabel)){
                    labelNumber = this.commandHolder.getLabel(targetLabel);
                    splitedCode[1] = labelNumber;
                }
                return cStart[code] + convertTarget(splitedCode);
                break;
            //TOffS Group
            case 'lw':
            case 'sw':
            case 'lb':
            case 'sb':
                return cStart[code] + convertTOffS(splitedCode);
                break;
            //SorD Group
            case 'mfhi':
            case 'mflo':
            case 'jr':
                return cStart[code] + convertSorD(splitedCode) + cEnd[code];
                break;
            //TImm Group
            case 'lui':
                return cStart[code] + convertTImm(splitedCode);
                break;
            //DTH Group
            case 'sll':
            case 'sra':
            case 'srl':
                return cStart[code] + convertDTH(splitedCode) + cEnd[code];
                break;

        }
    };
    return commandParser;
}

numberSet = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/**
 * @param {String} code
 * @return {Number}
 */
function getRegisterCode(code) {
    if (!code.startsWith("$")){
        return undefined;
    }
    var exsCode = code.substring(1);
    if (numberSet.indexOf(parseInt(exsCode[0])) == -1) {
        return registerCode[exsCode];
    }
    return parseInt(exsCode);
}
//endregion

//region CPU
function initDemoCPU() {
    var demoCPU = {};
    demoCPU.ram = initRamHolder();
    demoCPU.commandParser = initCommandParser();
    demoCPU.register = initRegisterHolder();
    demoCPU.alu = initALU(demoCPU.register, demoCPU.ram, demoCPU.commandParser.commandHolder);
    demoCPU.nextCommand = function () {
        this.alu.calculate(this.commandParser.commandHolder.getCurrent());
        this.commandParser.commandHolder.PC++;
    };
    demoCPU.isEnd = function() {
        return this.commandParser.commandHolder.isEnd();
    };
    demoCPU.command = function (command) {
        var splitedCode = this.commandParser.createCommand(command);
        var bCode = this.commandParser.parse(splitedCode);
        this.commandParser.commandHolder.addCommandCodes(bCode);
        return bCode;
    };
    return demoCPU;
}
//endregion

//region ALU
/*
 ALU Notes:
 - З цікавого: усі операції діляться за бітами:
 Якщо команда починається з 000000, оцінка за останніми шістьма бітами хвоста, методом if-else:
 1. Перший біт не нульовий - це звичайна арифметична операція з трьома регістрами
 2. Другий біт не нульовий - це операція, що використовує аккомулятор
 3. Третій біт не нульовий - це команда стрибка
 4. Четвертий біт не нульовий - це зсув для трьох регістрів
 5. П’ятий біт не нульовий - це зсув вправо для дивних параметрів
 6. Всі нулі - це зсув вліво для дивних параметрів

 */
function initALU(registerHolder, ramHolder, commandRamHolder) {
    var alu = {};
    var zeroStartArray = initZeroStartArray();
    var hardArray = initHardArray();
    var accArray = initAccArray();
    var elseZeroArray = initElseZeroArray();
    alu.hi = 0;
    alu.lo = 0;
    alu.calculate = function (b) {
        console.log(b);
        if (b.startsWith("000000")) {
            var end = b.substring(b.length - 6, b.length);
            console.log(end);
            if (!end.startsWith("0")) {
                zeroStartArray[end](b, registerHolder);
            } else {
                if (end[1] != '0') {
                    console.log(end);
                    accArray[end](b, registerHolder, alu);
                } else {
                    elseZeroArray[end](b,registerHolder, ramHolder, commandRamHolder);
                }
            }
        } else {
            hardArray[b.substring(0, 6)](b, registerHolder, ramHolder, commandRamHolder);
        }
    };
    return alu;
}

function initZeroStartArray() {
    var arr = [];
    //add
    arr["100000"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0],
            registerHolder.get(values[1]) + registerHolder.get(values[2]));
    };
    //addu
    arr["100001"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0],
            registerHolder.get(values[1]) + registerHolder.get(values[2]));
    };
    //and
    arr["100100"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0],
            registerHolder.get(values[1]) & registerHolder.get(values[2]));
    };
    //slt
    arr["101010"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0],
            registerHolder.get(values[1]) < registerHolder.get(values[2]) ? 1 : 0);
    };
    //sltu
    arr["101011"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) < registerHolder.get(values[2]) ? 1 : 0);
    };
    //sub
    arr["100010"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) - registerHolder.get(values[2]));
    };
    //subu
    arr["100011"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) - registerHolder.get(values[2]));
    };
    //xor
    arr["100110"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) ^ registerHolder.get(values[2]));
    };
    //or
    arr["100101"] = function (b, registerHolder) {
        var values = getDST(b);
        registerHolder.set(values[0], registerHolder.get(values[1]) | registerHolder.get(values[2]));
    };
    return arr;
}

function initAccArray() {
    var arr = [];
    //div
    arr['011010'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        alu.hi = s % t;
        alu.lo = integerDivision(s, t);
    };
    //divu
    arr['011011'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        alu.hi = s % t;
        alu.lo = integerDivision(s, t);
    };
    //mfhi
    arr['010000'] = function (b, registerHolder, alu) {
        var d = getD(b);
        registerHolder.set(d, alu.hi);
    };
    //mflo
    arr['010010'] = function (b, registerHolder, alu) {
        var d = getD(b);
        registerHolder.set(d, alu.lo);
    };
    //mult
    arr['011000'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        console.log(s,t);
        var mult = DexToFillComplementBin(s * t, 64);
        var mult1 = mult.substring(0, 32);
        var mult2 = mult.substring(32);
        alu.lo = ComplementBinToDex(mult2);
        alu.hi = ComplementBinToDex(mult1);
    };
    //multu
    arr['011010'] = function (b, registerHolder, alu) {
        var values = getST(b);
        var s = registerHolder.get(values[0]);
        var t = registerHolder.get(values[1]);
        var mult = DexToFillBin(s * t, 64);
        var mult1 = mult.substring(0, 32);
        var mult2 = mult.substring(32);
        alu.lo = BinToDex(mult2);
        alu.hi = BinToDex(mult1);
    };

    return arr;
}

function initElseZeroArray(){
    var arr = [];
    //jr
    arr['001000'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getST(b);
        var nextPC = registerHolder.get(values[0])/4; //todo: exit if error while div 4
        commandRamHolder.PC = Math.floor(nextPC);
    };
    //srl
    arr['000010'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getDTH(b);
        registerHolder.set(values[0],registerHolder.get(values[1])>>values[2]);
    };
    //sll
    arr['000000'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getDTH(b);
        registerHolder.set(values[0],registerHolder.get(values[1])<<values[2]);
    };
    //sra
    arr['000011'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getDTH(b);
        registerHolder.set(values[0],registerHolder.get(values[1])>>values[2]);
    };
    //srlv
    arr['000110'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getDST(b);
        registerHolder.set(values[0],registerHolder.get(values[2])>>registerHolder.get(values[1]));
    };
    //sllv
    arr['000100'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getDST(b);
        registerHolder.set(values[0],registerHolder.get(values[2])<<registerHolder.get(values[1]));
    };
    return arr;
}

function initHardArray() {
    var arr = [];
    //addi
    arr['001000'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) + values[2]);
    };
    //addiu
    arr['001001'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) + values[2]);
    };
    //andi
    arr['001100'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) & values[2]);
    };
    //ori
    arr['001101'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) | values[2]);
    };
    //slti
    arr['001010'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) < values[2] ? 1 : 0);
    };
    //sltiu
    arr['001011'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) < values[2] ? 1 : 0);
    };
    //xori
    arr['001110'] = function (b, registerHolder, ramHolder, commandRamHolder) {
        var values = getSTImm(b);
        registerHolder.set(values[1], registerHolder.get(values[0]) ^ values[2]);
    };
    //sw
    arr['101011'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getTOffS(b);
        ramHolder.setDexWord(values[2]+registerHolder.get(values[1]),
            registerHolder.get(values[0]));
        /*ramHolder.setDex(registerHolder.get(values[0])+values[2],
         registerHolder.get(values[1]));*/
    };
    //lw
    arr['100011'] = function (b,registerHolder, ramHolder, commandRamHolder) {
        var values = getTOffS(b);
        registerHolder.set(values[0],
            ramHolder.getDexWord(values[2]+registerHolder.get(values[1])));
    };
    //j
    arr['000010'] = function (b,registerHolder, ramHolder, commandRamHolder){
        commandRamHolder.PC = getTarget(b);
    };
    //jal
    arr['000011'] = function (b,registerHolder, ramHolder, commandRamHolder){
        registerHolder.set(31,commandRamHolder.PC);
        commandRamHolder.PC = getTarget(b);
    };
    //beq
    arr['000100'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getSTImm(b);
        console.log(registerHolder.registerMap);
        if (registerHolder.get(values[0]) == registerHolder.get(values[1])){
            commandRamHolder.PC +=values[2];
        }
    };
    //bne
    arr['000101'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getSTImm(b);
        console.log(registerHolder.registerMap);
        if (registerHolder.get(values[0]) != registerHolder.get(values[1])){
            commandRamHolder.PC +=values[2];
        }
    };
    //blez
    arr['000110'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getSTImm(b);
        console.log(registerHolder.registerMap);
        if (registerHolder.get(values[0]) <= 0){
            commandRamHolder.PC +=values[2];
        }
    };
    //bgtz
    arr['000111'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getSTImm(b);
        console.log(registerHolder.registerMap);
        if (registerHolder.get(values[0]) >= 0){
            commandRamHolder.PC +=values[2];
        }
    };
    //bgez,bgezal,bltz,bltzal
    arr['000001'] = function (b,registerHolder, ramHolder, commandRamHolder){
        var values = getSTImm(b);
        var flags = DexToFillBin(values[1],5);
        if (flags[0]=='1'){
            registerHolder.set(31,commandRamHolder.PC);
        }
        var makeShift = false;
        if (flags[4]=='1'){//Перевіряє, чи більше за нуль
            makeShift = registerHolder.get(values[0])>0;
        } else {//Чи менше за нуль
            makeShift = registerHolder.get(values[0])<0;
        }
        if (makeShift){
            commandRamHolder.PC+=values[2];
        }
    };
    return arr;
}
/**
 *
 * @param {String} b
 * @returns {Number} target
 */
function getTarget(b){
    return BinToDex(b.substring(6))+1;
}

/**
 *
 * @param {String} b
 * @returns {*[]} D,S,T
 */
function getDST(b) {
    return [BinToDex(b.substring(16, 21)), BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16))];
}

function getDTH(b) {
    return [BinToDex(b.substring(16, 21)), BinToDex(b.substring(11, 16)), BinToDex(b.substring(21, 26))];
}

/**
 * @param {String} b
 * @returns {*[]} T,S,Offset
 */
function getTOffS(b){
    return [BinToDex(b.substring(11,16)),BinToDex(b.substring(6,11)),ComplementBinToDex(b.substring(16))];
}
/**
 *
 * @param {String} b
 * @returns {Number} D
 */
function getD(b) {
    return BinToDex(b.substring(16, 21));
}

/**
 *
 * @param {String} b
 * @returns {*[]} S,T
 */
function getST(b) {
    return [BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16))];
}
/**
 *
 * @param {String} b
 * @returns {*[]} S,T,Imm
 */
function getSTImm(b) {
    return [BinToDex(b.substring(6, 11)), BinToDex(b.substring(11, 16)), ComplementBinToDex(b.substring(16))];
}

//endregion



//region Верифікація
function verificate(line, commandRamHolder){
    if (line.indexOf(":") > -1){
        line = line.split(":")[1];
    }
    var firstSpaceIndex = line.indexOf(" ");
    var firstSplit = [line.substring(0,firstSpaceIndex).trim(),line.substring(firstSpaceIndex+1).trim()];
    if (firstSplit.length!=2){
        return false;
    }
    var splitedCode = [firstSplit[0]].concat(firstSplit[1].split(commandRegExp));
    console.log(splitedCode.length," - ",line);
    var code = splitedCode[0];
    switch (code) {
        //TImm Group
        case 'addi':
        case 'addiu':
        case 'andi':
        case 'ori':
        case 'slti':
        case 'sltiu':
        case 'xori':
            return verifyTSImm(splitedCode);
            break;
        //DST Group
        case 'add':
        case 'addu':
        case 'and':
        case 'or':
        case 'sllv':
        case 'slt':
        case 'sltu':
        case 'srlv':
        case 'sub':
        case 'subu':
        case 'xor':
            return verifyDST(splitedCode);
            break;
        //SOff Group
        case 'bgez':
        case 'bgezal':
        case 'bgtz':
        case 'blez':
        case 'bltz':
        case 'bltzal':
            return verifySOff(splitedCode,commandRamHolder);
            break;
        //ST Group
        case 'div':
        case 'divu':
        case 'mult':
        case 'multu':
            return verifyST(splitedCode);
            break;
        //STOff Group
        case 'beq':
        case 'bne':
            return verifySTOff(splitedCode,commandRamHolder);
            break;
        //Target Group
        case 'j':
        case 'jal':
            return verifyTarget(splitedCode,commandRamHolder);
            break;
        //TOffS Group
        case 'lw':
        case 'sw':
        case 'lb':
        case 'sb':
            return verifyTOffS(splitedCode);
            break;
        //SorD Group
        case 'mfhi':
        case 'mflo':
        case 'jr':
            return verifySorD(splitedCode);
            break;
        //TImm Group
        case 'lui':
            return verifyTImm(splitedCode);
            break;
        //DTH Group
        case 'sll':
        case 'sra':
        case 'srl':
            return verifyDTH(splitedCode);
            break;

    }
    return false;
}

function _isImmNumber(n){
    return !isNaN(n) && (n<16385 && n> - 16385);
}

function _isSmallImmNumber(n){
    console.log(n);
    return !isNaN(n) && (n<16 && n> - 16);
}

function _isBigImmNumber(n){
    return !isNaN(n) && (n<16777216 && n> -16777216);
}

function _isLabel(n,commandRamHolder){
    var number = parseInt(n);
    if (isNaN(number)){
        return commandRamHolder.getLabel(n)!=undefined;
    }
    return _isImmNumber(number);
}

function _isBigLabel(n,commandRamHolder){
    var number = parseInt(n);
    if (isNaN(number)){
        return commandRamHolder.getLabel(n)!=undefined;
    }
    return _isBigImmNumber(number);
}

//TSImmGroup = ['addi','addiu','andi','ori','slti','sltiu','xori']
function verifyTSImm(splitedCode) {
    if (splitedCode.length!=4){
        return false;
    }
    var imm = parseInt(splitedCode[3]);
    return getRegisterCode(splitedCode[2]) != undefined &&
        getRegisterCode(splitedCode[1]) != undefined &&
        _isImmNumber(imm);
}
//DSTGroup = ['add','addu','and','or','sllv','slt','sltu','srlv','sub','subu','xor']
function verifyDST(splitedCode) {
    if (splitedCode.length!=4){
        return false;
    }
    return getRegisterCode(splitedCode[2]) != undefined &&
        getRegisterCode(splitedCode[3]) != undefined &&
        getRegisterCode(splitedCode[1]) != undefined;
}
//SOffGroup = ['bgez','bgezal','bgtz','blez','bltz','bltzal']
function verifySOff(splitedCode,commandRamHolder) {
    if (splitedCode.length!=3){
        return false;
    }
    return getRegisterCode(splitedCode[1]) != undefined &&
        + _isLabel(splitedCode[2],commandRamHolder);
}
//STGroup = ['div','divu','mult','multu']
function verifyST(splitedCode) {
    if (splitedCode.length!=3){
        return false;
    }
    return getRegisterCode(splitedCode[1]) != undefined &&
        getRegisterCode(splitedCode[2]) != undefined;
}
//STOffGroup = ['beq','bne']
function verifySTOff(splitedCode,commandRamHolder) {
    if (splitedCode.length!=4){
        return false;
    }
    return getRegisterCode(splitedCode[1]) != undefined &&
        + getRegisterCode(splitedCode[2]) != undefined &&
        + _isLabel(splitedCode[3],commandRamHolder);
}

//TargetGroup=['j','jal']
function verifyTarget(splitedCode,commandRamHolder) {
    if (splitedCode.length!=2){
        return false;
    }
    return _isBigLabel(splitedCode[1],commandRamHolder);
}

//TOffSGroup = ['lw','sw','lb','sb']
function verifyTOffS(splitedCode) {
    if (splitedCode.length!=3){
        return false;
    }
    var offS = splitedCode[2];
    var offSArr = offS.split("(");
    offSArr[1] = offSArr[1].substring(0, offSArr[1].length - 1);
    return getRegisterCode(offSArr[1]) != undefined &&
        getRegisterCode(splitedCode[1]) != undefined &&
        _isImmNumber(offSArr[0]);
}
//SorDGroup = ['mfhi','mflo','jr']
function verifySorD(splitedCode) {
    if (splitedCode.length!=2){
        return false;
    }
    return getRegisterCode(splitedCode[1]) != undefined;
}
//TImmGroup = ['lui']
function verifyTImm(splitedCode) {
    if (splitedCode.length!=3){
        return false;
    }
    return getRegisterCode(splitedCode[1]) != undefined &&
        + _isImmNumber(splitedCode[2]);
}
//commandDTHGroup = ['sll','sra','srl']
function verifyDTH(splitedCode) {
    if (splitedCode.length!=4){
        return false;
    }
    console.log(splitedCode);
    return getRegisterCode(splitedCode[2]) != undefined&&
        getRegisterCode(splitedCode[1]) != undefined &&
        _isSmallImmNumber(splitedCode[3]);
}

//endregion