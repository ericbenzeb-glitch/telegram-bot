import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TON_ENDPOINT, TON_SEED } from './config.js';

const client = new TonClient({ endpoint: TON_ENDPOINT });
let wallet = null;

export async function getWallet() {
  if (!wallet) {
    const keyPair = await mnemonicToPrivateKey(TON_SEED.split(' '));
    wallet = client.open(
      WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey })
    );
  }
  return wallet;
}
