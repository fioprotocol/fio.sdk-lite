import { signNonce, verifySignature } from '../../index';
import { TestWallet } from '../types';

export const SignNonce = ({ wallet }: { wallet: TestWallet }) =>
  describe('Sign nonce', () => {
    it('returns signed nonce', async () => {
      const nonce =
        '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070';

      const result = signNonce({
        nonce,
        privateKey: wallet.privateKey,
      });

      const isVerified = verifySignature({
        data: nonce,
        signature: result,
        publicKey: wallet.publicKey,
      });

      expect(isVerified).toEqual(true);
    });
  });
