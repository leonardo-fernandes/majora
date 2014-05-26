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

    this.consume = function(token) {
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

        state = closure(newState);
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
            result.add(new NFA.Node(node.isInitial, node.isFinal));
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

    this.follows = function() {
        var follows = [];
        for (var i = 0; i < state.length; i++) {
            var s = state[i];
            for (var j = 0; j < s.edges.length; j++) {
                var edge = s.edges[j];
                if (edge.value !== NFA.EPSILON && follows.indexOf(edge.value) == -1) {
                    follows.push(edge.value);
                }
            }
        }
        return follows;
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

NFA.Node = function(isInitial, isFinal) {
    this.edges = [];
    this.isInitial = isInitial || false;
    this.isFinal = isFinal || false;

    this.link = function(to, value) {
        this.edges.push(new NFA.Edge(this, to, value));
    };
};

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
    result.add(new NFA.Node(true, true));
    return result;
};

NFA.forToken = function(token) {
    var result = new NFA();
    result.add(new NFA.Node(true, false)).link(result.add(new NFA.Node(false, true)), token);
    return result;
};

NFA.concatenate = function(nfa1, nfa2) {
    var result = new NFA();
    var nfa1Finals = [];
    var nfa2Initials = [];

    for (var i = 0; i < nfa1.nodes.length; i++) {
        var node = nfa1.nodes[i];
        result.add(node);
        if (node.isFinal) {
            nfa1Finals.push(node);
            node.isFinal = false;
        }
    }

    for (var j = 0; j < nfa2.nodes.length; j++) {
        var node = nfa2.nodes[j];
        result.add(node);
        if (node.isInitial) {
            nfa2Initials.push(node);
            node.isInitial = false;
        }
    }

    for (var i = 0; i < nfa1Finals.length; i++) {
        var node1 = nfa1Finals[i];
        for (var j = 0; j < nfa2Initials.length; j++) {
            var node2 = nfa2Initials[j];
            node1.link(node2, NFA.EPSILON);
        }
    }

    return result;
};

NFA.union = function(nfa1, nfa2) {
    var result = new NFA();
    var initial = result.add(new NFA.Node(true, false));

    for (var i = 0; i < nfa1.nodes.length; i++) {
        var node = nfa1.nodes[i];
        result.add(node);
        if (node.isInitial) {
            initial.link(node, NFA.EPSILON);
            node.isInitial = false;
        }
    }

    for (var j = 0; j < nfa2.nodes.length; j++) {
        var node = nfa2.nodes[j];
        result.add(node);
        if (node.isInitial) {
            initial.link(node, NFA.EPSILON);
            node.isInitial = false;
        }
    }

    return result;
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

    var initial = nfa.add(new NFA.Node(true, true));

    for (var i = 0; i < initials.length; i++) {
        initial.link(initials[i], NFA.EPSILON);
        for (var j = 0; j < finals.length; j++) {
            finals[j].link(initials[i], NFA.EPSILON);
        }
    }

    return nfa;
};


var PatternParser = function(pattern) {
    var nfa = NFA.empty();


};
