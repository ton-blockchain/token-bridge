import Web3 from "web3";
import {EvmTransaction, hash, TonTransaction, TonTxID} from "./BridgeCommon";
import TonWeb from "tonweb";
import {Log, TransactionReceipt} from "web3-core";
import {
    BLOCK_CONFIRMATIONS_COUNT, parseBN, parseDecimals,
    parseEvmAddress,
    parseEvmBlockHash,
    parseEvmTxHash,
    parseNumber, parseTonAddress, parseWc
} from "./BridgeEvmUtils";
import {findLogOutMsg, getMessageBytes, makeAddress} from "./BridgeTonUtils";

const BN = TonWeb.utils.BN;

const LOCK_INPUT_LENGTH = 202;
const LOCK_INPUT_PREFIX = '0xca3369c6';

// uint256 value, uint8 decimals
export const lockEventDataTypes = ['uint256', 'uint8'];

export interface LockEvent extends EvmTransaction {
    type: 'Lock';
    transactionHash: string;
    logIndex: number;
    blockNumber: number;
    blockTime: number;
    blockHash: string;

    from: string;
    token: string;
    to_address_hash: string; // bytes32
    amount: string;
    decimals: number;

    rawData: string;
    topics: string[];
    transactionIndex: number;
}

export interface BurnEvent extends TonTransaction { // ton event
    type: 'Burn';
    ethReceiver: string; // EVM-address, 160bit
    jettonAmount: string; // VarUint 16
    token: string; // EVM-address, 160bit
    tx: TonTxID;
    time: number;
}

export interface PayJettonMintEvent extends TonTransaction {
    type: 'PayJettonMint',
    queryId: string; // BN
    tx: TonTxID;
    time: number;
}

export class TokenBridge {

    static getDataId(
        web3: Web3,
        event: BurnEvent,
        target: string,
        chainId: number
    ): string {
        return hash(
            web3.eth.abi.encodeParameters(
                [
                    'int',
                    'address',
                    'uint256',
                    'address',
                    'address',
                    'uint256',
                    'bytes32',
                    'bytes32',
                    'uint64',
                ],
                [
                    0xda7a,
                    target,
                    chainId,
                    event.ethReceiver,
                    event.token,
                    event.jettonAmount,
                    event.tx.address_.address_hash,
                    event.tx.tx_hash,
                    event.tx.lt,
                ]
            )
        );
    }

    static getNewSetId(web3: Web3, setHash: number, addresses: string[], target: string, chainId: number): string {
        return hash(
            web3.eth.abi.encodeParameters(
                ['int', 'address', 'uint256', 'int', 'address[]'],
                [0x5E7, target, chainId, setHash, addresses]
            )
        );
    }

    static getNewLockStatusId(web3: Web3, newLockStatus: boolean, nonce: number, target: string, chainId: number): string {
        return hash(
            web3.eth.abi.encodeParameters(
                ['int', 'address', 'uint256', 'bool', 'int'],
                [0xB012, target, chainId, newLockStatus, nonce]
            )
        );
    }

    static findLog = (web3: Web3, from: string, amount: string, addressHash: string, token: string, logs: Log[]): Log | null => {
        let count = 0;
        let result: Log | null = null;
        for (const log of logs) {
            if (
                log.topics.length === 4 &&
                log.topics[1].toLowerCase().endsWith(from.substr(2)) &&
                log.topics[2].toLowerCase().endsWith(token.substr(2)) &&
                log.topics[3] === '0x' + addressHash
            ) {
                const decoded = web3.eth.abi.decodeParameters(
                    lockEventDataTypes,
                    log.data
                );
                if (decoded[0] === amount) {
                    result = log;
                    count++;
                }
            }
        }
        if (count > 1) throw new Error('too many logs');
        return result;
    }

    static createMultisigMsgBody(lockEvent: LockEvent, queryId: any /* BN */, chainId: number): any /* BitString */ {
        const payload = new TonWeb.boc.Cell();
        payload.bits.writeUint(4, 32); // op
        payload.bits.writeUint(queryId, 64); //query id for execute voting
        payload.bits.writeUint(0, 8); // execute voting op
        payload.bits.writeUint(
            new TonWeb.utils.BN(lockEvent.transactionHash.slice(2), 16),
            256
        );
        payload.bits.writeInt(lockEvent.logIndex, 16);
        payload.bits.writeUint(
            new TonWeb.utils.BN(lockEvent.to_address_hash, 16),
            256
        );
        payload.bits.writeCoins(new TonWeb.utils.BN(lockEvent.amount)); // mint_jetton_amount
        payload.bits.writeCoins(new TonWeb.utils.BN(0)); // forward_coins_amount

        const wrappedTokenData = new TonWeb.boc.Cell();
        wrappedTokenData.bits.writeUint(chainId, 32);
        wrappedTokenData.bits.writeUint(
            new TonWeb.utils.BN(lockEvent.token.slice(2), 16),
            160
        );
        wrappedTokenData.bits.writeUint(lockEvent.decimals, 8);
        payload.refs.push(wrappedTokenData);
        return payload;
    }

    static isValidLock = (tx: any, bridgeAddress: string): boolean => {
        if (tx.to.toLowerCase() !== bridgeAddress.toLowerCase()) return false;
        if (tx.from.toLowerCase() === bridgeAddress.toLowerCase()) return false;
        if (tx.isError !== '0') return false;
        if (tx.txreceipt_status !== '1') return false;
        if (!tx.input) return false;
        if (tx.input.length !== LOCK_INPUT_LENGTH) return false;
        if (!tx.input.startsWith(LOCK_INPUT_PREFIX)) return false;
        if (tx.confirmations < BLOCK_CONFIRMATIONS_COUNT) return false;
        return true;
    }

