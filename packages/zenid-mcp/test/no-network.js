// SPEC-011 T011 — the network boundary, enforced during the protocol test.
//
// Loaded with --import into the server subprocess. Every outbound path throws,
// so BR-001 is proven by the server completing a full session rather than by
// anyone's assurance that it does not call out. A machine that happens to be
// offline would prove nothing; this fails loudly instead.

import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";

function forbid(what) {
  return () => {
    throw new Error(`SPEC-011 AC-011 violation: zenid-mcp attempted an outbound ${what} connection.`);
  };
}

net.connect = forbid("net");
net.createConnection = forbid("net");
tls.connect = forbid("tls");
dns.lookup = forbid("dns");
dns.promises.lookup = forbid("dns");
http.request = forbid("http");
http.get = forbid("http");
https.request = forbid("https");
https.get = forbid("https");
globalThis.fetch = forbid("fetch");
globalThis.WebSocket = function () {
  throw new Error("SPEC-011 AC-011 violation: zenid-mcp attempted to open a WebSocket.");
};
