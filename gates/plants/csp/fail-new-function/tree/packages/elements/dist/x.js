// Plant for the content-security check: built output.
export function build(source) {
  return new Function(source);
}