    static processEvmTransaction = async (web3: Web3, bridgeAddress: string, tx: any, receipt: TransactionReceipt, currentBlockNumber: number): Promise<LockEvent> => {
        // parse transaction

        const blockNumber = parseNumber(tx, 'blockNumber');
        const transactionHash = parseEvmTxHash(tx, 'hash');
        const blockTime = parseNumber(tx, 'timeStamp');
        const blockHash = parseEvmBlockHash(tx, 'blockHash');
        const transactionIndex = parseNumber(tx, 'transactionIndex');
        const from = parseEvmAddress(tx, 'from');
        const to = parseEvmAddress(tx, 'to');
        const input = tx.input;

        // parse transaction input

        if (input.length !== LOCK_INPUT_LENGTH) throw new Error('invalid input length ' + input);
        if (!input.startsWith(LOCK_INPUT_PREFIX)) throw new Error(`input ${LOCK_INPUT_PREFIX} ` + input);

        // function lock(address token, uint256 amount, bytes32 to_address_hash)
        const lockInputTypes = ['address', 'uint256', 'bytes32'];
        const inputData = '0x' + input.slice(10); // without method signature
        const decodedInput = web3.eth.abi.decodeParameters(lockInputTypes, inputData);

        const token = parseEvmAddress(decodedInput, '0');
        const amount = parseBN(decodedInput, '1');
        const address_hash = parseTonAddress(decodedInput, '2');

        // validate transaction

        if (!receipt || Object.keys(receipt).length === 0) throw new Error('no receipt');
        if (blockHash !== receipt.blockHash.toLowerCase()) throw new Error('invalid blockHash');
        if (blockNumber !== receipt.blockNumber) throw new Error('invalid blockNumber');
        if (from !== receipt.from.toLowerCase()) throw new Error('invalid from');
        if (!receipt.status) throw new Error('invalid status');
        if (bridgeAddress.toLowerCase() !== receipt.to.toLowerCase()) throw new Error('invalid to');
        if (transactionHash !== receipt.transactionHash.toLowerCase()) throw new Error('invalid transactionHash');
        if (transactionIndex !== receipt.transactionIndex) throw new Error('invalid transactionIndex');

        const log = TokenBridge.findLog(web3, from, amount, address_hash, token, receipt.logs);
        if (!log) throw new Error('cant find log');
        const logIndex = parseNumber(log, 'logIndex');

        if (currentBlockNumber - receipt.blockNumber < BLOCK_CONFIRMATIONS_COUNT) {
            throw new Error('No block confirmations ' + (currentBlockNumber - receipt.blockNumber) + '(' + currentBlockNumber + '-' + receipt.blockNumber + ')');
        }

        const decoded = web3.eth.abi.decodeParameters(lockEventDataTypes, log.data);
        const decimals = parseDecimals(decoded, 1);

        return {
            type: 'Lock',
            transactionHash,
            logIndex,
            blockNumber,
            blockTime,
            blockHash,

            from,
            token,
            to_address_hash: address_hash,
            amount,
            decimals,

            rawData: log.data,
            topics: log.topics,
            transactionIndex,
        }
    }

    /**
     * @param t transaction from ton-http-api
     */
    static processTonTransaction = (t: any): BurnEvent | null => {

        // find log message

        const logMsg = findLogOutMsg(t.out_msgs);
        if (!logMsg) {
            return null;
        }

        const bytes = getMessageBytes(logMsg);
        if (bytes === null) {
            return null;
        }

        // parse log message

        const destinationAddress = makeAddress('0x' + TonWeb.utils.bytesToHex(bytes.slice(0, 20)));
        const amountHex = TonWeb.utils.bytesToHex(bytes.slice(20, 36));
        const amount = new BN(amountHex, 16);
        const tokenAddress = makeAddress('0x' + TonWeb.utils.bytesToHex(bytes.slice(36, 56)));
        const userSenderAddressHex = TonWeb.utils.bytesToHex(bytes.slice(56, 56 + 32))
        const minterSenderAddress = new TonWeb.utils.Address(t.in_msg.source);

        return {
            type: 'Burn',
            ethReceiver: destinationAddress,
            token: tokenAddress,
            jettonAmount: amount.toString(),
            tx: {
                address_: {
                    workchain: 0,
                    address_hash: '0x' + userSenderAddressHex
                },
                tx_hash:
                    '0x' +
                    TonWeb.utils.bytesToHex(
                        TonWeb.utils.base64ToBytes(t.transaction_id.hash),
                    ),
                lt: t.transaction_id.lt,
            },
            time: Number(t.utime),
        };
    }

    /**
     * @param t transaction from ton-http-api
     */
    static processPayJettonMintTransaction = (t: any): PayJettonMintEvent | null => {

        // find log message

        const logMsg = findLogOutMsg(t.out_msgs);
        if (!logMsg) {
            return null;
        }

        const bytes = getMessageBytes(logMsg);
        if (bytes === null) {
            return null;
        }

        // parse log message
        const queryIdHex = TonWeb.utils.bytesToHex(bytes.slice(0, 8));
        const queryId = new BN(queryIdHex, 16);
        const userSenderAddress = new TonWeb.utils.Address(t.in_msg.source);

        return {
            type: 'PayJettonMint',
            queryId: queryId.toString(),
            tx: {
                address_: {
                    workchain: userSenderAddress.wc,
                    address_hash: '0x' + TonWeb.utils.bytesToHex(userSenderAddress.hashPart)
                },
                tx_hash:
                    '0x' +
                    TonWeb.utils.bytesToHex(
                        TonWeb.utils.base64ToBytes(t.transaction_id.hash),
                    ),
                lt: t.transaction_id.lt,
            },
            time: Number(t.utime),
        };
    }

}