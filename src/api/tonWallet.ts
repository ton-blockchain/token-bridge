import BN from "bn.js";
import TonWeb from "tonweb";
import { Address } from "tonweb/dist/types/utils/address";

async function burnJetton({
  tonwebWallet,
  destinationAddress,
  userTonAddress,
  jettonWalletAddress,
  jettonAmountWithDecimals,
}: {
  tonwebWallet: any;
  destinationAddress: BN;
  userTonAddress: Address;
  jettonWalletAddress: Address | null;
  jettonAmountWithDecimals: BN;
}) {
  if (!jettonWalletAddress) return;
  const burnOP = 0x595f07bc; // burn op
  const queryId = new TonWeb.utils.BN(0);

  const burnPayload = new TonWeb.boc.Cell();
  burnPayload.bits.writeUint(burnOP, 32);
  const customPayload = new TonWeb.boc.Cell();
  customPayload.bits.writeUint(destinationAddress, 160);
  burnPayload.bits.writeUint(queryId, 64);
  burnPayload.bits.writeCoins(jettonAmountWithDecimals);
  burnPayload.bits.writeAddress(userTonAddress);
  burnPayload.bits.writeBit(1);
  burnPayload.refs.push(customPayload);


  await tonwebWallet.provider.send("ton_sendTransaction", [
    {
      to: jettonWalletAddress?.toString(true, true, true),
      value: TonWeb.utils.toNano("1").toString(),
      data: TonWeb.utils.bytesToBase64(await burnPayload.toBoc()),
      dataType: "boc",
    },
  ]);
}

async function mintJetton({
  tonwebWallet,
  queryId,
  bridgeTonAddress,
}: {
  tonwebWallet: any;
  queryId: string;
  bridgeTonAddress: string;
}) {
  const mintOP = 8;

  const mintPayload = new TonWeb.boc.Cell();
  mintPayload.bits.writeUint(mintOP, 32);
  mintPayload.bits.writeUint(new TonWeb.utils.BN(queryId), 64);

  await tonwebWallet.provider.send("ton_sendTransaction", [
    {
      to: bridgeTonAddress,
      value: TonWeb.utils.toNano("1").toString(),
      data: TonWeb.utils.bytesToBase64(await mintPayload.toBoc()),
      dataType: "boc",
    },
  ]);
}

export { burnJetton, mintJetton };
