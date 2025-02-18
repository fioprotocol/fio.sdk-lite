import {
  decryptContent,
  encryptContent,
  getPublicKey,
  signNonce,
  signTransaction,
  verifySignature,
} from './index';

const MEMO_PHRASE = 'Hello FIO SDK Lite';
const MEMO_PHRASE_ENCRYPTED = 'Hello FIO SDK Lite Encrypted';

const wallet1 = {
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
  publicKey: 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
  fioHandle: 'fio-sdk-handle@regtest',
};

const wallet2 = {
  privateKey: '5JpWuB5YbjQBmoBcxbzTTuY9h2NNQNVD5Ct5yKU1d5QCowt1G8X',
  publicKey: 'FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr',
  fioHandle: 'fio-sdk-handle-2@regtest',
};

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

const apiUrl = 'https://testnet.fioprotocol.io';

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

const decryptContentParams = {
  content:
    'FoyXu0rQyBSbkvI3gJ2FIz6PBylbhxetqTMQpa3BEcogvnFg1EpWEZY+QyQEA2Ckv1/m2bbs+SfCiZXjieFAF9xfUiCQ+MK66Ky1ctn1JNx8BmDFI+1Wnyn2uoxwP55fZK0MUBw0hKTu7WnUHvDWPgFHsNdIyDVlB0lb174U37Hm1c8BS/KMpqjpN/E2xN9D',
  encryptionPublicKey: wallet2.publicKey,
  fioContentType: 'new_funds_content',
  privateKey: wallet1.privateKey,
};

describe('Test methods', () => {
  it('returns FIO Public key generated from private key', async () => {
    const result = getPublicKey({
      privateKey: wallet1.privateKey,
    });
    expect(result).toEqual(wallet1.publicKey);
  });

  it('returns signed nonce', async () => {
    const nonce =
      '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070';

    const result = signNonce({
      nonce,
      privateKey: wallet1.privateKey,
    });

    const isVerified = verifySignature({
      data: nonce,
      signature: result,
      publicKey: wallet1.publicKey,
    });

    expect(isVerified).toEqual(true);
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
    expect(result.payee_public_address).toEqual(wallet1.publicKey);
  });

  it('check encrypted content', async () => {
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

    const decryptResult2 = decryptContent({
      content: result,
      encryptionPublicKey: wallet1.publicKey,
      fioContentType: encryptContentParams.fioContentType,
      privateKey: wallet2.privateKey,
    });

    expect(decryptResult2.memo).toEqual(encryptContentParams.content.memo);
    expect(decryptResult2.amount).toEqual(encryptContentParams.content.amount);
    expect(decryptResult2.payee_public_address).toEqual(wallet1.publicKey);
  });
});
