import TonWeb from "tonweb";
import {WalletContract} from "tonweb/dist/types/contract/wallet/wallet-contract";

const BN = TonWeb.utils.BN;

export const getNumber = (pair: string[]): number => parseInt(pair[1], 16);

export const getBN = (pair: string[]) /* TonWeb.utils.BN */ => new BN(pair[1].substr(2), 16);

export const findLogOutMsg = (outMessages?: any[]): any => {
    if (!outMessages) return null;
    for (const outMsg of outMessages) {
        if (outMsg.destination === '') return outMsg;
    }
    return null;
}

export const getRawMessageBytes = (logMsg: any): Uint8Array | null => {
    const message = logMsg.message.substr(0, logMsg.message.length - 1); // remove '\n' from end
    return TonWeb.utils.base64ToBytes(message);
}

export const getTextMessageBytes = (logMsg: any): Uint8Array | null => {
    const message = logMsg.msg_data?.text;
    const textBytes = TonWeb.utils.base64ToBytes(message);
    const bytes = new Uint8Array(textBytes.length + 4);
    bytes.set(textBytes, 4);
    return bytes;
}

export const getMessageBytes = (logMsg: any): Uint8Array | null => {
    const msgType = logMsg.msg_data['@type'];
    if (msgType === 'msg.dataText') {
        return getTextMessageBytes(logMsg);
    } else if (msgType === 'msg.dataRaw') {
        return getRawMessageBytes(logMsg);
    } else {
        console.error('Unknown log msg type ' + msgType);
        return null;
    }
}

export const makeAddress = (address: string): string => {
    if (!address.startsWith('0x')) throw new Error('Invalid address ' + address);
    let hex = address.substr(2);
    while (hex.length < 40) {
        hex = '0' + hex;
    }
    return '0x' + hex;
}

export async function sendInternal(tonweb: TonWeb, wallet: WalletContract, secretKey: Uint8Array, byteArray: any /* Uint8Array | TonWeb.boc.Cell */, toAddress: string): Promise<boolean> {
    let seqno = await wallet.methods.seqno().call();
    if (!seqno) {
        seqno = 0;
    }
    const query = await wallet.methods.transfer({
        secretKey: secretKey,
        toAddress: toAddress,
        amount: TonWeb.utils.toNano('5'), // на газ, остаток вернется
        seqno: seqno,
        payload: byteArray,
        sendMode: 3
    });

    const sendResponse = await query.send();
    if (sendResponse["@type"] === "ok") {
        await wait(4000); // дадим выполниться чтобы далее получить верный seqno
        return true;
    } else {
        console.error(sendResponse);
        return false;
    }
}

function wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), ms);
    });
}