import { getPrivateKeyBuffer } from './getKeys';
import { signSignature } from './encrypt/signature';
import { SignNonceParams } from '../types';

export const signNonce = ({ nonce, privateKey }: SignNonceParams): string => {
  const privateKeyBuffer = getPrivateKeyBuffer({ privateKey });

  if (!nonce) throw new Error('Missing nonce for signing nonce.');

  const signature = signSignature({
    data: nonce,
    privateKeyBuffer: privateKeyBuffer.subarray(1),
  });

  return signature;
};
