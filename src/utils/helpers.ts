import BN from "bn.js";
import Hash from "eth-lib/lib/hash";
import TonWeb from "tonweb";

import { EthToTon } from "@/components/BridgeProcessor/types";
import Web3 from "web3";

const OFFCHAIN_CONTENT_PREFIX = 0x01;

function getScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script: HTMLScriptElement = document.createElement("script");
    const prior = document.getElementsByTagName("script")[0];
    script.async = true;

    script.onload = () => {
      script.onload = null;
      script.onerror = null;
      setTimeout(resolve, 0);
    };

    script.onerror = () => {
      script.onload = null;
      script.onerror = null;
      setTimeout(reject, 0);
    };

    script.src = src;
    prior.parentNode!.insertBefore(script, prior);
  });
}

function supportsLocalStorage(): boolean {
  try {
    return "localStorage" in window && window["localStorage"] !== null;
  } catch (e) {
    return false;
  }
}

function parseChainId(chainId: string | number): number {
  if (typeof chainId === "number") {
    return chainId;
  }
  if (typeof chainId === "string") {
    return parseInt(chainId, chainId.toLowerCase().startsWith("0x") ? 16 : 10);
  } else {
    return 0;
  }
}

function getNumber(pair: Array<string>): number {
  return parseInt(pair[1], 16);
}

function getBool(pair: Array<string>): boolean {
  return getNumber(pair) === 1;
}

function decToHex(dec: number): string {
  return "0x" + new TonWeb.utils.BN(dec).toString(16);
}

function parseAddressFromDec(data: any): string {
  return decToHex(data.number.number);
}

const readIntFromBitString = (bs: any, cursor: any, bits: any) => {
  let n = BigInt(0);
  for (let i = 0; i < bits; i++) {
    n *= BigInt(2);
    n += BigInt(bs.get(cursor + i));
  }
  return n;
};

const parseAddress = (cell: any) => {
  let n = readIntFromBitString(cell.bits, 3, 8);
  if (n > BigInt(127)) {
    n = n - BigInt(256);
  }
  const hashPart = readIntFromBitString(cell.bits, 3 + 8, 256);
  if (n.toString(10) + ":" + hashPart.toString(16) === "0:0") return null;
  const s = n.toString(10) + ":" + hashPart.toString(16).padStart(64, "0");
  return new TonWeb.Address(s);
};

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

function makeAddress(address: string): string {
  if (!address.startsWith("0x")) {
    throw new Error("Invalid address " + address);
  }
  let hex = address.substr(2);
  while (hex.length < 40) {
    hex = "0" + hex;
  }
  return "0x" + hex;
}

function parseEthSignature(data: any) {
  const tuple = data.tuple.elements;
  const publicKey = makeAddress(decToHex(tuple[0].number.number));

  const rsv = tuple[1].tuple.elements;
  const r = decToHex(rsv[0].number.number);
  const s = decToHex(rsv[1].number.number);
  const v = Number(rsv[2].number.number);
  return {
    publicKey,
    r,
    s,
    v,
  };
}

const findLogOutMsg = (outMessages?: any[]): any => {
  if (!outMessages) return null;
  for (const outMsg of outMessages) {
    if (outMsg.destination === '') return outMsg;
  }
  return null;
}

const getRawMessageBytes = (logMsg: any): Uint8Array | null => {
  const message = logMsg.message.substr(0, logMsg.message.length - 1); // remove '\n' from end
  const bytes = TonWeb.utils.base64ToBytes(message);
  if (bytes.length !== 28) {
    return null;
  }
  return bytes;
}

const getTextMessageBytes = (logMsg: any): Uint8Array | null => {
  const message =  logMsg.msg_data?.text;
  const textBytes = TonWeb.utils.base64ToBytes(message);
  const bytes = new Uint8Array(textBytes.length + 4);
  bytes.set(textBytes, 4);
  return bytes;
}

const getMessageBytes = (logMsg: any): Uint8Array | null => {
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

function getQueryId(ethToTon: EthToTon): BN {

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

  const MULTISIG_QUERY_TIMEOUT = 30 * 24 * 60 * 60; // 30 days
  const VERSION = 2;
  const timeout = ethToTon.blockTime + MULTISIG_QUERY_TIMEOUT + VERSION;

  const query_id = Web3.utils.sha3(getLegacyQueryString(ethToTon.blockHash + '_' + ethToTon.transactionHash + '_' + String(ethToTon.logIndex)))!.substr(2, 8); // get first 32 bit

  return new BN(timeout).mul(new BN(4294967296)).add(new BN(query_id, 16));
}

export {
  decToHex,
  getBool,
  getNumber,
  getQueryId,
  getScript,
  makeAddress,
  parseAddress,
  parseAddressFromDec,
  parseChainId,
  parseEthSignature,
  parseOffchainUriCell,
  supportsLocalStorage,
  findLogOutMsg,
  getMessageBytes
};
