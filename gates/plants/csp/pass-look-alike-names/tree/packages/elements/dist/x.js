// Plant for the content-security check: built output.
function retrieval(x) {
  return x;
}
function isFunction(x) {
  return typeof x === "function";
}
export const checks = [retrieval(1), isFunction(retrieval)];
