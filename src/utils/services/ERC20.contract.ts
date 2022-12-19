import BN from "bn.js";
import { BigNumber, Contract } from "ethers";

import ERC20 from "@/ton-bridge-lib/abi/ERC20.json";

import { Provider } from "../providers/provider";

export class ERC20Contract {
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
      ERC20.abi,
      (this.provider as any).provider
    );
    this.contracts[address] = contract;
    return contract;
  }

  symbol(address: string): string {
    const contract = this._getContract(address);
    return contract.symbol();
  }

  decimals({ address }: { address: string }) {
    const contract = this._getContract(address);
    return contract.decimals();
  }

  balanceOf({
    address,
    account,
  }: {
    address: string;
    account: string;
  }): Promise<BN> {
    const contract = this._getContract(address);
    return contract.balanceOf(account);
  }

  allowance({
    address,
    owner,
    spender,
  }: {
    address: string;
    owner: string;
    spender: string;
  }): Promise<BigNumber> {
    const contract = this._getContract(address);
    return contract.allowance(owner, spender);
  }

  approve({
    address,
    spender,
    amount,
  }: {
    address: string;
    spender: string;
    amount: string;
  }): Promise<any> {
    const contract = this._getContract(address);
    return contract
      .connect((this.provider as any).provider.getSigner()!)
      .approve(spender, amount);
  }
}

// const erc20Contract = new ERC20Contract();

// export default erc20Contract;
