import TonWeb from "tonweb";

export const BLOCK_CONFIRMATIONS_COUNT = 12;

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

export function parseBN(data: any, field: string): string {
    const s: string = parseField(data, field);
    const bn = new TonWeb.utils.BN(s);
    if (bn.lte(new TonWeb.utils.BN(0))) throw new Error('bn is negative ' + s);
    return s;
}