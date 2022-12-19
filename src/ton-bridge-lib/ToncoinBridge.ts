import {EvmTransaction, hash, TonAddress, TonTransaction, TonTxID} from "./BridgeCommon";
import Web3 from "web3";
import TonWeb from "tonweb";
import {Log, TransactionReceipt} from "web3-core";
import {
    BLOCK_CONFIRMATIONS_COUNT,
    parseBN,
    parseEvmAddress,
    parseEvmBlockHash,
    parseEvmTxHash,
    parseNumber,
    parseTonAddress,
    parseWc
} from "./BridgeEvmUtils";
import {findLogOutMsg, getMessageBytes, makeAddress} from "./BridgeTonUtils";

const BN = TonWeb.utils.BN;

const BURN_INPUT_LENGTH = 202;
const BURN_INPUT_PREFIX = '0xe057fbff';

export interface SwapEthToTonEvent extends EvmTransaction {
    type: 'SwapEthToTon';
    transactionHash: string;
    logIndex: number;
    blockNumber: number;
    blockTime: number;
    blockHash: string;

    from: string; // address
    to: TonAddress;
    value: string; // uint256

    rawData: string;
    topics: string[];
    transactionIndex: number;
}

export interface SwapTonToEth extends TonTransaction {
    type: 'SwapTonToEth';
    receiver: string; // address
    amount: string; // uint64
    tx: TonTxID;
    time: number;
}

export class ToncoinBridge {

    static getFeeAmount(amount: any /* BN */) /* BN */ {
        const feeFlat = new BN(5000000000);
        const feeFactor = new BN(25);
        const feeBase = new BN(10000);

        const rest = amount.sub(feeFlat);
        const percentFee = rest.mul(feeFactor).div(feeBase);
        return feeFlat.add(percentFee);
    }

