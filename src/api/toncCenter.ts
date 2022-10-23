import BN from "bn.js";
import TonWeb from "tonweb";
import { Address } from "tonweb/dist/types/utils/address";

import { parseAddress, parseOffchainUriCell } from "@/utils/helpers";

async function getJettonWalletData(tonweb: any, jettonWalletAddress: string) {
  const jettonWalletData = await tonweb.provider.call2(
    jettonWalletAddress,
    "get_wallet_data"
  );

  const balance = jettonWalletData[0] as BN;
  const ownerAddress = parseAddress(jettonWalletData[1]);
  const jettonMinterAddress = parseAddress(jettonWalletData[2]);
  const jettonWalletCode = jettonWalletData[3];

  return {
    balance,
    ownerAddress,
    jettonMinterAddress,
    jettonWalletCode,
  };
}

async function getJettonData(tonweb: any, jettonMinterAddress: string) {
  const jettonData = await tonweb.provider.call2(
    jettonMinterAddress,
    "get_jetton_data",
    []
  );
  const totalSupply = jettonData[0];
  const isMutable = jettonData[1].toNumber() === -1;
  const adminAddress = parseAddress(jettonData[2]);
  const jettonContentUri = parseOffchainUriCell(jettonData[3]);
  const tokenWalletCode = jettonData[4];

  return {
    totalSupply,
    isMutable,
    adminAddress,
    jettonContentUri,
    tokenWalletCode,
  };
}

async function getWrappedTokenData(tonweb: any, jettonWalletAddress: string) {
  const wrappedTokenData = await tonweb.provider.call2(
    jettonWalletAddress,
    "get_wrapped_token_data",
    []
  );

  const chainId = wrappedTokenData[0].toString();
  const tokenAddress = "0x" + wrappedTokenData[1].toString("hex");
  const decimals = wrappedTokenData[2].toString();
  const name = Buffer.from(wrappedTokenData[3].bits.array).toString();
  const symbol = Buffer.from(wrappedTokenData[4].bits.array).toString();
  return { chainId, tokenAddress, decimals, name, symbol };
}

async function getJettonWalletAddress({
  tonweb,
  userTonAddress,
  tokenAddress,
}: {
  tonweb: any;
  userTonAddress: Address;
  tokenAddress: string;
}) {
  const cell = new TonWeb.boc.Cell();

  cell.bits.writeAddress(userTonAddress);

  const getWalletAddressResponse = await tonweb.provider.call2(
    tokenAddress,
    "get_wallet_address",
    [["tvm.Slice", TonWeb.utils.bytesToBase64(await cell.toBoc(false))]]
  );
  const jettonWalletAddress = parseAddress(getWalletAddressResponse);
  return jettonWalletAddress;
}

export {
  getJettonData,
  getJettonWalletAddress,
  getJettonWalletData,
  getWrappedTokenData,
};
