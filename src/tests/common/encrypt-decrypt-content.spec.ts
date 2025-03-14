import { decryptContent, encryptContent } from '../../index';
import { MEMO_PHRASE_ENCRYPTED } from '../constants';
import { TestWallet } from '../types';

export const EncryptDecryptContent = ({
  wallet1,
  wallet2,
}: {
  wallet1: TestWallet;
  wallet2: TestWallet;
}) =>
  describe('Encrypt and decrypt content', () => {
    it('check encrypted content', async () => {
      const encryptContentParams = {
        content: {
          payer_public_address: wallet2.publicKey,
          payee_public_address: wallet1.publicKey,
          amount: '20',
          chain_code: 'FIO',
          token_code: 'FIO',
          status: 'sent_to_blockchain',
          obt_id: '1',
          memo: MEMO_PHRASE_ENCRYPTED,
          hash: null,
          offline_url: null,
        },
        fioContentType: 'record_obt_data_content',
        privateKey: wallet1.privateKey,
        encryptionPublicKey: wallet2.publicKey,
      };
      const result = encryptContent(encryptContentParams);

      expect(typeof result === 'string').toBe(true);

      const decryptResult = decryptContent({
        content: result,
        encryptionPublicKey: wallet2.publicKey,
        fioContentType: encryptContentParams.fioContentType,
        privateKey: wallet1.privateKey,
      });

      expect(decryptResult.memo).toEqual(encryptContentParams.content.memo);
      expect(decryptResult.amount).toEqual(encryptContentParams.content.amount);
      expect(decryptResult.payee_public_address).toEqual(wallet1.publicKey);
      expect(decryptResult.payer_public_address).toEqual(wallet2.publicKey);
      expect(decryptResult.chain_code).toEqual(
        encryptContentParams.content.chain_code
      );
      expect(decryptResult.token_code).toEqual(
        encryptContentParams.content.token_code
      );
      expect(decryptResult.status).toEqual(encryptContentParams.content.status);
      expect(decryptResult.obt_id).toEqual(encryptContentParams.content.obt_id);
      expect(decryptResult.hash).toEqual(encryptContentParams.content.hash);
      expect(decryptResult.offline_url).toEqual(
        encryptContentParams.content.offline_url
      );

      const decryptResult2 = decryptContent({
        content: result,
        encryptionPublicKey: wallet1.publicKey,
        fioContentType: encryptContentParams.fioContentType,
        privateKey: wallet2.privateKey,
      });

      expect(decryptResult2.memo).toEqual(encryptContentParams.content.memo);
      expect(decryptResult2.amount).toEqual(
        encryptContentParams.content.amount
      );
      expect(decryptResult2.payee_public_address).toEqual(wallet1.publicKey);
      expect(decryptResult2.payer_public_address).toEqual(wallet2.publicKey);
      expect(decryptResult2.chain_code).toEqual(
        encryptContentParams.content.chain_code
      );
      expect(decryptResult2.token_code).toEqual(
        encryptContentParams.content.token_code
      );
      expect(decryptResult2.status).toEqual(
        encryptContentParams.content.status
      );
      expect(decryptResult2.obt_id).toEqual(
        encryptContentParams.content.obt_id
      );
      expect(decryptResult2.hash).toEqual(encryptContentParams.content.hash);
      expect(decryptResult2.offline_url).toEqual(
        encryptContentParams.content.offline_url
      );
    });
  });
