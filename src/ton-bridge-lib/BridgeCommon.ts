import Web3 from "web3";
import TonWeb from "tonweb"

export interface TonAddress {
    workchain: number; // int8
    address_hash: string; // bytes32
}

export interface TonTxID {
    address_: TonAddress; // sender user TON address
    tx_hash: string; // bytes32, transaction hash on TON bridge smart contract
    lt: string; // uint64, transaction LT (logical time) on TON bridge smart contract
}

export interface EvmTransaction {
    blockTime: number;
    blockHash: string;
    transactionHash: string;
    logIndex: number;
}

export interface TonTransaction {
    tx: TonTxID;
}

export type NewOracleSet = string[]; // address[]

export interface Vote {
    id: string;
    data: string; // json
    status: number;
    statusTime: number; // in seconds
}

export function hash(data: string): string {
    const hash = Web3.utils.sha3(data)
    if (!hash) throw new Error('empty hash');
    return hash;
}

export const MULTISIG_QUERY_TIMEOUT = 30 * 24 * 60 * 60; // 30 days

export function getQueryId(evmTransaction: EvmTransaction) /* BN */ {
    const VERSION = 2;
    const timeout = evmTransaction.blockTime + MULTISIG_QUERY_TIMEOUT + VERSION;

    // web3@1.3.4 has an error in the algo for computing SHA
    // it doesn't strictly check input string for valid HEX relying only for 0x prefix
    // but the query string is formed that way: 0xBLOCKHASH + '_' + 0xTRANSACTIONHASH + '_' + LOGINDEX
    // the keccak algo splits string to pairs of symbols, and treats them as hex bytes
    // so _0 becames NaN, x7 becames NaN, d_ becames 13 (it only sees first d and skips invalid _)
    // web3@1.6.1 has this error fixed, but for our case this means that we've got different hashes for different web3 versions
    // and getLegacyQueryString code transforms query string in the way, that SHA from web3@1.6.1 can return the same exact value as web3@1.3.4
    // for example:
    // old one: 0xcad62a0e0090e30e0133586f86ed8b7d0d2eac5fa8ded73b8180931ff379b113_0x77e5617841b2d355fe588716b6f8f506b683e985fc98fdb819ddf566594d4cfd_64
    // new one: 0xcad62a0e0090e30e0133586f86ed8b7d0d2eac5fa8ded73b8180931ff379b11300007e5617841b2d355fe588716b6f8f506b683e985fc98fdb819ddf566594d4cf0d64
    // diff   :                                                                   ^^^^                                                              ^^
    function getLegacyQueryString(str: string): string {
        const strArr = str.split('');
        strArr[66] = '0';
        strArr[67] = '0';
        strArr[68] = '0';
        strArr[69] = '0';
        strArr[133] = strArr[132];
        strArr[132] = '0';
        return strArr.join('');
    }

    const queryId = hash(
        getLegacyQueryString(
        evmTransaction.blockHash + '_' + evmTransaction.transactionHash + '_' + String(evmTransaction.logIndex)
        )
    ).substr(2, 8); // get first 32 bit

    return new TonWeb.utils.BN(timeout).mul(new TonWeb.utils.BN(4294967296)).add(new TonWeb.utils.BN(queryId, 16));
}