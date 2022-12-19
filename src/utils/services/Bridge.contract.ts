import { Contract } from "ethers";

import BRIDGE from "@/ton-bridge-lib/abi/TokenBridge.json";

import { Provider } from "../providers/provider";
import {TonAddress, TonTxID} from "@/ton-bridge-lib/BridgeCommon";
export class BridgeContract {
  contracts: { [key: string]: Contract } = {};

  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  _getContract(address: string) {
    if (!Object.keys(this.contracts).includes(address)) {
      return this._registerContract(address);
    }
    if (!this.contracts[address].provider) {
      return this._registerContract(address);
    }
    return this.contracts[address];
  }

  _registerContract(address: string) {
    // const contract = new provider.web3!.eth.Contract(ERC20.abi as any[], address);
    const contract = new Contract(
      address,
      BRIDGE.abi,
      (this.provider as any).provider
    );

    this.contracts[address] = contract;
    return contract;
  }

  symbol(address: string): string {
    const contract = this._getContract(address);
    return contract.symbol();
  }

  lock({
    address,
    token,
    amount,
    to_address_hash
  }: {
    address: string;
    token: string;
    amount: string;
    to_address_hash: string;
  }): Promise<any> {
    const contract = this._getContract(address);
    return contract
      .connect((this.provider as any).provider.getSigner()!)
      .lock(token, amount, to_address_hash);
  }

  unlock({
    bridgeAddress,
    ethReceiver,
    token,
    jettonAmount,
    tx,
    signatures,
  }: {
    bridgeAddress: string;
    ethReceiver: string; // address
    token: string; // address
    jettonAmount: string; // uint64
    tx: TonTxID;
    signatures: any;
  }): Promise<any> {
    const contract = this._getContract(bridgeAddress);
    const resp = contract
      .connect((this.provider as any).provider.getSigner()!)
      .unlock(
        {
          receiver: ethReceiver, // address
          token,
          amount: jettonAmount,
          tx: {
            address_hash: tx.address_.address_hash,
            tx_hash: tx.tx_hash,
            lt: tx.lt
          }
        },
        signatures
      );
    return resp;
  }
}

// const erc20Contract = new ERC20Contract();

// export default erc20Contract;
