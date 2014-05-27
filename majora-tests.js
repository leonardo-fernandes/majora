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

test("Non-accepting", function() {
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

test("Union", function() {
    var nfa = NFA.union(NFA.forToken("a"), NFA.forToken("b"));

    nfa.begin();
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow().sort(), ["a", "b"]);

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
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa = NFA.concatenation(nfa, nfa.clone()); // (abc | ab* | (ab)*) (abc | ab* | (ab)*)

    nfa.begin();
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("c");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);

    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("c");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), []);

    nfa.begin();
    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow().sort(), ["a", "b"]);

    nfa.consume("a");
    nfa.consume("b");
    nfa.consume("a");
    equal(nfa.isFinal(), false);
    deepEqual(nfa.follow(), ["b"]);

    nfa.consume("b");
    equal(nfa.isFinal(), true);
    deepEqual(nfa.follow(), ["a"]);
});

/* vim: set et ts=4 sw=4: */
