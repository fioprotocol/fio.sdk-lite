import { getPublicKey } from '../../utils/getKeys';
import { TestWallet } from '../types';

export const PublicKeyFromPrivateKey = ({ wallet }: { wallet: TestWallet }) =>
  describe('Public key from private key', () => {
    it('returns FIO Public key generated from private key', async () => {
      const result = getPublicKey({
        privateKey: wallet.privateKey,
      });
      expect(result).toEqual(wallet.publicKey);
    });
  });
