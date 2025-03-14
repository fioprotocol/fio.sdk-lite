import { decryptContent } from '../../utils/encrypt/decrypt-fio';
import { MEMO_PHRASE } from '../constants';
import { TestWallet } from '../types';

export const DecryptContentFromOtherEncryption = ({
  wallet1,
  wallet2,
}: {
  wallet1: TestWallet;
  wallet2: TestWallet;
}) =>
  describe('Decrypt content from other encryption', () => {
    /**
     * Decrypt Content Parameters
     *
     * These parameters are used to decrypt content created by the main FIO SDK library.
     *
     * To create a new FIO request:
     * 1. Visit https://dev.fio.net/reference/new_funds_request
     * 2. Follow the API documentation instructions
     * 3. Use matching FIO keys for sender and recipient wallets in .env file
     *    - This ensures content encryption/decryption works correctly across environments
     */
    const decryptContentParams = {
      content: process.env.ENCRYPTED_CONTENT_STRING!,
      encryptionPublicKey: wallet2.publicKey,
      fioContentType: 'new_funds_content',
      privateKey: wallet1.privateKey,
    };

    it('check decrypted content', async () => {
      if (!decryptContentParams.content) {
        throw new Error('ENCRYPTED_CONTENT_STRING is not set');
      }

      const result = decryptContent(decryptContentParams);

      expect(result.memo).toEqual(MEMO_PHRASE);
      expect(result.amount).toEqual('12');
      expect(result.payee_public_address).toEqual(wallet1.publicKey);
    });
  });
