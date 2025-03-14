import 'dotenv/config';

import { getPublicKey } from '../index';

import { PublicKeyFromPrivateKey } from './common/public-key-from-private-key.spec';
import { SignNonce } from './common/sign-nonce.spec';
import { SignTransaction } from './common/sign-tranasction.spec';
import { DecryptContentFromOtherEncryption } from './common/decrypt-content-from-other-encryption.spec';
import { EncryptDecryptContent } from './common/encrypt-decrypt-content.spec';
import { VoteForBlockProducer } from './common/vote-for-block-producer.spec';
import { GetRawAbis } from './common/get-raw-abis.spec';
const wallet1 = {
  privateKey: process.env.WALLET1_PRIVATE_KEY!,
  publicKey: getPublicKey({ privateKey: process.env.WALLET1_PRIVATE_KEY! }),
  fioHandle: process.env.WALLET1_FIO_HANDLE!,
};

const wallet2 = {
  privateKey: process.env.WALLET2_PRIVATE_KEY!,
  publicKey: getPublicKey({ privateKey: process.env.WALLET2_PRIVATE_KEY! }),
  fioHandle: process.env.WALLET2_FIO_HANDLE!,
};

const apiUrl = 'https://testnet.fioprotocol.io';

// Test cases list
PublicKeyFromPrivateKey({ wallet: wallet1 });
SignNonce({ wallet: wallet1 });
SignTransaction({ wallet1, wallet2, apiUrl });
DecryptContentFromOtherEncryption({ wallet1, wallet2 });
EncryptDecryptContent({ wallet1, wallet2 });
VoteForBlockProducer({ wallet: wallet1, apiUrl });
GetRawAbis({ apiUrl });
