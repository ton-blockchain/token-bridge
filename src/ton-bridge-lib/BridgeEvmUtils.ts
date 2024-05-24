import {decToBN} from "./Paranoid";

export const TOKEN_TON_TO_EVM_PERCENT_FEE_START_TIME = 1687780800; // 26 June 2023, 12:00:00 UTC
export const TOKEN_TON_TO_EVM_PERCENT_FEE_USDT_END_TIME = 1716552000; // 24 May 2024, 12:00:00 UTC

export const USDT_ETHEREUM_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase();

export const BLOCK_CONFIRMATIONS_COUNT = 65;

export function parseField(data: any, field: string | number): any {
    const x: any = data[field];
    if (x === null || x === undefined) throw new Error('no "' + field + '"');
    return x;
}

// 0xfe8af310e07838c114ad6c3227e4a08aa2c0ae31f6c88f3cdffcd493f15e7299
export function parseEvmTxHash(data: any, field: string): string {
    const s: string = parseField(data, field);
    if (s.length !== 66 || !s.startsWith('0x')) throw new Error('invalid eth tx hash ' + s);
    return s.toLowerCase();
}

// 0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46
export function parseEvmBlockHash(data: any, field: string): string {
    const s: string = parseField(data, field);
    if (s.length !== 66 || !s.startsWith('0x')) throw new Error('invalid eth block hash ' + s);
    return s.toLowerCase();
}

// 0x1FF516E5ce789085CFF86d37fc27747dF852a80a
export function parseEvmAddress(data: any, field: string): string {
    const s: string = parseField(data, field);
    if (s.length !== 42 || !s.startsWith('0x')) throw new Error('invalid eth address ' + s);
    return s.toLowerCase();
}

export function parseNumber(data: any, field: string): number {
    const n: number = Number(parseField(data, field));
    if (isNaN(n)) throw new Error('invalid number ' + n);
    if (n < 0) throw new Error('number is negative ' + n);
    return n;
}

// 0xE5BC34E7CD6D8669967B117CF7644A940571D169FB8DC9358C2D123A07DFB9A4
export function parseTonAddress(data: any, field: string): string {
    const s: string = parseField(data, field);
    if (s.length !== 66 || !s.startsWith('0x')) throw new Error('invalid ton address ' + s);
    return s.slice(2).toLowerCase(); // slice '0x'
}

export function parseWc(data: any, field: string): number {
    const n: number = Number(parseField(data, field));
    if (n !== 0 && n !== -1) throw new Error('invalid wc ' + n);
    return n;
}

export function parseDecimals(data: any, field: number): number {
    const n: number = Number(parseField(data, field));
    if (!((n >= 0) && (n <= 255))) throw new Error('invalid decimals ' + n);
    return n;
}

export function parseBN(data: any, field: string | number): string {
    const s: string = parseField(data, field);
    const bn = decToBN(s);
    if (bn.lte(decToBN(0))) throw new Error('bn is negative ' + s);
    return s;
}

export async function throwIfSwapFinished(evmContract: any, swapId: string): Promise<void> {
    const isFinished = await evmContract.methods.finishedVotings(swapId).call();
    console.log({isFinished});

    if ((isFinished !== true) && (isFinished !== false)) {
        alert('isFinished unexpected result');
        throw new Error('isFinished unexpected result');
    }

    if (isFinished) {
        alert('Already finished');
        throw new Error('already finished');
    }
}

export async function estimateGas(evmTransaction: any, fromEvmAddress: string): Promise<string | number> {
    // https://web3js.readthedocs.io/en/v1.8.0/web3-eth-contract.html#methods-mymethod-estimategas
    const estimatedGas = await evmTransaction.estimateGas({from: fromEvmAddress});
    console.log({estimatedGas});

    let bn = null;
    try {
        bn = BigInt(estimatedGas);
    } catch (e) {
    }

    if (bn === null) {
        alert(`"${estimatedGas}" estimate gas wrong number`);
        throw new Error('estimate gas wrong number');
    }

    return estimatedGas;
}