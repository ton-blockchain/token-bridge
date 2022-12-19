import {EvmTransaction, getQueryId} from "./BridgeCommon";
import TonWeb from "tonweb";
import {sendInternal, getNumber} from "./BridgeTonUtils";
import {WalletContract} from "tonweb/dist/types/contract/wallet/wallet-contract";

export function getMultisigWalletId(chainId: number): number {
    switch (chainId) {
        case 56: // BSC mainnet
            return 3;
        case 97: // BSC testnet
            return 3;
        case 1: // ETH mainnet
            return 4;
        case 5: // ETH testnet Goerli
            return 5;
    }
    throw new Error('unknown chainId ' + chainId);
}

export async function getVotesInMultisig(tonweb: TonWeb, tonMultisigAddress: string, queryId: string, oraclesTotal: number): Promise<null | number[]> {
    console.log("getVotesInMultisig ", queryId);

    const result: any = await tonweb.provider.call(tonMultisigAddress, 'get_query_state', [["num", queryId]]);

    const a = getNumber(result.stack[0]);
    const b = getNumber(result.stack[1]);

    const arr: number[] = [];

    const count = a === -1 ? oraclesTotal : b.toString(2).split('0').join('').length; // count of bits

    for (let i = 0; i < count; i++) {
        arr.push(1);
    }
    return arr;
}

export async function hasMyVoteInMultisig(tonweb: TonWeb, tonMultisigAddress: string, tonMultisigIndex: number, ethToTon: EvmTransaction): Promise<boolean> {
    const queryId = getQueryId(ethToTon).toString();

    console.log('hasMyVoteInMultisig ', queryId);

    const result: any = await tonweb.provider.call(tonMultisigAddress, 'message_signed_by_id?', [['num', tonMultisigIndex], ['num', queryId]]);
    console.log('hasMyVoteInMultisig raw result', result);
    const stack: any[] = result.stack;

    return getNumber(stack[0]) === -1;
}

export async function sendToMultisig(tonweb: TonWeb, wallet: WalletContract, secretKey: Uint8Array, tonMultisigAddress: string, tonMultisigIndex: number, chainId: number, tonBridgeAddress: string, ethToTon: EvmTransaction, payload: any /* Cell */): Promise<boolean> {
    const myAddress = await wallet.getAddress();
    const queryId = getQueryId(ethToTon);
    console.log('sendToMultisig', ethToTon, 'from ' + myAddress.toString(true) + ' with query id ' + queryId.toString() + ' and index ' + tonMultisigIndex + ' to ' + tonMultisigAddress);

    const WALLET_ID = getMultisigWalletId(chainId);

    const orderHeader = TonWeb.Contract.createInternalMessageHeader(new TonWeb.utils.Address(tonBridgeAddress), TonWeb.utils.toNano('0.5'));
    const msgToBridge = TonWeb.Contract.createCommonMsgInfo(orderHeader, undefined, payload);

    const cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(tonMultisigIndex, 8);
    cell.bits.writeBit(0); // null signatures dict
    cell.bits.writeUint(WALLET_ID, 32);
    cell.bits.writeUint(queryId, 64);
    cell.bits.writeUint(3, 8); // send mode 3
    cell.refs.push(msgToBridge);

    const rootHash: Uint8Array = await cell.hash();
    const rootSignature: Uint8Array = TonWeb.utils.nacl.sign.detached(rootHash, secretKey);

    const body = new TonWeb.boc.Cell();
    body.bits.writeBytes(rootSignature);
    body.writeCell(cell);
    return sendInternal(tonweb, wallet, secretKey, body, tonMultisigAddress);
}