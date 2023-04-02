import TonWeb from "tonweb";
import {Address} from "tonweb/dist/types/utils/address";
import {bytesToBase64, checkNull, decToBN} from "./Paranoid";

const OFFCHAIN_CONTENT_PREFIX = 0x01;

const parseUri = (bytes: any) => {
    return new TextDecoder().decode(bytes);
};

const parseOffchainUriCell = (cell: any) => {
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

const readIntFromBitString = (bs: any, cursor: any, bits: any) => {
    let n = BigInt(0);
    for (let i = 0; i < bits; i++) {
        n *= BigInt(2);
        n += BigInt(bs.get(cursor + i));
    }
    return n;
};

const parseAddress = (cell: any): Address | null => {
    let n = readIntFromBitString(cell.bits, 3, 8);
    if (n > BigInt(127)) {
        n = n - BigInt(256);
    }
    const hashPart = readIntFromBitString(cell.bits, 3 + 8, 256);
    if (n.toString(10) + ":" + hashPart.toString(16) === "0:0") return null;
    const s = n.toString(10) + ":" + hashPart.toString(16).padStart(64, "0");
    return new TonWeb.Address(s);
};

export async function getJettonWalletBalance(tonweb: any, jettonWalletAddress: string): Promise<any> { /* BN */
    try {
        const jettonWalletData = await tonweb.provider.call2(
            jettonWalletAddress,
            "get_wallet_data"
        );
        const balance = jettonWalletData[0];
        return balance;
    } catch (e: any) {
        if (e.result.exit_code === -13) {
            return decToBN(0);
        } else {
            throw e;
        }
    }
}

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

export async function getJettonTotalSupply(tonweb: any, jettonMinterAddress: string): Promise<any> { /* BN */
    try {
        const jettonData = await tonweb.provider.call2(
        jettonMinterAddress,
        "get_jetton_data",
        []
    );
        const totalSupply = jettonData[0];
        return totalSupply;
    } catch (e: any) {
        if (e.result.exit_code === -13) {
            return decToBN(0);
        } else {
            throw e;
        }
    }
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

export async function getWrappedTokenData(tonweb: any, jettonWalletAddress: string): Promise<{
    chainId: number,
    tokenAddress: string,
    decimals: number
}> {
    const wrappedTokenData = await tonweb.provider.call2(
        jettonWalletAddress,
        "get_wrapped_token_data",
        []
    );

    const chainId = Number(wrappedTokenData[0].toString());
    const tokenAddress = "0x" + wrappedTokenData[1].toString("hex");
    const decimals = Number(wrappedTokenData[2].toString());
    checkNull(chainId);
    checkNull(tokenAddress);
    checkNull(decimals);
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
}): Promise<Address | null> {
    const cell = new TonWeb.boc.Cell();

    cell.bits.writeAddress(userTonAddress);

    const getWalletAddressResponse = await tonweb.provider.call2(
        tokenAddress,
        "get_wallet_address",
        [["tvm.Slice", bytesToBase64(await cell.toBoc(false))]]
    );
    const jettonWalletAddress = parseAddress(getWalletAddressResponse);
    return jettonWalletAddress;
}

export async function getJettonMinterAddress(
    tonweb: any,
    tonBridgeAddress: string,
    wrappedTokenData: any /* Cell */
): Promise<Address | null> {

    const getWalletAddressResponse = await tonweb.provider.call2(
        tonBridgeAddress,
        "get_minter_address",
        [["tvm.Cell", bytesToBase64(await wrappedTokenData.toBoc(false))]]
    );
    const jettonMinterAddress = parseAddress(getWalletAddressResponse);
    return jettonMinterAddress;
}

export const getBridgeState = async (tonweb: any, configParam: number): Promise<number> => {
    const cell = await tonweb.provider.getConfigParam(configParam);
    const slice = cell.beginParse();
    slice.loadUint(8); // prefix
    slice.loadUint(256); // bridge_address_hash
    slice.loadUint(256); // oracles_address_hash
    slice.loadBit(); // oracles dict
    const stateFlags = slice.loadUint(8);
    return stateFlags.toNumber();
}