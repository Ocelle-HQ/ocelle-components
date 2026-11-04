// The no-network preload of the Storybook build (FR-023 "the build MUST make no network request", analysis E2;
// research.md R-10): loaded with `--import` (through NODE_OPTIONS, so every Node child process of the build loads it
// too), it records every outbound socket connection and DNS lookup to a host that is not loopback as one JSON line
// in the file OCELLE_NO_NETWORK_LOG names, and fails the connection.
import { appendFileSync } from "node:fs";
import dns from "node:dns";
import net from "node:net";

/** One recorded network access. */
export interface NetworkAccess {
  readonly kind: "connect" | "dns";
  readonly host: string;
  readonly port?: number;
}

const log = process.env.OCELLE_NO_NETWORK_LOG;

function isLoopback(host: string): boolean {
  return host === "localhost" || host === "::1" || host.startsWith("127.") || host === "" || host === "0.0.0.0" || host === "::";
}

/** Records an access to a non-loopback host; true when it was recorded (and must fail). */
function record(access: NetworkAccess): boolean {
  if (isLoopback(access.host)) return false;
  if (log !== undefined && log !== "") appendFileSync(log, `${JSON.stringify(access)}\n`);
  return true;
}

/** The host and port of `socket.connect(...)`'s arguments, undefined for an IPC path. */
function target(args: readonly unknown[]): { host: string; port: number } | undefined {
  const first = Array.isArray(args[0]) ? (args[0] as unknown[])[0] : args[0];
  if (typeof first === "object" && first !== null) {
    const options = first as { readonly host?: unknown; readonly port?: unknown; readonly path?: unknown };
    if (options.path !== undefined) return undefined;
    return { host: typeof options.host === "string" ? options.host : "localhost", port: Number(options.port) };
  }
  if (typeof first === "number" || (typeof first === "string" && /^\d+$/.test(first))) {
    return { host: typeof args[1] === "string" ? args[1] : "localhost", port: Number(first) };
  }
  return undefined;
}

const connect = Reflect.get(net.Socket.prototype, "connect") as (this: net.Socket, ...args: unknown[]) => net.Socket;
net.Socket.prototype.connect = function (this: net.Socket, ...args: unknown[]): net.Socket {
  const to = target(args);
  if (to !== undefined && record({ kind: "connect", host: to.host, port: to.port })) {
    process.nextTick(() => this.destroy(new Error(`network access blocked: ${to.host}:${String(to.port)}`)));
    return this;
  }
  return connect.apply(this, args);
};

const lookup = dns.lookup;
dns.lookup = function (hostname: string, ...rest: unknown[]): void {
  record({ kind: "dns", host: hostname });
  (lookup as (...each: unknown[]) => void).call(dns, hostname, ...rest);
} as typeof dns.lookup;

const promisesLookup = dns.promises.lookup;
dns.promises.lookup = function (hostname: string, ...rest: unknown[]): Promise<unknown> {
  record({ kind: "dns", host: hostname });
  return (promisesLookup as (...each: unknown[]) => Promise<unknown>).call(dns.promises, hostname, ...rest);
} as typeof dns.promises.lookup;

const resolve = dns.resolve;
dns.resolve = function (hostname: string, ...rest: unknown[]): void {
  record({ kind: "dns", host: hostname });
  (resolve as (...each: unknown[]) => void).call(dns, hostname, ...rest);
} as typeof dns.resolve;
