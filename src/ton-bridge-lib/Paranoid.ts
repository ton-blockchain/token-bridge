import TonWeb from "tonweb";

export const checkNull = (a: any): void => {
    if (a === null || a === undefined || a === '' || a === '0x') throw new Error('checkNull');
    if ((typeof a === 'number') && isNaN(a)) throw new Error('checkNaN');
}

const removeHexPrefix = (hex: string): string => {
    if (hex.startsWith('0x')) {
        hex = hex.substring(2);
    }
    if (hex.indexOf('0x') > -1) throw new Error('removeHexPrefix');
    return hex;
}

/**
 * @returns hex WITHOUT 0x in lowercase
 */
export const bytesToHex = (bytes: Uint8Array): string => {
    checkNull(bytes);
    const a = Buffer.from(bytes).toString('hex');
    const b = TonWeb.utils.bytesToHex(bytes);
    if (a !== b) throw new Error('bytesToHex');
    return a;
}

export const bytesToBase64 = (bytes: Uint8Array): string => {
    checkNull(bytes);
    const a = Buffer.from(bytes).toString('base64');
    const b = TonWeb.utils.bytesToBase64(bytes);
    if (a !== b) throw new Error('bytesToBase64');
    return a;
}

/**
 * @returns hex with or without 0x
 */
export const hexToBytes = (hex: string): Uint8Array => {
    checkNull(hex);
    hex = removeHexPrefix(hex);
    const a = Uint8Array.from(Buffer.from(hex, 'hex'));
    const b = TonWeb.utils.hexToBytes(hex);
    if (a.join(',') !== b.join(',')) throw new Error('hexToBytes');
    return a;
}

export const base64ToBytes = (base64: string): Uint8Array => {
    checkNull(base64);
    const a = Uint8Array.from(Buffer.from(base64, 'base64'));
    const b = TonWeb.utils.base64ToBytes(base64);
    if (a.join(',') !== b.join(',')) throw new Error('base64ToBytes');
    return a;
}

const checkBN = (bn: any, bigInt: any): void => {
    if (bn.toString(2) !== bigInt.toString(2)) throw new Error('checkBN');
    if (bn.toString(10) !== bigInt.toString(10)) throw new Error('checkBN');
    if (bn.toString(16) !== bigInt.toString(16)) throw new Error('checkBN');
}

export const decToBN = (dec: string | number) /* BN */ => {
    checkNull(dec);
    const bn = new TonWeb.utils.BN(dec);
    const bigInt = BigInt(dec);
    checkBN(bn, bigInt);
    return bn;
}

/**
 * @returns hex with or without 0x
 */
export const hexToBN = (hex: string) /* BN */ => {
    checkNull(hex);
    hex = removeHexPrefix(hex);

    const bn = new TonWeb.utils.BN(hex, 16);
    const bigInt = BigInt('0x' + hex);
    checkBN(bn, bigInt);
    return bn;
}

/**
 * @return hex starts with 0x in lowercase
 */
export const decToHex = (dec: string | number): string => {
    checkNull(dec);
    const bn = new TonWeb.utils.BN(dec);
    const bigInt = BigInt(dec);
    const a = bn.toString(16);
    const b = bigInt.toString(16);
    if (a !== b) throw new Error('decToHex');
    return '0x' + a;
}

/**
 * @returns hex with or without 0x
 */
export const hexToDec = (hex: string): string => {
    checkNull(hex);
    hex = removeHexPrefix(hex);

    const bn = new TonWeb.utils.BN(hex, 16);
    const bigInt = BigInt('0x' + hex);
    const a = bn.toString(10);
    const b = bigInt.toString(10);
    if (a !== b) throw new Error('hexToDec');
    return a;
}

export const calculateQueryId = (timeout: number, queryId: string) /* BN */ => {
    checkNull(timeout);
    checkNull(queryId);
    queryId = removeHexPrefix(queryId);
    const bn = decToBN(timeout).mul(decToBN(4294967296)).add(hexToBN(queryId))
    const bigInt = BigInt(timeout) * BigInt(4294967296) + BigInt('0x' + queryId)
    checkBN(bn, bigInt);
    return bn;
}

export const calculateToncoinFee = (amount: any /* BN */) /* BN */ => {
    checkNull(amount);

    const feeFlat = decToBN(5000000000);
    const feeFactor = decToBN(25);
    const feeBase = decToBN(10000);

    const rest = amount.sub(feeFlat);
    const percentFee = rest.mul(feeFactor).div(feeBase);
    const bn = feeFlat.add(percentFee);

    const _feeFlat = BigInt(5000000000);
    const _feeFactor = BigInt(25);
    const _feeBase = BigInt(10000);
    const _rest = BigInt(amount.toString()) - _feeFlat;
    const _percentFee = (_rest * _feeFactor) / _feeBase;
    const bigInt = _feeFlat + _percentFee;

    checkBN(bn, bigInt);

    return bn;
}