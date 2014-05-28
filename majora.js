var NFA = function() {
    this.nodes = [];
    this.initialNode = null;
    var state = [];

    this.add = function(node, isInitial) {
        this.nodes.push(node);
        return node;
    };

    this.begin = function() {
        var initials = [];
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            if (node.isInitial) {
                initials.push(node);
            }
        }
        state = closure(initials);
    };

    this.consume = function(string) {
        for (var i = 0; i < string.length; i++) {
            consumeToken(this, string[i]);
        }
    };

    var consumeToken = function(self, token) {
        var newState = [];
        for (var i = 0; i < state.length; i++) {
            var s = state[i];
            for (var j = 0; j < s.edges.length; j++) {
                var edge = s.edges[j];
                if (edge.consumes(token) && newState.indexOf(edge.to) == -1) {
                    newState.push(edge.to);
                }
            }
        }

        if (newState.length == 0) {
            var evt = $.Event("not-accept");
            evt.token = token;
            $(self).triggerHandler(evt);
            if (evt.isDefaultPrevented()) {
                return;
            }
        }

        state = closure(newState);

        var evt = $.Event("consume");
        evt.token = token;
        $(self).triggerHandler(evt);
    };

    this.isFinal = function() {
        for (var i = 0; i < state.length; i++) {
            if (state[i].isFinal) {
                return true;
            }
        }
        return false;
    };

    this.clone = function() {
        var result = new NFA();
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            var nodeClone = result.add(new NFA.Node());
            nodeClone.isInitial = node.isInitial;
            nodeClone.isFinal = node.isFinal;
        }
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            for (var j = 0; j < node.edges.length; j++) {
                var edge = node.edges[j];
                result.nodes[i].link(result.nodes[this.nodes.indexOf(edge.to)], edge.value);
            }
        }
        return result;
    };

    this.follow = function() {
        var follow = [];
        for (var i = 0; i < state.length; i++) {
            var s = state[i];
            for (var j = 0; j < s.edges.length; j++) {
                var edge = s.edges[j];
                if (edge.value !== NFA.EPSILON && follow.indexOf(edge.value) == -1) {
                    follow.push(edge.value);
                }
            }
        }
        return follow;
    };

    var closure = function(nodes) {
        var changed;
        do {
            changed = false;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                for (var j = 0; j < node.edges.length; j++) {
                    var edge = node.edges[j];
                    if (edge.value == NFA.EPSILON && nodes.indexOf(edge.to) == -1) {
                        nodes.push(edge.to);
                        changed = true;
                    }
                }
            }
        } while (changed);

        return nodes;
    };

    this.toString = function() {
        var nodesString = "";
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            nodesString += (nodesString.length == 0? "" : ", ") + nodeToString(this, node);
        }

        var edgesString = "";
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            for (var j = 0; j < node.edges.length; j++) {
                var edge = node.edges[j];
                edgesString += (edgesString.length == 0? "" : ", ") + nodeToString(this, node) + " -" + edge.value + "-> " + nodeToString(this, edge.to);
            }
        }

        return "NODES = {" + nodesString + "}, EDGES = {" + edgesString + "}";
    };

    var nodeToString = function(nfa, node) {
        return nfa.nodes.indexOf(node) + (node.isInitial? "i" : "") + (node.isFinal? "f" : "");
    };
};

NFA.EPSILON = null;

NFA.Node = function(kind) {
    this.edges = [];
    this.isInitial = (kind || {}).isInitial || false;
    this.isFinal = (kind || {}).isFinal || false;

    this.link = function(to, value) {
        this.edges.push(new NFA.Edge(this, to, value));
    };
};

NFA.Node.INITIAL = { isInitial: true };
NFA.Node.FINAL = { isFinal: true };
NFA.Node.INITIAL_AND_FINAL = { isInitial: true, isFinal: true };

NFA.Edge = function(from, to, value) {
    this.from = from;
    this.to = to;
    this.value = value;

    this.consumes = function(token) {
        if (this.value instanceof Function) {
            return this.value(token);
        } else {
            return this.value === token;
        }
    };
};


NFA.empty = function() {
    var result = new NFA();
    result.add(new NFA.Node(NFA.Node.INITIAL_AND_FINAL));
    return result;
};

NFA.forToken = function(token) {
    var result = new NFA();
    result.add(new NFA.Node(NFA.Node.INITIAL)).link(result.add(new NFA.Node(NFA.Node.FINAL)), token);
    return result;
};

NFA.concatenation = function() {
    if (arguments.length == 0) {
        return NFA.empty();
    } else {
        var result = arguments[0];

        var concatenate = function(other) {
            var finals = [];
            var initials = [];

            for (var i = 0; i < result.nodes.length; i++) {
                var node = result.nodes[i];
                if (node.isFinal) {
                    finals.push(node);
                    node.isFinal = false;
                }
            }

            for (var j = 0; j < other.nodes.length; j++) {
                var node = other.nodes[j];
                result.add(node);
                if (node.isInitial) {
                    initials.push(node);
                    node.isInitial = false;
                }
            }

            for (var i = 0; i < finals.length; i++) {
                var nodeFinal = finals[i];
                for (var j = 0; j < initials.length; j++) {
                    var nodeInitial = initials[j];
                    nodeFinal.link(nodeInitial, NFA.EPSILON);
                }
            }
        };

        for (var i = 1; i < arguments.length; i++) {
            concatenate(arguments[i]);
        }

        return result;
    }
};

