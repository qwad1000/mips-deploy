ace.define('ace/mode/mips', function(require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var Tokenizer = require("ace/tokenizer").Tokenizer;
    var ExampleHighlightRules = require("ace/mode/mips_highlight_rules").ExampleHighlightRules;

    var Mode = function() {
        this.$tokenizer = new Tokenizer(new ExampleHighlightRules().getRules());
    };
    oop.inherits(Mode, TextMode);

    (function() {
        // Extra logic goes here. (see below)
    }).call(Mode.prototype);

    exports.Mode = Mode;
});

ace.define('ace/mode/mips_highlight_rules', function(require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var ExampleHighlightRules = function() {
        var keywordMapper = this.createKeywordMapper({
            "keyword.operator": "add addi addiu addu and andi " +
                "beq beqz beqzal bgtz bltz bltzal bne blez" +
                "div divu j jal jr lb lui lw "+
                "mfhi mflo mult multu noop or ori sb sll sllv slt sltu slti sltiu sra srl srlv sub subu sw xor xori"
        }, "text", true, " ");

        var compoundKeywords = "\\$(30|31|[1-2]?[0-9]|t[0-9]|s[0-8]|ra|zero|at|v[0-1]|a[0-3]|k0|k1|gp|sp)";

        this.$rules = {
            "start": [
                {token: "comment", regex: "#.*"},
                {token: "constant.numeric", regex: "[+-]?(0x[0-9A-E]+|\\d+)\\b"},
                {token: "variable", regex: compoundKeywords},
                {token: "storage", regex: "\\w+:"},
                {token: keywordMapper, regex: "\\b\\w+\\b"},
                {caseInsensitive: true}
            ]
        }
    };

    oop.inherits(ExampleHighlightRules, TextHighlightRules);

    exports.ExampleHighlightRules = ExampleHighlightRules;
});