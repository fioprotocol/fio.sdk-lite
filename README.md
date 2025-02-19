# FIO SDK Lite

FIO SDK Lite is a lightweight library for signing transactions, decrypting FIO Requests, and signing nonces on the FIO blockchain.

For more information on FIO, visit the [FIO website](https://fio.net).

To explore the FIO Chain, API, and SDKs, check out the [FIO Protocol Developer Hub](https://dev.fio.net/).

# Installation

To install the FIO SDK Lite, run:

```bash
npm install @fioprotocol/fio-sdk-lite
```

# Type Documentation

Full type documentation is available [here](https://fioprotocol.github.io/fio.sdk-lite/)

# Usage

Warning:  In some transaction parameters, there is an `actor` parameter. You don't need to pass it because it is derived from the public key, which is in turn derived from the private key used to sign the transaction.

## Sign Transaction

The following example demonstrates how to sign FIO blockchain transactions. It supports signing multiple transactions at once.

Action parameters `actionParams`:
- `action` - **Required**. Action name of the specific action on FIO Chain, e.g. for registering FIO Handle: regaddress. For more details see [FIO Chain Action API](https://dev.fio.net/reference/fio-chain-actions-api).

- `account`- **Required**. Account name for contract matching the specific action on FIO Chain, e.g. for registering FIO Handle: fio.address. For more details see [FIO Chain Action API](https://dev.fio.net/reference/fio-chain-actions-api).

- `authActor` - **Not required**. Represents FIO Account which will execute the action. In most cases this is the [hashed FIO Public Key](https://dev.fio.net/docs/fio-account-name-hash-function). Is used if another actor will be used for authorization.

- `contentType` - **Required** for `newfundsreq` (FIO Request) and `recordobt` (FIO Data) actions. 'new_funds_content' - FIO Request, or 'record_obt_data_content' - FIO Data.

- `data` - **Required**. Body parameters for signing a transaction. See https://dev.fio.net/reference/fio-chain-actions-api

- `dataActor` - **Not required**. Represents FIO Account which will execute the action. In most cases this is the hashed FIO Public Key. Is used if another account will execute an action.

- `id` - **Not required**. Transaction ID that you want to sign. This is helpful for error handling.

- `payeeFioPublicKey` - **Required** when action is: `recordobt`. FIO Public key of the wallet who will receive an OBT data record. This is used for [encryption](https://dev.fio.net/docs/encryption-in-fio-request-and-fio-data).

- `payerFioPublicKey` - **Required** when action is: `newfundsreq`. FIO Public key of the wallet who will receive a FIO Request. This is used for [encryption](https://dev.fio.net/docs/encryption-in-fio-request-and-fio-data).

- `timeoutOffset` - **Not required**. Time offset for transaction expiration in milliseconds. By default, this is set to 60000 milliseconds, equivalent to 1 minute.

```typescript
import { signTransaction } from '@fioprotocol/fio-sdk-lite';

async function main() {
    // URL of FIO Chain API node, see: https://bpmonitor.fio.net/nodes
    const apiUrl = 'https://test.fio.eosusa.io'; // No trailing slashes

    // Transaction data, see https://dev.fio.net/reference/fio-chain-actions-api
    // actor is omitted as it will be inserted by the SDK.
    const params = {
        apiUrl,
        actionParams: [
            {
                action: 'regaddress',
                account: 'fio.address',
                data: {
                    fio_address: `testing-fio-handle-${Date.now()}@regtest`,
                    owner_fio_public_key: '',
                    tpid: '',
                    max_fee: 1500000000000, // Obtain from https://dev.fio.net/reference/get_fee
                },
            },
        ],
        privateKey: FIO_PRIVATE_KEY,
        // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
        // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
    };

    try {
        const signedTransactions = await signTransaction(params);
        const signedTransactionsResult = JSON.parse(signedTransactions);

        const pushTransactionResult = async (signedTransactionsResult: any) => {
            const pushResult = await fetch(
                apiUrl+'/v1/chain/push_transaction',
                {
                    body: JSON.stringify(signedTransactionsResult),
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
            signedTransactionsResult.successed.map(pushTransactionResult)
        );
        console.log(results);
        const processedData = results[0].status === 'fulfilled' ? results[0].value.processed : null;
        if (processedData) {
            const response = JSON.parse(processedData.action_traces[0].receipt.response);
            console.log('Processed Data Response:', JSON.stringify(response, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
```

## Encrypt Content

Use this function to encrypt content for [FIO Request](https://dev.fio.net/reference/new_funds_request) or [FIO Data](https://dev.fio.net/reference/record_obt_data)..

Parameters:
- `content` - **Required**. Content object to encrypt. Must match the schema for the specified `fioContentType`.

- `encryptionPublicKey` - **Required**. FIO Public key of the recipient wallet that will be used for encryption. This is used for [encryption](https://dev.fio.net/docs/encryption-in-fio-request-and-fio-data).

- `fioContentType` - **Required**. Set as follows:
    - `newfundsreq`: new_funds_content
    - `recordobt`: record_obt_data_content

- `privateKey` - **Required**. FIO Private key of the sender.

```typescript
import { encryptContent } from '@fioprotocol/fio-sdk-lite';

async function main() {
    const content = {
        payee_public_address: 'purse@alice',
        amount: '1',
        chain_code: 'FIO',
        token_code: 'FIO',
        memo: 'Payment for services',
        hash: '',
        offline_url: ''
    };

    try {
        const encryptedContent = encryptContent({
            content,
            encryptionPublicKey: FIO_PUBLIC_KEY_RECIPIENT, // FIO Public key of the recipient wallet that will be used for encryption
            fioContentType: 'new_funds_content', // new_funds_content - FIO Request, or 'record_obt_data_content' - FIO Data
            privateKey: FIO_PRIVATE_KEY_SENDER // FIO Private key of the sender
            // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
            // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
        });
        console.log(encryptedContent);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
```

## Decrypt Content

Use this function to decrypt content in FIO Requests or FIO Data.

Parameters:
- `content` - **Required**. Encrypted blob. The content field from [FIO Request](https://dev.fio.net/reference/get_pending_fio_requests) or [FIO Data](https://dev.fio.net/reference/get_obt_data).

- `encryptionPublicKey` - **Required**. FIO Public key of the other wallet that was used for encryption. This is returned by [/get_pending_fio_requests](https://dev.fio.net/reference/get_pending_fio_requests) and [/get_obt_data](https://dev.fio.net/reference/get_obt_data). This is used for [decryption](https://dev.fio.net/docs/encryption-in-fio-request-and-fio-data).

- `fioContentType` - **Required**. Set as follows:
    - `newfundsreq`: new_funds_content
    - `recordobt`: record_obt_data_content

- `privateKey` - **Required**. FIO Private key.

```typescript
import { decryptContent } from '@fioprotocol/fio-sdk-lite';

async function main() {
    // URL of FIO Chain API node, see: https://bpmonitor.fio.net/nodes
    const apiUrl = 'https://test.fio.eosusa.io'; // No trailing slashes
    const params = {
        fio_public_key: FIO_PUBLIC_KEY_SENDER, // FIO Public key of the sender wallet that will be used for encryption.
        // You need to have pending FIO Request from the sender to the recipient.
        // You can make it using [/new_funds_request](https://dev.fio.net/reference/new_funds_request) action.
        limit: 1,
        offset: 0,
    };

    try {
        const response = await fetch(apiUrl+'/v1/chain/get_sent_fio_requests',
            {
                body: JSON.stringify(params),
                method: 'POST',
            },
        );
        const sentFioRequests = await response.json();
        const fioRequestToDecrypt = sentFioRequests.requests[0];
        const decryptedContentSender = decryptContent({
            content: fioRequestToDecrypt.content,
            encryptionPublicKey: fioRequestToDecrypt.payer_fio_public_key,
            fioContentType: 'new_funds_content', // new_funds_content - FIO Request, or 'record_obt_data_content' - FIO Data
            privateKey: FIO_PRIVATE_KEY_SENDER, // FIO Private key of the sender
            // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
            // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
        });

        const decryptedContentRecipient = decryptContent({
            content: fioRequestToDecrypt.content,
            encryptionPublicKey: fioRequestToDecrypt.payee_fio_public_key,
            fioContentType: 'new_funds_content', // new_funds_content - FIO Request, or 'record_obt_data_content' - FIO Data
            privateKey: FIO_PRIVATE_KEY_RECIPIENT, // FIO Private key of the recipient
        });
    
        // Decrypted content should be the same for both sender and recipient
        console.log(decryptedContentSender);
        console.log(decryptedContentRecipient);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
```

## Get Public Key from Private key and sign/verify nonce

Parameters `getPublicKey`:

- `privateKey` - **Required**. FIO Private key.

Parameters `signNonce`:

- `nonce` - **Required**. Nonce to sign.

- `privateKey` - **Required**. FIO Private key.

Parameters `verifySignature`:

- `signature` - **Required**. Signed signature string.

- `data` - **Required**. Is a nonce value.

- `publicKey` - **Required**. FIO Public key.

- `encoding` - **Not required**. Is one of Buffer Encoding names: "ascii", "utf8", "utf-8", "utf16le", "utf-16le", "ucs2", "ucs-2", "base64", "base64url", "latin1", "binary", "hex". By default is automatically set as `utf8`.

```typescript
import { signNonce, getPublicKey, verifySignature} from '@fioprotocol/fio-sdk-lite';
import { createHmac, randomBytes } from 'crypto-browserify';

async function main() {
  const privKey = FIO_PRIVATE_KEY;
  // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
  // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
  const secret = 'nvjrf43dwmcsl';

  try {
    // Get public key from Private key
    const publicKey = getPublicKey({ privateKey: privKey });
    console.log('Public key', publicKey);

    // Generate nonce
    const stringToHash = randomBytes(8).toString('hex');
    const nonce = createHmac('sha256', secret)
      .update(stringToHash)
      .digest('hex');

    // Sign nonce
    const singedNonce = signNonce({ nonce, privateKey: privKey });
    console.log('Signed nonce', singedNonce);

    // Verify nonce
    const isSignatureVerified = verifySignature({
      signature: singedNonce,
      data: nonce,
      publicKey,
    });
    console.log(isSignatureVerified);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

# Testing

To run tests, you need to have 2 FIO wallets with FIO Handles already created. Set it in `.env` file using `.env.example` as a template.
Run tests using:

```bash
npm run test
```

# Environment

Requires Node.js version 20 and higher.

# Local Instalation

## Build and run 
```bash
npm install
npm run build
```

## Build docs
To build docs of the project, run:
```bash
npm run docs
```
