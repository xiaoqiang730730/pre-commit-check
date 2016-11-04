    (function() {
    var a = {
        name: 'a',
        value: '222',
    };
    var b = 'test2';
    var testFunc = function() {
        c = a + b;
        console.log(c);
    };
    testFunc();
});