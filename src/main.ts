import { LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { ethers as ethers5 } from "ethers5"; 
import dotenv from 'dotenv';
import { actionWithEvmContractConditions } from "./action_evm.js";
import { createSessionSignatures } from "./session.js";
import { nodeWithEvmContractConditions } from "./node_evm.js";
import { nodeWithAccessControlConditionsCustomContract } from "./node_acc_custom.js";
import { publicationAbi, safeAbi } from "./abi.js";
import { nodeWithAccessControlConditionsAlwaysTrue } from "./node_acc_always_true.js";
import { actionWithACCAlwaysTrue } from "./action_acc_true.js";

dotenv.config();

const client = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
    debug: true 
});

const litProvider = new ethers5.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
const baseSepoliaProvider = new ethers5.providers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`)
const signer = new ethers5.Wallet(process.env.PRIVATE_KEY || "", litProvider);
await client.connect();

const content = "That dress is green";
const safeAddress = "0x47e03A42C07a09faB017b2a1011284d28C88121D";
const signerAddress = "0xD8B4502EC1cA915B3B6D292C0C3A61386783770F";
const publicationAddress = "0xF1D0159FaB4BFb3011c24a9d8479D6699eB6C34B";
const sessionSigs = await createSessionSignatures(client, signer, safeAddress);

const safeContract = new ethers5.Contract(safeAddress, safeAbi, baseSepoliaProvider);
const publicationContract = new ethers5.Contract(publicationAddress, publicationAbi, baseSepoliaProvider);
const isOwner = await safeContract.isOwner(signerAddress);
const canPublish = await publicationContract.canPublish(safeAddress);

// works as expected:
// await nodeWithAccessControlConditionsAlwaysTrue(client, sessionSigs, content, safeAddress);

// cant get safe contract call to work with access control conditions:  not authorized
// await nodeWithAccessControlConditionsCustomContract(client, sessionSigs, content, safeAddress);

// works as expected with needed functionality
// await nodeWithEvmContractConditions(client, sessionSigs, content, safeAddress, publicationAddress);

// works as expected:
// await actionWithACCAlwaysTrue(client, sessionSigs, content, safeAddress);

// errors, presumably because it expects access control conditions, not evm contract conditions:
// TypeError: serde_v8 error: invalid type; expected: array, got: undefined
await actionWithEvmContractConditions(client, sessionSigs, content, safeAddress, publicationAddress);

console.log('Is signer owner of safe:', isOwner);
console.log('Can signer publish:', canPublish);
