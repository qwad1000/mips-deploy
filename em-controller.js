var app = angular.module("MIPS-app",[]);

var editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/mips");
editor.setValue("#Це просто кусок коментаря");
editor.gotoLine(0);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[$');
    $interpolateProvider.endSymbol('$]');
});

var someEDXFounder = {};




var exerciseVar = 0;
var exercisePath = "vars1.json";



function isNotCommentLine(line){
    return !line.startsWith("#");
}

app.controller ("testController", function($scope, $http) {
    var demoCPU = initDemoCPU();
    var commandRegex = new RegExp("(add|addi|addiu|addu|and|andi|beq|bgez|bgezal|bgtz|blez|bltz|bltzal|bne|div|divu|j|jal|jr|lb|lui|lw|mfhi|mflo|mult|multu|noop|or|ori|sb|sll|sllv|slt|sltu|sltiu|sra|srl|srlv|sub|subu|sw|xor|xori)(\\s([+-]?0x[1-9A-F]+|[+-]?[1-9]+|(\\$(30|31|[1-2]?[0-9]|t[0-9]|s[0-8]|ra|zero|at|v[0-1]|a[0-3]|k0|k1|gp|sp)))){1,3}");
    $scope.codeArea = "";
    $scope.registers = demoCPU.register.registerMap;
    $scope.ram = demoCPU.ram;
    $scope.registersName = registersName;
    $scope.resultArea = "";
    $scope.isEditing = true;
    $scope.loadBtnText = "Assemble & Load to CPU";
    $scope.limits = limits;


    $scope.hexRegFmt = 'hex';
    $scope.memoryShift = 0x12;

    $scope.commandsCount = -1;
    $scope.dividedRegisters = prepareRegistersTable(2, $scope.registers, $scope.registersName);
    var memoryTableSize = {width: 8, height: 17};
    $scope.memoryShifts = prepareMemoryTable($scope.memoryShift,memoryTableSize.height, memoryTableSize.width);

    //crunch
    $http.get(exercisePath)
        .success( function (response) {
            var variants = response.variants;
            $scope.exercise = variants[0];
        }).error( function () {
            $scope.resultArea += "Some error loading tests from" + exercisePath + "var:" + exerciseVar;
            //$scope.exercise = initialObject;
        });


	someEDXFounder.getState = function () {
	    var jsonObject = {
	        "code":editor.getValue(),
	        "exVar": exerciseVar.toString(),
	        "exPath": exercisePath
	    };
	    return JSON.stringify(jsonObject);
	};

	someEDXFounder.setState = function (jsonCode){
	    var result = JSON.parse(jsonCode);
	    editor.setValue(result["code"]);
	    exerciseVar = parseInt(result["exVar"]);
	    exercisePath = result["exPath"];
	    console.log(exerciseVar);
	    console.log(exercisePath);

	    $http.get(exercisePath)
	        .success( function (response) {
	            $scope.exercise = response[exerciseVar];
	        }).error( function () {
	            $scope.resultArea += "Some error loading tests from" + exercisePath + "var:" + exerciseVar;
	            $scope.exercise = initialObject;
	        });
	};

	someEDXFounder.gradeFunction = function () {
	    console.log($scope.exercise.tests);
	    var count = $scope.exercise.tests.length;
	    var goodCount = 0;
	    for (var id=0;id<count;id++){
	        var test = $scope.exercise.tests[id];
	        console.log(test.passed);
	        if (test.passed != false){
	            $scope.testClick(id);
	        }
	        if (test.passed == true){
	            goodCount = goodCount + 1;
	        }
	    }
	    var jsonResult = {
	        "count": count,
	        "goodCount":goodCount
	    };
	    console.log(jsonResult);
	    return JSON.stringify(jsonResult);
	};


    function prepareRegistersTable(columns, arr, names){
        var newArr = [];
        var newlength = arr.length/columns;

        for(var i=0; i<newlength; i++){ //fixme: if columns is odd
            var newnewArr = [];
            for(var j=0; j<columns; j++){
                var index = i+newlength*j;
                var obj = {name:names[index], indx:index};
                newnewArr.push(obj);
            }
            newArr.push(newnewArr);
        }
        return newArr;
    }

    $scope.returnRegister = function(index, fmt){
        var value = 0;
        if(typeof index == 'number'){
            value = $scope.registers[index];
        }
        if(typeof index == 'string'){
            if(index === 'alu.hi'){
                value = demoCPU.alu.hi;
            }
            if(index === 'alu.lo'){
                value = demoCPU.alu.lo;
            }
            if(index === 'pc'){
                // *4 is to emulate system pc. it is always multiple to 4 (memory alignment)
                value = demoCPU.commandParser.commandHolder.PC * 4;
            }
        }
        if(fmt=='hex'){
            var strValue = BinToHex(DexToFillComplementBin(value,32)); //fixme negative positions
            return '0x' + HexToFillHex(strValue, 8).toUpperCase();
        }
        return value;
    };

    function prepareMemoryTable(shift, rows, cols){
        if(typeof shift == 'string'){
            shift = parseInt(shift);
        }
        var arr = [];
        for(var i=0; i<rows; i++){
            var arr2 = [];
            for(var j=0; j<cols; j++){
                var num = shift + i*cols + j;
                arr2.push(num);
            }
            arr.push(arr2);
        }
        return arr;
    }

    $scope.returnMemoryValue = function (index, fmt){
        //fixme ???
        var m = $scope.ram.ramMap[index];
        if(typeof m == 'undefined'){
            m = 0;
        }
        if(fmt == 'hex'){
            m = m.toString(16).toUpperCase();
            m = HexToFillHex(m, 2);
        }
        return m;
    };

    $scope.changeMemoryShift = function(){
        $scope.memoryShifts = prepareMemoryTable($scope.memoryShift,
            memoryTableSize.height, memoryTableSize.width);
    };

    $scope.loadInfo = function (){
        if($scope.isEditing){
            $scope.codeArea = editor.getValue();
            var operations_list = $scope.codeArea.split('\n').filter(isNotCommentLine);
            $scope.commandsCount = 0;



            for (var i=0;i<operations_list.length;i++){
                var value = operations_list[i].trim();
                if (value.indexOf(":")>-1){
                    var splited = value.split(":");
                    operations_list[i] = splited[1];
                    demoCPU.commandParser.commandHolder.setLabel(splited[0],i-1);
                }
            }

            var isVerificated = true;
            for (i=0;i<operations_list.length;i++){
                value = operations_list[i].trim();
                if (!verificate(value,demoCPU.commandParser.commandHolder)){
                    alert("У вас помилка. Рядок №"+(i+1));
                    demoCPU.commandParser.commandHolder.clear();
                    isVerificated = false;
                    break;
                }
            }

            if (isVerificated) {
                for (i = 0; i < operations_list.length; i++) {
                    value = operations_list[i].trim();
                    if (value.length > 0) {
                        var binResult = demoCPU.command(value);
                        $scope.commandsCount++;
                        $scope.resultArea += BinToViewBin(binResult) + "\n";
                    }
                }
                $scope.isEditing = false;
                $scope.loadBtnText = "Return to code editor";
                editor.setReadOnly(true);
                $scope.resultArea = "";
            }
        }else{
            $scope.isEditing = true;
            $scope.loadBtnText = "Assemble & Load to CPU";
            editor.setReadOnly(false);
            $scope.commandsCount = -1;
            demoCPU.commandParser.commandHolder.clear();
        }

    };
    $scope.runConvert = function () {
        /*for(var i=0; i<$scope.commandsCount; i++){
         demoCPU.nextCommand();
         }*/
        var i = 0;
        while (!demoCPU.isEnd() && i<$scope.limits.maxTicks){
            demoCPU.nextCommand();
            i++;
        }
        if (i==$scope.limits.maxTicks){
            alert("Забагато ітерацій. Збільшіть ліміт");
        }
        $scope.commandsCount = 0;
        console.log("состояние регистров под конец работы:");
        console.log(demoCPU.register.registerMap);
        console.log(demoCPU.ram.ramMap);
    };

    $scope.runStep = function () {
        if($scope.commandsCount>0){
            demoCPU.nextCommand();
            editor.session.clearBreakpoints();
            var rows = editor.session.getLength(); //fixme: indexes may be wrong if delete empty rows in editor
            editor.session.setBreakpoint(rows - $scope.commandsCount);
            $scope.commandsCount--;
            console.log(demoCPU.commandParser.commandHolder.PC);
            //console.log($scope.programCounter);
        }
    };
    $scope.reset = function (){//todo
        demoCPU = initDemoCPU();
        editor.session.clearBreakpoints();
        $scope.registers = demoCPU.register.registerMap;
        //$scope.programCounter = demoCPU.commandParser.commandHolder.PC;
        $scope.ram = demoCPU.ram;
        $scope.isEditing = true; //crunch;
        $scope.commandsCount = -1;
        $scope.loadInfo();
        console.log('mips cpu reseted');
    };

    $scope.testClick = function (id){
        $scope.reset();
        var test = $scope.exercise.tests[id];

        angular.forEach(test.registers.start, function (val, i, arr){
            var key = Object.keys(val)[0];
            var code = registerCode[key];
            var val = val[key];
            demoCPU.register.set(code, val);
        });
        if(test.memory.start != null){
            angular.forEach(test.memory.start, function (val, i, arr){
                var address = Object.keys(val)[0];
                var val = val[address];

                demoCPU.ram.setHexWord(address, val);
            });
        }

        $scope.runConvert();

        var testPassed = true;

        angular.forEach(test.registers.end, function (val, i, arr) {
            var key = Object.keys(val)[0];
            var code = registerCode[key];
            var val = val[key];
            var currentVal = demoCPU.register.get(code);
            if(currentVal != val){
                testPassed = false;
            }
        });

        if(test.memory.end != null){
            angular.forEach(test.memory.end, function (val, i, key) {
                var adress = Object.keys(val)[0];
                var val = val[adress];

                var currentVal = demoCPU.ram.getHexWord(adress);
                if(currentVal != val){
                    testPassed = false;
                }
            });
        }

        test.passed = testPassed;//todo
    }
});