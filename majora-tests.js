module("NFA");
test("Empty", function() {
    var nfa = NFA.empty();

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);
});

test("Single token", function() {
    var nfa = NFA.forToken("T");

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), ["T"]);

    nfa.consume("T");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);
});

test("Single function token", function() {
    var fn = function(token) { return token == "t" || token == "T"; };
    var nfa = NFA.forToken(fn);

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), [fn]);

    nfa.consume("t");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);
});

test("Non-accepting", function() {
    var nfa = NFA.forToken("T");

    nfa.begin();
    nfa.consume("x");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), []);
});

test("Concatenation", function() {
    var nfa = NFA.concatenate(NFA.forToken("a"), NFA.forToken("b"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);
});

test("Union", function() {
    var nfa = NFA.union(NFA.forToken("a"), NFA.forToken("b"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows().sort(), ["a", "b"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);

    nfa.begin();
    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);
});

test("Kleene", function() {
    var nfa = NFA.kleene(NFA.forToken("x"));

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["x"]);

    nfa.consume("x");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["x"]);

    nfa.consume("x");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["x"]);
});

test("Complex", function() {
    var nfa1 = NFA.concatenate(NFA.concatenate(NFA.forToken("a"), NFA.forToken("b")), NFA.forToken("c")) // abc
    var nfa2 = NFA.concatenate(NFA.forToken("a"), NFA.kleene(NFA.forToken("b"))); // ab*
    var nfa3 = NFA.kleene(NFA.concatenate(NFA.forToken("a"), NFA.forToken("b"))); // (ab)*

    var nfa = NFA.union(nfa1, NFA.union(nfa2, nfa3)); // abc | ab* | (ab)*

    nfa.begin();
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["a"]);

    nfa.consume("a");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows().sort(), ["a", "b", "c"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["b"]);

    nfa.begin();
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["a"]);

    nfa = NFA.concatenate(nfa, nfa.clone()); // (abc | ab* | (ab)*) (abc | ab* | (ab)*)

    nfa.begin();
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("c");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["a"]);

    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("c");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), []);

    nfa.begin();
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows().sort(), ["a", "b"]);

    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follows(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follows(), ["a"]);
});
