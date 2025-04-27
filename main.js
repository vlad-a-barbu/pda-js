import PushdownStateMachine from "./psm.js";

const NumberMachine = new PushdownStateMachine(
  "Number",
  {
    digit: {
      cond: (x) => /[0-9]/.test(x),
    },
  },
  {
    start: ["digit"],
    digit: ["digit"],
  },
  ["digit"]
);

const StringMachine = new PushdownStateMachine(
  "String",
  {
    stringStart: {
      cond: (x) => x === '"',
    },
    stringChar: {
      cond: (x) => x !== '"',
    },
    stringEnd: {
      cond: (x) => x === '"',
    },
  },
  {
    start: ["stringStart"],
    stringStart: ["stringChar", "stringEnd"],
    stringChar: ["stringChar", "stringEnd"],
    stringEnd: [],
  },
  ["stringEnd"]
);

const ArrayMachine = new PushdownStateMachine(
  "Array",
  {
    arrayStart: {
      cond: (x) => x === "[",
      stackOp: "push",
      pushSymbol: "array",
    },

    number: {
      cond: (x) => /[0-9]/.test(x),
    },

    stringStart: {
      cond: (x) => x === '"',
    },
    stringChar: {
      cond: (x) => x !== '"',
    },
    stringEnd: {
      cond: (x) => x === '"',
    },

    nestedArrayStart: {
      cond: (x) => x === "[",
      stackOp: "push",
      pushSymbol: "array",
    },

    comma: {
      cond: (x) => x === ",",
    },

    arrayEnd: {
      cond: (x) => x === "]",
      stackOp: "pop",
    },
  },
  {
    start: ["arrayStart"],
    arrayStart: ["number", "stringStart", "nestedArrayStart", "arrayEnd"],

    number: ["number", "comma", "arrayEnd"],

    stringStart: ["stringChar", "stringEnd"],
    stringChar: ["stringChar", "stringEnd"],
    stringEnd: ["comma", "arrayEnd"],

    nestedArrayStart: ["number", "stringStart", "nestedArrayStart", "arrayEnd"],

    comma: ["number", "stringStart", "nestedArrayStart"],

    arrayEnd: ["comma", "arrayEnd"],
  },
  ["arrayEnd"]
);

const testInputs = {
  number: "123",
  string: '"abc"',
  simpleArray: '[123,"abc"]',
  nestedArray: '[123,"abc",[2,[3,4]]]',
  whitespaceArray: '[ 123 , "abc" , [ 2 , [ 3 , 4 ] ] ]',
};

function runTests() {
  console.log(`Number: ${NumberMachine.process(testInputs.number).accepted}`);
  console.log(`String: ${StringMachine.process(testInputs.string).accepted}`);

  console.log(
    `\nSimple array: ${ArrayMachine.process(testInputs.simpleArray).accepted}`
  );
  console.log(
    `Nested array: ${ArrayMachine.process(testInputs.nestedArray).accepted}`
  );
  console.log(
    `Array with whitespace: ${
      ArrayMachine.process(testInputs.whitespaceArray).accepted
    }`
  );
}

runTests();
