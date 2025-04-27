export const ret = (val) => ({ val });
export const recur = (...args) => ({ args });
export const run = (f, ...initialArgs) => {
  let args = initialArgs;
  while (true) {
    const result = f(...args);
    if ("val" in result) {
      return result.val;
    }
    args = result.args;
  }
};
