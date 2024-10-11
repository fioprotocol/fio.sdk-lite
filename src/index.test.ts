import { decryptContent, signNonce, signTransaction } from './index';

const MEMO_PHRASE = 'Hello FIO SDK Lite';

const apiUrl = 'https://test.fio.eosusa.io';
const transactionActionParams = {
  apiUrl,
  actionParams: [
    {
      action: 'newfundsreq',
      account: 'fio.reqobt',
      data: {
        payer_fio_address: 'fio-sdk-handle@regtest',
        payee_fio_address: 'fio-sdk-handle-2@regtest',
        content: {
          amount: 12,
          payee_public_address:
            'FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr',
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
        'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
    },
  ],
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
};

const decryptContentParams = {
  content:
    '7csrl16e8rqNTJu9v+QyhhlAz4x/rcB2GaJgoSWzi2NyTvLVRBggZbPqQLvhszoPndkOg+xoDYGLYXaSQbDfbLViOwac5jI+iZ/YcMkXiVNALtSiyd9q94SHRR42PlRFg5FiVnX6vMU/3PRCH1WkLlQhi7oFsL4auz134YElOSbaqeLosTkuiHNW8/b7lmbE',
  encryptionPublicKey: 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
  fioContentType: 'new_funds_content',
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
};

describe('Test methods', () => {
  it('returns signed nonce', async () => {
    const result = signNonce({
      nonce: '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070',
      privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
    });

    expect(result).toEqual(
      'SIG_K1_Khs4gJmdH8R1GfWzwgDJy3SLUZhX7KJPP5QGQxTx2BXQ115vR1nASBWHHzZWPsp71czW2qENmygMC3PQffDgKXn2Tu7U54'
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
  });
});
