import { DecryptedContent } from '../../types';
import { getUncipherContent } from './encrypt-fio';

export const decryptContent = ({
  content,
  encryptionPublicKey,
  fioContentType,
  privateKey,
}: {
  content: string;
  encryptionPublicKey: string;
  fioContentType: string;
  privateKey: string;
}): DecryptedContent => {
  if (!content) {
    throw new Error('Missing content parameter to decrypt');
  }
  if (!encryptionPublicKey) {
    throw new Error('Missing encryption Public Key parameter to decrypt');
  }
  if (!fioContentType) {
    throw new Error('Missing content type parameter to decrypt');
  }

  const uncipheredContent = getUncipherContent({
    encryptionPublicKey,
    fioContentType,
    content,
    privateKey,
  });

  return uncipheredContent;
};
