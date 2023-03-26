import TonWeb from "tonweb";
import {Bytes} from "@ethersproject/bytes/src.ts";
import {decToBN, decToHex, hexToBN, hexToDec} from "./Paranoid"
import {splitSignature} from "ethers/lib/utils";
import {makeAddress, sendInternal} from "./BridgeTonUtils";
import {WalletContract} from "tonweb/dist/types/contract/wallet/wallet-contract";
import {ethers} from "ethers";

export interface EvmSignature {
    publicKey: string; // secp_key (ethereum oracle address) in hex, starts with 0x
    r: string; // 256bit in hex, starts with 0x
    s: string; // 256bit in hex, starts with 0x
    v: number; // 8bit
}

export interface EvmSignatures {
    signatures: EvmSignature[];
}

const checkV = (v: number): void => {
    if (v !== 27 && v !== 28) throw new Error('invalid v');
}

export const parseEvmSignature = (data: any): EvmSignature => {
    const tuple: any[] = data.tuple.elements;
    const publicKey: string = makeAddress(decToHex(tuple[0].number.number));

    const rsv: any[] = tuple[1].tuple.elements;
    const r: string = decToHex(rsv[0].number.number);
    const s: string = decToHex(rsv[1].number.number);
    const v: number = Number(rsv[2].number.number);
    checkV(v);
    return {
        publicKey,
        r,
        s,
        v
    }
}

/**
 * @param voteId - hash of vote like '0xFF5856350817700B84368727835EEFE9BB10D8DB23FF4311F6936747ABC32308'
 */
export async function getEvmSignaturesFromCollector(tonweb: TonWeb, tonCollectorAddress: string, voteId: string): Promise<EvmSignatures | null> {
    const intVoteId = hexToDec(voteId);
    console.log('getEvmSignaturesFromCollector ', voteId, intVoteId);

    const result: any = await tonweb.provider.call(tonCollectorAddress, 'get_external_voting_data', [['num', intVoteId]]);
    console.log('getEvmSignaturesFromCollector raw result', result);
    if (result.exit_code === 309) {
        console.log('getEvmSignaturesFromCollector 309 no found')
        return null;
    }
    const list: any[] = result.stack[0][1].elements;

    const status: EvmSignatures = {
        signatures: list.map(parseEvmSignature)
    };
    console.log('getEvmSignaturesFromCollector parsed result', status);

    return status;
}

export async function sendToCollector(tonweb: TonWeb, wallet: WalletContract, secretKey: Uint8Array, tonCollectorAddress: string, voteId: string, signature: Bytes | string): Promise<boolean> {
    const myAddress = await wallet.getAddress();

    console.log('sendToCollector voteId=', voteId, 'signature=', signature, 'from ' + myAddress.toString(true));

    const s = splitSignature(signature);
    checkV(s.v);

    const bits = new TonWeb.boc.BitString(32 + 64 + 256 + 256 + 256 + 8);
    bits.writeUint(decToBN(5), 32); // op
    bits.writeUint(decToBN(0), 64); // query_id
    bits.writeUint(hexToBN(voteId), 256);
    bits.writeUint(hexToBN(s.r), 256);
    bits.writeUint(hexToBN(s.s), 256);
    bits.writeUint(decToBN(s.v), 8);

    return sendInternal(tonweb, wallet, secretKey, bits.array, tonCollectorAddress);
}

/**
 * Prepare sorted signatures to send to EVM smart contract
 */
export function prepareEthSignatures(signatures: EvmSignature[]): { signer: string, signature: string }[] {
    return signatures
        .map(signature => {
            return {
                signer: signature.publicKey,
                signature: ethers.utils.joinSignature({r: signature.r, s: signature.s, v: signature.v}),
            };
        })
        .sort((a, b) => {
            return hexToBN(a.signer).cmp(hexToBN(b.signer));
        });
}