    static getDataId(web3: Web3, d: SwapTonToEth, target?: string): string {
        if (target) {
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'address', 'address', 'uint256', 'int8', 'bytes32', 'bytes32', 'uint64'],
                    [0xDA7A, target, d.receiver, d.amount, d.tx.address_.workchain, d.tx.address_.address_hash, d.tx.tx_hash, d.tx.lt]
                )
            );
        } else { // ethereum mainnet Toncoin bridge hasn't `target`
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'address', 'uint256', 'int8', 'bytes32', 'bytes32', 'uint64'],
                    [0xDA7A, d.receiver, d.amount, d.tx.address_.workchain, d.tx.address_.address_hash, d.tx.tx_hash, d.tx.lt]
                )
            );
        }
    }

    static getNewSetId(web3: Web3, setHash: number, addresses: string[], target?: string): string {
        if (target) {
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'address', 'int', 'address[]'],
                    [0x5E7, target, setHash, addresses]
                )
            );
        } else { // ethereum mainnet Toncoin bridge hasn't `target`
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'int', 'address[]'],
                    [0x5E7, setHash, addresses]
                )
            );
        }
    }

    static getNewBurnStatusId(web3: Web3, newBurnStatus: boolean, nonce: number, target?: string): string {
        if (target) {
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'address', 'bool', 'int'],
                    [0xB012, target, newBurnStatus, nonce]
                )
            );
        } else { // ethereum mainnet Toncoin bridge hasn't `target`
            return hash(
                web3.eth.abi.encodeParameters(
                    ['int', 'bool', 'int'],
                    [0xB012, newBurnStatus, nonce]
                )
            );
        }
    }

    static findLog = (web3: Web3, from: string, amount: string, workchain: string, addressHash: string, logs: Log[]): Log | null => {
        let count = 0;
        let result: Log | null = null;
        for (const log of logs) {
            if (log.topics.length === 3 &&
                log.topics[1].toLowerCase().endsWith(from.substr(2)) &&
                log.topics[2] === '0x' + addressHash) {
                const decoded = web3.eth.abi.decodeParameters(
                    ['int256', 'uint256'],
                    log.data
                );
                if (decoded[0] === workchain && decoded[1] === amount) {
                    result = log;
                    count++;
                }
            }
        }
        if (count > 1) throw new Error('too many logs');
        return result;
    }

    static createMultisigMsgBody(ethToTon: SwapEthToTonEvent) /* Cell */ {
        const payload = new TonWeb.boc.Cell();
        payload.bits.writeUint(4, 32); // op
        payload.bits.writeUint(0, 8); // vote op
        payload.bits.writeUint(new TonWeb.utils.BN(ethToTon.transactionHash.substr(2), 16), 256);
        payload.bits.writeInt(ethToTon.logIndex, 16);
        payload.bits.writeInt(ethToTon.to.workchain, 8);
        payload.bits.writeUint(new TonWeb.utils.BN(ethToTon.to.address_hash, 16), 256);
        payload.bits.writeUint(new TonWeb.utils.BN(ethToTon.value), 64);
        return payload;
    }

    static isValidBurn = (tx: any, wtonAddress: string): boolean => {
        if (tx.to.toLowerCase() !== wtonAddress.toLowerCase()) return false;
        if (tx.from.toLowerCase() === wtonAddress.toLowerCase()) return false;
        if (tx.isError !== '0') return false;
        if (tx.txreceipt_status !== '1') return false;
        if (!tx.input) return false;
        if (tx.input.length !== BURN_INPUT_LENGTH) return false;
        if (!tx.input.startsWith(BURN_INPUT_PREFIX)) return false;
        if (tx.confirmations < BLOCK_CONFIRMATIONS_COUNT) return false;
        return true;
    }

    static processEvmTransaction = async (web3: Web3, wtonAddress: string, tx: any, receipt: TransactionReceipt, currentBlockNumber: number): Promise<SwapEthToTonEvent> => {

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

        if (input.length !== BURN_INPUT_LENGTH) throw new Error('invalid input length ' + input);
        if (!input.startsWith(BURN_INPUT_PREFIX)) throw new Error(`input ${BURN_INPUT_PREFIX} ` + input);

        // uint256 amount, int8 workchain, bytes32 address_hash
        const decodedInput = web3.eth.abi.decodeParameters(
            ['uint256', 'int8', 'bytes32'],
            '0x' + input.slice(10)
        );

        const value = parseBN(decodedInput, '0');
        const workchain = parseWc(decodedInput, '1');
        const address_hash = parseTonAddress(decodedInput, '2');

        // validate transaction

        if (!receipt || Object.keys(receipt).length === 0) throw new Error('no receipt');
        if (blockHash !== receipt.blockHash.toLowerCase()) throw new Error('invalid blockHash');
        if (blockNumber !== receipt.blockNumber) throw new Error('invalid blockNumber');
        if (from !== receipt.from.toLowerCase()) throw new Error('invalid from');
        if (!receipt.status) throw new Error('invalid status');
        if (wtonAddress.toLowerCase() !== receipt.to.toLowerCase()) throw new Error('invalid to');
        if (transactionHash !== receipt.transactionHash.toLowerCase()) throw new Error('invalid transactionHash');
        if (transactionIndex !== receipt.transactionIndex) throw new Error('invalid transactionIndex');

        const log = ToncoinBridge.findLog(web3, from, value, workchain.toString(), address_hash, receipt.logs);
        if (!log) throw new Error('cant find log');
        const logIndex = parseNumber(log, 'logIndex');

        if (currentBlockNumber - receipt.blockNumber < BLOCK_CONFIRMATIONS_COUNT) {
            throw new Error('No block confirmations ' + (currentBlockNumber - receipt.blockNumber) + '(' + currentBlockNumber + '-' + receipt.blockNumber + ')');
        }

        return {
            type: 'SwapEthToTon',
            transactionHash,
            logIndex, // 6
            blockNumber, // 10132245
            blockTime, // 1628967979
            blockHash,
            from,
            to: {
                workchain,
                address_hash
            },
            value, // '0',
            rawData: log.data,
            topics: log.topics,
            transactionIndex,
        }
    }

    /**
     * @param t transaction from ton-http-api
     */
    static processTonTransaction = (t: any): SwapTonToEth | null => {

        // find log message

        const logMsg = findLogOutMsg(t.out_msgs);
        if (!logMsg) {
            return null;
        }

        const bytes = getMessageBytes(logMsg);
        if (bytes === null) {
            return null;
        }
        if (bytes.length !== 28) {
            return null;
        }

        // parse log message

        const destinationAddress = makeAddress('0x' + TonWeb.utils.bytesToHex(bytes.slice(0, 20)));
        const amountHex = TonWeb.utils.bytesToHex(bytes.slice(20, 28));
        const amount = new BN(amountHex, 16);
        const senderAddress = new TonWeb.utils.Address(t.in_msg.source);

        // validate log message

        const addressFromInMsg = new TextDecoder().decode(TonWeb.utils.base64ToBytes(t.in_msg.msg_data.text)).slice('swapTo#'.length);
        if (destinationAddress.toLowerCase() !== addressFromInMsg.toLowerCase()) {
            console.error('address from in_msg doesnt match ', addressFromInMsg, destinationAddress);
            return null;
        }
        const amountFromInMsg = new BN(t.in_msg.value);
        const amountFromInMsgAfterFee = amountFromInMsg.sub(ToncoinBridge.getFeeAmount(amountFromInMsg));
        if (!amount.eq(amountFromInMsgAfterFee)) {
            console.error('amount from in_msg doesnt match ', amount.toString(), amountFromInMsgAfterFee.toString(), amountFromInMsg.toString());
            return null;
        }

        return {
            type: 'SwapTonToEth',
            receiver: destinationAddress,
            amount: amount.toString(),
            tx: {
                address_: {
                    workchain: senderAddress.wc,
                    address_hash: '0x' + TonWeb.utils.bytesToHex(senderAddress.hashPart),
                },
                tx_hash: '0x' + TonWeb.utils.bytesToHex(TonWeb.utils.base64ToBytes(t.transaction_id.hash)),
                lt: t.transaction_id.lt,
            },
            time: Number(t.utime)
        };
    }
}