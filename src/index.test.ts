import {
  decryptContent,
  getPublicKey,
  signNonce,
  signTransaction,
} from './index';

const MEMO_PHRASE = 'Hello FIO SDK Lite';

const apiUrl = 'https://test.fio.eosusa.io';
const transactionActionParams = {
  apiUrl,
  actionParams: [
    {
      action: 'newfundsreq',
      account: 'fio.reqobt',
      data: {
        payer_fio_address: 'fio-sdk-handle-2@regtest',
        payee_fio_address: 'fio-sdk-handle@regtest',
        content: {
          amount: 12,
          payee_public_address:
            'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
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
      payerFioPublicKey:
        'FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr',
    },
  ],
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
};

const decryptContentParams = {
  content:
    'FoyXu0rQyBSbkvI3gJ2FIz6PBylbhxetqTMQpa3BEcogvnFg1EpWEZY+QyQEA2Ckv1/m2bbs+SfCiZXjieFAF9xfUiCQ+MK66Ky1ctn1JNx8BmDFI+1Wnyn2uoxwP55fZK0MUBw0hKTu7WnUHvDWPgFHsNdIyDVlB0lb174U37Hm1c8BS/KMpqjpN/E2xN9D',
  encryptionPublicKey: 'FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr',
  fioContentType: 'new_funds_content',
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
};

describe('Test methods', () => {
  it('returns FIO Public key generated from private key', async () => {
    const result = getPublicKey({
      privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
    });
    expect(result).toEqual(
      'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF'
    );
  });

  it('returns signed nonce', async () => {
    const result = signNonce({
      nonce: '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070',
      privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
    });

    expect(result).toEqual(
      'SIG_K1_K7CGyRFna4ZcwaGLgrXDP21qu1rRugexiLDT9qiGTCyC2xpxc1wfTp4tbh39ybm617VbGAUaePccAAdRm38smm28p1RHBR'
    );
  });

  it('returns signed transaction', async () => {
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

  it('check decrypted content', async () => {
    const result = decryptContent(decryptContentParams);

    expect(result.memo).toEqual(MEMO_PHRASE);
    expect(result.amount).toEqual('12');
    expect(result.payee_public_address).toEqual(
      'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF'
    );
  });
});
