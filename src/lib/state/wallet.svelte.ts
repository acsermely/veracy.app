import Arweave from "arweave";
import type { State } from "arweave-wallet-connector";
import { ArweaveWebWallet } from "arweave-wallet-connector";
import { getContext, setContext } from "svelte";

export class WalletState {
  isConnected = $state<boolean>(false);
  address = $state<string>("");

  state = $state<Partial<State>>({
    url: "arweave.app",
  });
  wallet = $state<any>();

  connectWeb = async (): Promise<void> => {
    const wallet = new ArweaveWebWallet(
      {
        name: "Permit_v0",
      },
      {
        state: this.state,
      }
    );
    try {
      wallet.on("connect", () => {
        console.log("connect");
        this.wallet = wallet;
        this.address = this.wallet.address;
        this.isConnected = true;
      });
      wallet.on("disconnect", () => {
        console.log("disconnect");
        this.isConnected = false;
        return;
      });
      await wallet.connect(["DISPATCH", "ACCESS_ADDRESS", "ACCESS_PUBLIC_KEY"]);
      console.log("wallet:", wallet.keepPopup, wallet.usePopup);
    } catch (e) {
      console.error("sub", e);
      this.isConnected = false;
    }
  };

  getPublicKey = async (): Promise<JsonWebKey> => {
    const key = await this.wallet.getPublicKey();

    const publicJWK: JsonWebKey = {
      e: "AQAB",
      alg: "RSA-OAEP-256",
      ext: true,
      kty: "RSA",
      n: key,
    };

    console.log(publicJWK);
    return publicJWK;
  };

  decrypt = async (message: string): Promise<string> => {
    const buff = Arweave.utils.stringToBuffer(message);
    const decryptedBuff = await this.wallet.decrypt(new Uint8Array(buff), {
      name: "RSA-OAEP",
    });
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuff);
  };
}

const WALLET_STATE_KEY = "wallet-state-key";

export function setWalletState(): WalletState {
  return setContext(WALLET_STATE_KEY, new WalletState());
}

export function getWalletState(): WalletState {
  return getContext<WalletState>(WALLET_STATE_KEY);
}
