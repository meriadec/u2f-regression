import LedgerTransportU2F from "@ledgerhq/hw-transport-u2f";
import DeviceApp from "./DeviceApp";

const PARAMS = {
  application:
    "ad5be1a1fe011ce7f53ae081a22ae000a42021f3f94106a3bac9f76e8230e4b9",
  instanceName: "Crypto toto INC",
  instanceReference: "ledger1",
  instanceUrl: "vault.ledger.com",
  agentRole: "Administrator"
};

const CHALLENGE_STR =
  "30e533bc2a552caf87ac8be81fa068b912eb97f068a0c39d9c119eaa6cd2069c";

const CHALLENGE = Buffer.from(CHALLENGE_STR, "hex");

async function main() {
  console.log(`>> creating transport...`);
  const transport = await LedgerTransportU2F.create();
  transport.setDebugMode(true);

  console.log(`>> creating device app instance...`);
  const instance = new DeviceApp(transport);

  console.log(`>> registering...`);
  try {
    await instance.register(
      CHALLENGE,
      PARAMS.application,
      PARAMS.instanceName,
      PARAMS.instanceReference,
      PARAMS.instanceUrl,
      PARAMS.agentRole
    );
    console.log(`>> success lol`);
  } catch (err) {
    console.log(`X GOT AN ERROR:`, err);
  }
}

main();
