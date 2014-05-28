module("NFA");

test("Empty", function() {
    var nfa = NFA.empty();

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Single token", function() {
    var nfa = NFA.forToken("T");

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["T"]);

    nfa.consume("T");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Single function token", function() {
    var fn = function(token) { return token == "t" || token == "T"; };
    var nfa = NFA.forToken(fn);

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), [fn]);

    nfa.consume("t");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Not-accept", function() {
    var nfa = NFA.forToken("T");

    nfa.begin();
    nfa.consume("x");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), []);
});

test("Concatenation", function() {
    var nfa = NFA.concatenation(NFA.forToken("a"), NFA.forToken("b"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Concatenate zero", function() {
    var nfa = NFA.concatenation();

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Concatenate one", function() {
    var nfa = NFA.concatenation(NFA.forToken("a"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Concatenate many", function() {
    var nfa = NFA.concatenation(
        NFA.forToken("a"),
        NFA.forToken("b"),
        NFA.forToken("c"),
        NFA.forToken("d")
    );

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("abc");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["d"]);

    nfa.consume("d");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Union", function() {
    var nfa = NFA.union(NFA.forToken("a"), NFA.forToken("b"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow().sort(), ["a", "b"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow().sort(), ["a", "b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Union zero", function() {
    var nfa = NFA.union();

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Union one", function() {
    var nfa = NFA.union(NFA.forToken("a"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Union many", function() {
    var nfa = NFA.union(
        NFA.forToken("a"),
        NFA.forToken("b"),
        NFA.forToken("c"),
        NFA.forToken("d")
    );

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow().sort(), ["a", "b", "c", "d"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);

    nfa.begin();
    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Kleene", function() {
    var nfa = NFA.kleene(NFA.forToken("x"));

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["x"]);

    nfa.consume("x");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["x"]);

    nfa.consume("x");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["x"]);
});

test("Quantify", function() {
    var nfa = NFA.quantify(NFA.concatenation(NFA.forToken("a"), NFA.forToken("b")), 2, 3);

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("ab");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("ab");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("ab");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);
});

test("Complex", function() {
    var nfa1 = NFA.concatenation(NFA.concatenation(NFA.forToken("a"), NFA.forToken("b")), NFA.forToken("c")) // abc
    var nfa2 = NFA.concatenation(NFA.forToken("a"), NFA.kleene(NFA.forToken("b"))); // ab*
    var nfa3 = NFA.kleene(NFA.concatenation(NFA.forToken("a"), NFA.forToken("b"))); // (ab)*

    var nfa = NFA.union(nfa1, NFA.union(nfa2, nfa3)); // abc | ab* | (ab)*

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow().sort(), ["a", "b", "c"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["b"]);

    nfa.begin();
    nfa.consume("aba");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa = NFA.concatenation(nfa, nfa.clone()); // (abc | ab* | (ab)*) (abc | ab* | (ab)*)

    nfa.begin();
    nfa.consume("abc");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("abc");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);

    nfa.begin();
    nfa.consume("abb");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow().sort(), ["a", "b"]);

    nfa.consume("aba");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);
});

test("Event not-accept", function() {
    var digit = function(token) { return /[0-9]/.test(token); };
    var nfa = NFA.concatenation(
        NFA.quantify(NFA.forToken(digit), 4, 4),
        NFA.forToken("-"),
        NFA.quantify(NFA.forToken(digit), 2, 2),
        NFA.forToken("-"),
        NFA.quantify(NFA.forToken(digit), 2, 2));

    $(nfa).on("not-accept", function(evt) {
        var follow = nfa.follow();
        if (follow.length == 1 && !(follow[0] instanceof Function)) {
            nfa.consume(follow[0]);
            nfa.consume(evt.token);
        }
        evt.preventDefault();
    });

    nfa.begin();
    nfa.consume("2014-01-01");
    equal(nfa.isFinal(), true);

    nfa.begin();
    nfa.consume("20140101");
    equal(nfa.isFinal(), true);

    nfa.begin();
    nfa.consume("20-14-01-01");
    equal(nfa.isFinal(), true);
});

module("PatternParser");

test("Empty", function() {
    var parser = new PatternParser("");

    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), []);
});

test("Invalid", function() {
    throws(function() {
        new PatternParser("*");
    });
    throws(function() {
        new PatternParser("a|+");
    });
    throws(function() {
        new PatternParser("a*?");
    });
    throws(function() {
        new PatternParser("({3,5})");
    });
    throws(function() {
        new PatternParser("(");
    });
    throws(function() {
        new PatternParser(")");
    });
});

test("Concatenation", function() {
    var parser = new PatternParser("abc");

    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), ["a"]);

    parser.nfa.consume("abc");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), []);
});

test("Union", function() {
    var parser = new PatternParser("abc|def");

    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow().sort(), ["a", "d"]);

    parser.nfa.consume("abc");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), []);

    parser.nfa.begin();
    parser.nfa.consume("def");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), []);
});

test("Union empty", function() {
    var parser = new PatternParser("abc|");

    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), ["a"]);
});

test("Kleene", function() {
    var parser = new PatternParser("abc*");

    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), ["a"]);

    parser.nfa.consume("ab");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), ["c"]);

    parser.nfa.consume("ccccccc");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), ["c"]);
});

test("Other quantifiers", function() {
    var parser = new PatternParser("a?bc{2,3}");

    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow().sort(), ["a", "b"]);

    parser.nfa.consume("b");
    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), ["c"]);

    parser.nfa.consume("c");
    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), ["c"]);

    parser.nfa.consume("c");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), ["c"]);

    parser.nfa.consume("c");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow(), []);
});

test("Special literals", function() {
    var parser = new PatternParser("{23:24}");
    parser.nfa.consume("{23:24}");
    equal(parser.nfa.isFinal(), true);

    parser = new PatternParser("]a;b]");
    parser.nfa.consume("]a;b]");
    equal(parser.nfa.isFinal(), true);
});

test("Escape sequences", function() {
    var parser = new PatternParser("\\(a\\*\\)\\|a\\?\\\\\\.\\{2,3\\}");

    parser.nfa.consume("(a*)|a?\\.{2,3}")
    equal(parser.nfa.isFinal(), true);
});

test("Complex", function() {
    var parser = new PatternParser("((x|y){2,3}-){2}.(x|y|z)*");

    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow().sort(), ["x", "y"]);

    parser.nfa.consume("xy-xxx-kxxyzz");
    equal(parser.nfa.isFinal(), true);
    deepEqual(parser.nfa.follow().sort(), ["x", "y", "z"]);

    parser.nfa.begin();
    parser.nfa.consume("xxy-y-");
    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), []);

    parser.nfa.begin();
    parser.nfa.consume("xxx-yz");
    equal(parser.nfa.isFinal(), false);
    deepEqual(parser.nfa.follow(), []);
});

/* vim: set et ts=4 sw=4: */
