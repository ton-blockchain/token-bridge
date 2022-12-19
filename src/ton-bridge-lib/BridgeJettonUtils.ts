import TonWeb from "tonweb";
import {Address} from "tonweb/dist/types/utils/address";

const OFFCHAIN_CONTENT_PREFIX = 0x01;

export const parseUri = (bytes: any) => {
    return new TextDecoder().decode(bytes);
};

export const parseOffchainUriCell = (cell: any) => {
    if (cell.bits.array[0] !== OFFCHAIN_CONTENT_PREFIX) {
        throw new Error("no OFFCHAIN_CONTENT_PREFIX");
    }

    let length = 0;
    let c = cell;
    while (c) {
        length += c.bits.array.length;
        c = c.refs[0];
    }

    const bytes = new Uint8Array(length);
    length = 0;
    c = cell;
    while (c) {
        bytes.set(c.bits.array, length);
        length += c.bits.array.length;
        c = c.refs[0];
    }
    return parseUri(bytes.slice(1)); // slice OFFCHAIN_CONTENT_PREFIX
};

export const readIntFromBitString = (bs: any, cursor: any, bits: any) => {
    let n = BigInt(0);
    for (let i = 0; i < bits; i++) {
        n *= BigInt(2);
        n += BigInt(bs.get(cursor + i));
    }
    return n;
};

export const parseAddress = (cell: any) => {
    let n = readIntFromBitString(cell.bits, 3, 8);
    if (n > BigInt(127)) {
        n = n - BigInt(256);
    }
    const hashPart = readIntFromBitString(cell.bits, 3 + 8, 256);
    if (n.toString(10) + ":" + hashPart.toString(16) === "0:0") return null;
    const s = n.toString(10) + ":" + hashPart.toString(16).padStart(64, "0");
    return new TonWeb.Address(s);
};

export async function getJettonWalletData(tonweb: any, jettonWalletAddress: string) {
    const jettonWalletData = await tonweb.provider.call2(
        jettonWalletAddress,
        "get_wallet_data"
    );

    const balance = jettonWalletData[0];
    const ownerAddress = parseAddress(jettonWalletData[1]);
    const jettonMinterAddress = parseAddress(jettonWalletData[2]);
    const jettonWalletCode = jettonWalletData[3];

    return {
        balance,
        ownerAddress,
        jettonMinterAddress,
        jettonWalletCode,
    };
}

export async function getJettonData(tonweb: any, jettonMinterAddress: string) {
    const jettonData = await tonweb.provider.call2(
        jettonMinterAddress,
        "get_jetton_data",
        []
    );
    const totalSupply = jettonData[0];
    const isMutable = jettonData[1].toNumber() === -1;
    const adminAddress = parseAddress(jettonData[2]);
    const jettonContentUri = parseOffchainUriCell(jettonData[3]);
    const tokenWalletCode = jettonData[4];

    return {
        totalSupply,
        isMutable,
        adminAddress,
        jettonContentUri,
        tokenWalletCode,
    };
}

export async function getWrappedTokenData(tonweb: any, jettonWalletAddress: string) {
    const wrappedTokenData = await tonweb.provider.call2(
        jettonWalletAddress,
        "get_wrapped_token_data",
        []
    );

    const chainId = wrappedTokenData[0].toString();
    const tokenAddress = "0x" + wrappedTokenData[1].toString("hex");
    const decimals = wrappedTokenData[2].toString();
    return {chainId, tokenAddress, decimals};
}

export async function getJettonWalletAddress({
                                          tonweb,
                                          userTonAddress,
                                          tokenAddress,
                                      }: {
    tonweb: any;
    userTonAddress: Address;
    tokenAddress: string;
}) {
    const cell = new TonWeb.boc.Cell();

    cell.bits.writeAddress(userTonAddress);

    const getWalletAddressResponse = await tonweb.provider.call2(
        tokenAddress,
        "get_wallet_address",
        [["tvm.Slice", TonWeb.utils.bytesToBase64(await cell.toBoc(false))]]
    );
    const jettonWalletAddress = parseAddress(getWalletAddressResponse);
    return jettonWalletAddress;
}