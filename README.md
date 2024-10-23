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

```typescript
import { signTransaction } from 'fio-sdk-lite';

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
                    fio_address: 'test100004@regtest',
                    owner_fio_public_key: '',
                    tpid: '',
                    max_fee: 1500000000000, // Obtain from https://dev.fio.net/reference/get_fee
                },
            },
        ],
        privateKey: '5JSTL6nnXztYTD1buYfYSqJkNZTBdS9MDZf5nZsFW7gZd1pxZXo',
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

## Decrypt Content

Use this function to decrypt content in FIO Requests or FIO Data.

```typescript
import { decryptContent } from 'fio-sdk-lite';

async function main() {
    // URL of FIO Chain API node, see: https://bpmonitor.fio.net/nodes
    const apiUrl = 'https://test.fio.eosusa.io'; // No trailing slashes
    const params = {
        fio_public_key: "FIO7MYkz3serGGGanVPnPPupE1xSm1t7t8mWJ3H7KEd2vS2ZZbXBF",
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
        const decryptedContent = decryptContent({
            content: fioRequestToDecrypt.content,
            encryptionPublicKey: fioRequestToDecrypt.payer_fio_public_key,
            fioContentType: 'new_funds_content', // new_funds_content - FIO Request, or 'record_obt_data_content' - FIO Data
            privateKey: '5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw',
            // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
            // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
        });
        console.log(decryptedContent);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
```

## Get Public Key from Private key and sign/verify nonce

```typescript
import { signNonce, getPublicKey, verifySignature} from 'fio-sdk-lite';
import { createHmac, randomBytes } from 'crypto-browserify';

async function main() {
    const privKey = '5JSTL6nnXztYTD1buYfYSqJkNZTBdS9MDZf5nZsFW7gZd1pxZXo';
    // Get one for testing at: http://monitor.testnet.fioprotocol.io:3000/#createKey
    // And add tokens from faucet at: http://monitor.testnet.fioprotocol.io:3000/#faucet
    const secret = 'nvjrf43dwmcsl';

    try {
        // Get public key from Private key
        const publicKey = getPublicKey({ privateKey: privKey });
        console.log(publicKey);

        // Generate nonce
        const stringToHash = randomBytes(8).toString('hex');
        const nonce = createHmac('sha256', secret)
            .update(stringToHash)
            .digest('hex');

        // Sign nonce
        const singedNonce = signNonce({ nonce, privateKey: privKey });
        console.log(singedNonce);

        // Verify nonce
        const isSignatureVerified = verifySignature({
            singedNonce,
            nonce,
            encoding: 'utf8', // Default encoding is 'utf8'
            publicKey,
        });
        console.log(isSignatureVerified);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
```

# Testing

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
