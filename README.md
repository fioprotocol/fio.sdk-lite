# FIO SDK Lite

FIO SDK Lite is a lightweight library for signing transactions, decrypting FIO Requests, and signing nonces on the FIO blockchain.

For more information on FIO, visit the [FIO website](https://fio.foundation).

To explore the FIO Chain, API, and SDKs, check out the [FIO Protocol Developer Hub](https://developers.fioprotocol.io).

## Installation

To install the FIO SDK Lite, run:

```bash
npm install @fioprotocol/fio-sdk-lite
```

## Type Documentation

Full type documentation is available [here](https://fioprotocol.github.io/fio.sdk-lite/)

## Usage

Warning:  In some transaction parameters, there is an `actor` parameter. You don't need to pass it because it is derived from the public key, which is in turn derived from the private key used to sign the transaction.

### Sign Transaction

The following example demonstrates how to sign FIO blockchain transactions. It supports signing multiple transactions at once.

```
import { signTransaction } from '@fioprotocol/fio-sdk-lite';

const apiUrl = 'https://testnet.fioprotocol.io'; (should be without traling slash)
const params = {
  apiUrl,
  actionParams: [
    {
      action: 'regaddress',
      account: 'fio.address',
      data: {
        fio_address: 'fio-sdk-handle-test@regtest',
        owner_fio_public_key: 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
        tpid: 'dashboard@fiouat',
        max_fee: 1500000000000,
      },
    },
  ],
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
};

const signedTransactions = await signTransaction(params);
const signedTransactionsResult = JSON.parse(signedTransactions);

console.log(signedTransactionsResult);
// Example output:
// {
//   successed: [
//     {
//       signatures: ['SIG_K1_...'],
//       compression: 0,
//       packed_context_free_data: '',
//       packed_trx: '96e2186776489adaea1b000000000...',
//     }
//   ],
//   failed: [] // Failed transactions, if any, will be listed here.
// }

//After signing, you must broadcast the transaction to the FIO server. This is an example:

const pushTransactionResult = async (signedTxn) => {
  const pushResult = await fetch(
    'https://testnet.fioprotocol.io/v1/chain/push_transaction',
    {
      body: JSON.stringify(signedTxn),
      method: 'POST',
    }
  );

  if ([400, 403, 500].includes(pushResult.status)) {
    const jsonResult = await pushResult.json();
    const errorMessage = jsonResult.message || 'Something went wrong';

    if (jsonResult.fields) {
      const fieldErrors = jsonResult.fields.map(field => ({
        name: field.name,
        value: field.value,
        error: field.error,
      }));

      throw new Error(`${errorMessage}: ${JSON.stringify(fieldErrors)}`);
    } else if (jsonResult.error && jsonResult.error.what) {
      throw new Error(jsonResult.error.what);
    } else {
      throw new Error(errorMessage);
    }
  }

  return await pushResult.json();
};

const results = await Promise.allSettled(
  signedTxns.successed.map(pushTransactionResult)
);

// Handle fulfilled results

```

### Decrypt Content

Use this function to decrypt content in FIO Requests or FIO Data.

```
import { decryptContent } from '@fioprotocol/fio-sdk-lite';

const getFioReqestParams = {
  fio_public_key: "FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF",
  limit: 100,
  offset: 0,
};

const sentFioRequests = await fetch(
  'https://testnet.fioprotocol.io/v1/chain/get_sent_fio_requests',
  {
    body: JSON.stringify(getFioReqestParams),
    method: 'POST',
  },
);
//
//{
//    "requests": [
//        {
//            "fio_request_id": 25643,
//            "payer_fio_address": "fio-sdk-handle-2@regtest",
//            "payee_fio_address": "fio-sdk-handle@regtest",
//            "payer_fio_public_key": "FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr",
//           "payee_fio_public_key": "FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF",
//            "content": "FoyXu0rQyBSbkvI3gJ2FIz6PBylbhxetqTMQpa3BEcogvnFg1EpWEZY+QyQEA2Ckv1/m2bbs+SfCiZXjieFAF9xfUiCQ+MK66Ky1ctn1JNx8BmDFI+1Wnyn2uoxwP55fZK0MUBw0hKTu7WnUHvDWPgFHsNdIyDVlB0lb174U37Hm1c8BS/KMpqjpN/E2xN9D",
//            "time_stamp": "2024-10-13T09:19:11",
//            "status": "requested"
//        },
//        {
//            "fio_request_id": 25644,
//            "payer_fio_address": "fio-sdk-handle-2@regtest",
//            "payee_fio_address": "fio-sdk-handle@regtest",
//            "payer_fio_public_key": "FIO8hnBb7aUDFs6cvCT2TCRQs9vV9jxJbKLCe5q23Zb8Wr36DxsUr",
//            "payee_fio_public_key": "FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF",
//            "content": "o/yFWiuvN7bbRk70e/Jw3GSUwN3xM2pPIHneFYW+pfhUG0xTHAIC+XYDonTbNXACxhotLYzcbal4vBEy8bCa9YznvRT9MoETKX60vYrBOA/wljnlirHhRgvKT3EaVY38qxk9qeu/ZA25xSQj9yblB6YkmVEv0yUailYwS2VIkM8=",
//            "time_stamp": "2024-10-13T10:56:03",
//            "status": "requested"
//        }
//    ],
//    "more": 0
//}

// Will take as an example on of the requests.

const fioRequestToDecrypt = sentFioRequests.requests[0];

const decryptedContent = decryptContent({
  content: fioRequestToDecrypt.content,
  encryptionPublicKey: fioRequestToDecrypt.payer_fio_public_key,
  fioContentType: 'new_funds_content', // or 'record_obt_data_content' for FIO Data
  privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw', // FIO Private key
});

console.log(decryptedContent);
//
//  {
//    payee_public_address: 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF',
//    amount: '12',
//    chain_code: 'FIO',
//    token_code: 'FIO',
//    memo: 'Memo phrase',
//    hash: null,
//    offline_url: null
//  }
```

### Sign nonce

Sign a nonce using the FIO Private key.

```
import { signNonce } from '@fioprotocol/fio-sdk-lite';
import { createHmac, randomBytes } from 'crypto-browserify';

const secret = 'nvjrf43dwmcsl';

const stringToHash = randomBytes(8).toString('hex');

const nonce = createHmac('sha256', secret)
  .update(stringToHash)
  .digest('hex');
// Something like '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070'

const singedNonce = signNonce({ nonce, privateKey });

console.log(singedNonce);
// 'SIG_K1_...'

```

### Verify Signature

Verify the signature of a nonce. This can be used to validate the signature with the public and private key pair.

```
import { signNonce } from '@fioprotocol/fio-sdk-lite';

const signature = 'SIG_K1_...' // Signature from the signed nonce
const data = '6d2242964fbf8a611c26b5cdabec56ff318cf75484fefa4ceebc2a1bc9ea4070'; // Saved nonce
const publicKey = 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF';

const isSignatureVerified = ({
  signature,
  data,
  encoding, // Default encoding is 'utf8'
  publicKey,
});

console.log(isSignatureVerified);
// Output: true or false
```

### Get Public Key
Retrieve the associated FIO public key from a private key.

```
import { getPublicKey } from '@fioprotocol/fio-sdk-lite';

const privateKey = '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw';

const publicKey = getPublicKey({ privateKey });

console.log(publicKey);
// 'FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF'
```

## Testing

Run tests using:

```bash
npm run test
```

## Environment

Requires Node.js version 20 and higher.

## Local Instalation

Run 
```bash
npm install
```

## Build

To build the project, run:
```bash
npm run build
```

## Build docs

To build docs of the project, run:
```bash
npm run docs
```

## New version rollout to npm
1. Run tests
2. Update version in package.json
3. Build docs
4. Make build
5. Publish to npm
