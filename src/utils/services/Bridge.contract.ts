import { Contract } from "ethers";

import BRIDGE from "@/abi/BRIDGE.json";

import { Provider } from "../providers/provider";
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
    tonAddr,
  }: {
    address: string;
    token: string;
    amount: string;
    tonAddr: {
      workchain: number;
      address_hash: string;
    };
  }): Promise<any> {
    const contract = this._getContract(address);
    return contract
      .connect((this.provider as any).provider.getSigner()!)
      .lock(token, amount, tonAddr);
  }

  unlock({
    bridgeAddress,
    receiver,
    token,
    amount,
    tx,
    signatures,
  }: {
    bridgeAddress: string;
    receiver: string; // address
    token: string;
    amount: string; // uint64
    tx: {
      address_: {
        workchain: number;
        address_hash: string;
      };
      tx_hash: string;
      lt: number;
    };
    signatures: any;
  }): Promise<any> {
    const contract = this._getContract(bridgeAddress);
    const resp = contract
      .connect((this.provider as any).provider.getSigner()!)
      .unlock(
        {
          receiver, // address
          token,
          amount, // uint64
          tx,
        },
        signatures
      );
    return resp;
  }
}

// const erc20Contract = new ERC20Contract();

// export default erc20Contract;
