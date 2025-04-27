import { ret, recur, run } from "./trampoline.js";

export default class PushdownStateMachine {
  constructor(name, states, transitions, acceptStates) {
    this.name = name;
    this.states = states;
    this.transitions = transitions;
    this.acceptStates = acceptStates;
  }

  canStart(char) {
    for (const state of this.transitions.start || []) {
      const stateDefn = this.states[state];
      if (stateDefn && stateDefn.cond && stateDefn.cond(char)) {
        return true;
      }
    }

    for (const state of this.transitions.start || []) {
      const stateDefn = this.states[state];
      if (stateDefn && stateDefn.delegate) {
        try {
          const delegate = stateDefn.delegate();
          if (delegate && delegate.canStart(char)) {
            return true;
          }
        } catch (e) {
          continue;
        }
      }
    }

    return false;
  }

  skipWhitespace(input, i) {
    let j = i;
    while (j < input.length && /\s/.test(input[j])) {
      j++;
    }
    return [j > i, j];
  }

  process(input) {
    const processStep = (currentState, stack, i) => {
      if (i >= input.length) {
        const isAccepted =
          this.acceptStates.includes(currentState) && stack.length === 0;
        return ret({ accepted: isAccepted, remaining: "", stack });
      }

      const char = input[i];

      if (currentState !== "stringChar") {
        const [skipped, newIndex] = this.skipWhitespace(input, i);
        if (skipped) {
          return recur(currentState, stack, newIndex);
        }
      }

      let nextState;
      let nestedProcessed = false;
      let nestedConsumed = 0;
      let nestedStack = [];

      const possibleTransitions = this.transitions[currentState] || [];
      for (const state of possibleTransitions) {
        const stateDefn = this.states[state];
        if (stateDefn && stateDefn.cond && stateDefn.cond(char)) {
          nextState = state;
          break;
        }
      }

      if (!nextState) {
        for (const state of possibleTransitions) {
          const stateDefn = this.states[state];
          if (stateDefn && stateDefn.delegate) {
            try {
              const delegate = stateDefn.delegate();
              if (delegate && delegate.canStart(char)) {
                const result = delegate.process(input.slice(i));
                if (result.accepted) {
                  nextState = state;
                  nestedProcessed = true;
                  nestedConsumed =
                    input.slice(i).length - result.remaining.length;
                  nestedStack = result.stack;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      if (!nextState) {
        return ret({ accepted: false, remaining: input.slice(i), stack });
      }

      if (nestedProcessed) {
        return recur(nextState, [...stack, ...nestedStack], i + nestedConsumed);
      } else {
        const stateDefn = this.states[nextState];
        const newStack = [...stack];

        if (stateDefn && stateDefn.stackOp === "push" && stateDefn.pushSymbol) {
          newStack.push(stateDefn.pushSymbol);
        } else if (stateDefn && stateDefn.stackOp === "pop") {
          if (newStack.length === 0) {
            return ret({ accepted: false, remaining: input.slice(i), stack });
          }
          newStack.pop();
        }
        return recur(nextState, newStack, i + 1);
      }
    };

    return run(processStep, "start", [], 0);
  }
}
