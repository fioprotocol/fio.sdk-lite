import { signTransaction } from '../../index';
import { MEMO_PHRASE } from '../constants';
import { TestWallet } from '../types';

export const SignTransaction = ({
  apiUrl,
  wallet1,
  wallet2,
}: {
  apiUrl: string;
  wallet1: TestWallet;
  wallet2: TestWallet;
}) =>
  describe('Sign transaction', () => {
    it('returns signed transaction', async () => {
      const transactionActionParams = {
        apiUrl,
        actionParams: [
          {
            action: 'newfundsreq',
            account: 'fio.reqobt',
            data: {
              payer_fio_address: wallet2.fioHandle,
              payee_fio_address: wallet1.fioHandle,
              content: {
                amount: 12,
                payee_public_address: wallet1.publicKey,
                chain_code: 'FIO',
                token_code: 'FIO',
                memo: MEMO_PHRASE,
                hash: '',
                offline_url: '',
              },
              tpid: 'dashboard@fiouat',
              max_fee: 1500000000000,
            },
            contentType: 'new_funds_content',
            payerFioPublicKey: wallet2.publicKey,
          },
        ],
        privateKey: wallet1.privateKey,
      };
      const result = await signTransaction(transactionActionParams);

      const resultObj = JSON.parse(result);

      const expectedKeys = [
        'signatures',
        'compression',
        'packed_context_free_data',
        'packed_trx',
      ];

      expect(typeof resultObj === 'object').toBe(true);
      expect(Array.isArray(resultObj.successed)).toBe(true);

      expectedKeys.forEach((key) => {
        expect(resultObj.successed[0]).toHaveProperty(key);
      });
    });
  });
