import { signSignature } from './encrypt/signature';
import { SignNonceParams } from '../types';

export const signNonce = ({ nonce, privateKey }: SignNonceParams): string => {
  if (!nonce) throw new Error('Missing nonce for signing nonce.');

  const signature = signSignature({
    data: nonce,
    privateKey,
  });

  return signature;
};