NFA.union = function() {
    if (arguments.length == 0) {
        return NFA.empty();
    } else {
        var result = new NFA();
        var initial = result.add(new NFA.Node(NFA.Node.INITIAL));

        var unite = function(other) {
            for (var i = 0; i < other.nodes.length; i++) {
                var node = other.nodes[i];
                result.add(node);
                if (node.isInitial) {
                    initial.link(node, NFA.EPSILON);
                    node.isInitial = false;
                }
            }
        };

        for (var i = 0; i < arguments.length; i++) {
            unite(arguments[i]);
        }

        return result;
    }
};

NFA.kleene = function(nfa) {
    var initials = [];
    var finals = [];

    for (var i = 0; i < nfa.nodes.length; i++) {
        var node = nfa.nodes[i];
        if (node.isInitial) {
            initials.push(node);
            node.isInitial = false;
        }
        if (node.isFinal) {
            finals.push(node);
        }
    }

    var initial = nfa.add(new NFA.Node(NFA.Node.INITIAL_AND_FINAL));

    for (var i = 0; i < initials.length; i++) {
        initial.link(initials[i], NFA.EPSILON);
        for (var j = 0; j < finals.length; j++) {
            finals[j].link(initials[i], NFA.EPSILON);
        }
    }

    return nfa;
};

NFA.quantify = function(nfa, min, max) {
    var result = NFA.empty();

    for (var i = 0; i < min; i++) {
        result = NFA.concatenation(result, nfa.clone());
    }

    for (var j = min; j < max; j++) {
        var optional = NFA.union(NFA.empty(), nfa.clone());
        result = NFA.concatenation(result, optional);
    }

    return result;
};

var PatternParser = function(pattern) {
    var i = -1;
    var next = pattern[0];

    /*
     * union         = concatenation ("|" concatenation)*
     * concatenation = ("(" union ")" quantifier? / terminal quantifier?)*
     * quantifier    = "*" / "?" / "{" min "," max "}" / "{" exactly "}"
     * terminal      = "[:digit:]" / "[:alpha:]" / "[:alnum:]" / [^()[]{}*?|]
     */

    var isEof = function() {
        return i+1 >= pattern.length;
    };

    var peek = function(string) {
        if (string) {
            return pattern.substr(i+1, string.length) == string;
        } else {
            return pattern[i+1];
        }
    };
    var read = function(string) {
        for (var i = 0; i < string.length; i++) {
            readToken(string[i]);
        }
        return true;
    };
    var readToken = function(expect) {
        if (isEof() || expect && expect != peek()) {
            if (isEof()) {
                throw "Unexpected end of input (expected " + expect + ")";
            } else {
                throw "Unexpected symbol " + peek() + " at position " + (i+1) + " (expected " + expect + ")";
            }
        } else {
            return pattern[++i];
        }
    };
    var peekAndRead = function(string) {
        return peek(string) && read(string);
    };

    var union = function() {
        var nfa = concatenation();
        while (peekAndRead("|")) {
            nfa = NFA.union(nfa, concatenation());
        }
        return nfa;
    };

    var concatenation = function() {
        var nfa = NFA.empty();
        while (!isEof()) {
            var nfaToken;
            if (peekAndRead("(")) {
                nfaToken = union();
                read(")");
            } else if (peekAndRead("\\")) {
                if (escapes.indexOf(peek()) != -1) {
                    nfaToken = NFA.forToken(readToken());
                } else {
                    throw "Invalid escape sequence at position " + (i+1);
                }
            } else if (peekAndRead("[")) {
                nfaToken = charclass();
                read("]");
            } else if (peekAndRead(".")) {
                nfaToken = NFA.forToken(function(token) { return true; });
            } else if (peek(")") || peek("|")) {
                break;
            } else if (peekQuantifier()) {
                throw "Invalid quantifier at position " + (i+1);
            } else {
                nfaToken = NFA.forToken(readToken());
            }

            if (peekQuantifier()) {
                nfaToken = quantifier(nfaToken);
            }
            nfa = NFA.concatenation(nfa, nfaToken);
        }
        return nfa;
    };

    var peekQuantifier = function() {
        if (peek("*") || peek("+") || peek("?")) {
            return true;
        } else if (peek("{")) {
            return pattern.substr(i+1).search(/\{\d+(,\d+)?\}/) == 0;
        } else {
            return false;
        }
    };

    var quantifier = function(nfa) {
        if (peekAndRead("*")) {
            return NFA.kleene(nfa);
        } else if (peekAndRead("+")) {
            return NFA.concatenation(nfa, NFA.kleene(nfa.clone()));
        } else if (peekAndRead("?")) {
            return NFA.quantify(nfa, 0, 1);
        } else if (peekAndRead("{")) {
            var min = integer();
            var max = min;
            if (peekAndRead(",")) {
                max = integer();
            }
            read("}");
            return NFA.quantify(nfa, min, max);
        } else {
            throw "Invalid quantifier at position " + (i+1);
        }
    };

    var charclass = function() {
        if (peekAndRead(":digit:")) {
            return NFA.forToken(function(token) { return /[0-9]/.test(token); });
        } else if (peekAndRead(":alpha:")) {
            return NFA.forToken(function(token) { return /[a-zA-Z]/.test(token); });
        } else if (peekAndRead(":alnum:")) {
            return NFA.forToken(function(token) { return /[a-zA-Z0-9]/.test(token); });
        } else {
            throw "Invalid character class at position " + (i+1);
        }
    };

    var integer = function() {
        var string = "";
        while (/[0-9]/.test(peek())) {
            string = string + readToken();
        }
        return Number(string);
    };

    var escapes = ["(", ")", "[", "]", "{", "}", "*", "+", "?", "|", "\\", "."];

    this.nfa = union();
    if (!isEof()) {
        throw "Expected end of input at position " + (i+1) + " (found " + peek() + ")";
    }

    this.nfa.begin();
};

/* vim: set et ts=4 sw=4: */
