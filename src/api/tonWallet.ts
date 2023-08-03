import BN from "bn.js";
import TonWeb from "tonweb";
import {Address} from "tonweb/dist/types/utils/address";
import {decToBN} from "@/ton-bridge-lib/Paranoid";
import {TonConnectUI} from "@tonconnect/ui";

async function burnJetton({
                              tonConnect,
                              destinationAddress,
                              userTonAddress,
                              jettonWalletAddress,
                              jettonAmountWithDecimals,
                          }: {
    tonConnect: TonConnectUI;
    destinationAddress: BN;
    userTonAddress: Address;
    jettonWalletAddress: Address | null;
    jettonAmountWithDecimals: BN;
}) {
    if (!tonConnect.connected) {
        throw new Error('TON not connected');
    }

    if (!jettonWalletAddress) {
        throw new Error('no jettonWalletAddress');
    }

    const burnOP = 0x595f07bc; // burn op
    const queryId = new TonWeb.utils.BN(0);

    const burnPayload = new TonWeb.boc.Cell();
    burnPayload.bits.writeUint(burnOP, 32);
    const customPayload = new TonWeb.boc.Cell();
    customPayload.bits.writeUint(destinationAddress, 160);
    burnPayload.bits.writeUint(queryId, 64);
    burnPayload.bits.writeCoins(jettonAmountWithDecimals);
    burnPayload.bits.writeAddress(userTonAddress);
    burnPayload.bits.writeBit(1);
    burnPayload.refs.push(customPayload);

    const payloadBase64 = TonWeb.utils.bytesToBase64(await burnPayload.toBoc(false));

    await tonConnect.sendTransaction(
        {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 1 minute
            messages: [{
                address: jettonWalletAddress.toString(true, true, true),
                amount: TonWeb.utils.toNano("1").toString(),
                payload: payloadBase64
            }]
        }
    );
}

async function mintJetton({
                              tonConnect,
                              queryId,
                              bridgeTonAddress,
                          }: {
    tonConnect: TonConnectUI;
    queryId: string;
    bridgeTonAddress: string;
}) {
    if (!tonConnect.connected) {
        throw new Error('TON not connected');
    }

    const mintOP = 8;

    const mintPayload = new TonWeb.boc.Cell();
    mintPayload.bits.writeUint(mintOP, 32);
    mintPayload.bits.writeUint(decToBN(queryId), 64);
    mintPayload.bits.writeUint(decToBN(queryId), 256);

    const payloadBase64 = TonWeb.utils.bytesToBase64(await mintPayload.toBoc(false));

    await tonConnect.sendTransaction(
        {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 1 minute
            messages: [{
                address: bridgeTonAddress,
                amount: TonWeb.utils.toNano("1").toString(),
                payload: payloadBase64
            }]
        }
    );
}

export {burnJetton, mintJetton};
