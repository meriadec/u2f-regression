import invariant from "invariant";

export default class DeviceApp {
  constructor(transport, scrambleKey = "v1+", unwrap = true) {
    this.transport = transport;
    transport.setScrambleKey(scrambleKey);
    // $FlowFixMe : needs to be done in ledger-hw-transport-u2f
    transport.setUnwrap(unwrap);
  }

  async register(
    challenge,
    application,
    instanceName,
    instanceReference,
    instanceUrl,
    agentRole
  ) {
    invariant(
      challenge.length === 32,
      "challenge hex is expected to have 32 bytes"
    );
    const applicationBuf = Buffer.from(application, "hex");
    invariant(
      applicationBuf.length === 32,
      "application hex is expected to have 32 bytes"
    );

    const instanceNameBuf = Buffer.from(instanceName);
    const instanceReferenceBuf = Buffer.from(instanceReference);
    const instanceURLBuf = Buffer.from(instanceUrl);
    const agentRoleBuf = Buffer.from(agentRole);

    const maxLength = 200;

    const bigChunk = Buffer.concat([
      Buffer.from([instanceNameBuf.length]),
      instanceNameBuf,
      Buffer.from([instanceReferenceBuf.length]),
      instanceReferenceBuf,
      Buffer.from([instanceURLBuf.length]),
      instanceURLBuf,
      Buffer.from([agentRoleBuf.length]),
      agentRoleBuf
    ]);

    const length = Buffer.alloc(2);
    length.writeUInt16BE(bigChunk.length, 0);

    const chunks = this.splits(maxLength, bigChunk);

    const data = Buffer.concat([
      challenge,
      applicationBuf,
      length,
      chunks.shift()
    ]);

    let lastResponse = await await this.transport.send(
      0xe0,
      0x01,
      0x00,
      0x00,
      data
    );

    for (let i = 0; i < chunks.length; i++) {
      lastResponse = await this.transport.send(
        0xe0,
        0x01,
        0x80,
        0x00,
        chunks[i]
      );
    }

    let i = 0;
    const rfu = lastResponse.slice(i, (i += 1))[0];
    const pubKey = lastResponse.slice(i, (i += 65)).toString("hex");
    const keyHandleLength = lastResponse.slice(i, ++i)[0];
    const keyHandle = lastResponse.slice(i, (i += keyHandleLength));
    // const attestationSignature = lastResponse.slice(i, ++i)[0];
    // const signature = lastResponse.slice(i).toString("hex");
    return {
      u2f_register: lastResponse.slice(0, lastResponse.length - 2),
      keyHandle,
      rfu,
      pubKey
    };
  }

  splits(chunk, buffer) {
    const chunks = [];
    for (let i = 0, size = chunk; i < buffer.length; i += size, size = chunk) {
      chunks.push(buffer.slice(i, i + size));
    }
    return chunks;
  }
}
