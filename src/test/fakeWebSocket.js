/** Minimal WebSocket stand-in for hook tests. Install with installFakeWebSocket(). */
export class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    this.binaryType = "blob";
    FakeWebSocket.instances.push(this);
  }

  send(data) {
    if (this.readyState !== FakeWebSocket.OPEN) throw new Error("not open");
    this.sent.push(data);
  }

  close(code = 1000) {
    this.readyState = FakeWebSocket.CLOSED;
    this.closedWith = code;
  }

  // ---- test controls
  serverOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({});
  }

  serverSend(message) {
    this.onmessage?.({ data: typeof message === "string" ? message : JSON.stringify(message) });
  }

  serverSendBinary(buffer) {
    this.onmessage?.({ data: buffer });
  }

  serverClose(code) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code });
  }

  sentJson() {
    return this.sent.filter((d) => typeof d === "string").map((d) => JSON.parse(d));
  }
}

export function installFakeWebSocket() {
  FakeWebSocket.instances = [];
  const original = globalThis.WebSocket;
  globalThis.WebSocket = FakeWebSocket;
  return () => {
    globalThis.WebSocket = original;
  };
}
