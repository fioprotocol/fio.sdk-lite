import { DataParams } from '../../types';
import { getCipherContent } from '../encrypt/encrypt-fio';

export const encryptContent = ({
  content,
  encryptionPublicKey,
  fioContentType,
  privateKey,
}: {
  content: DataParams['content'];
  encryptionPublicKey: string;
  fioContentType: string;
  privateKey: string;
}): string => {
  if (!content) {
    throw new Error('Missing content parameter');
  }
  if (!fioContentType) {
    throw new Error('Missing FIO content type');
  }
  if (!encryptionPublicKey) {
    throw new Error('Missing encrypt public key');
  }

  const cypheredContent = getCipherContent({
    content,
    fioContentType,
    privateKey,
    encryptionPublicKey,
  });

  return cypheredContent;
};
