import { DataParams } from '../../types';
import { getCipherContent } from '../encrypt/encrypt-fio';

export const cypherContent = ({
  content,
  contentType,
  encryptionPublicKey,
  privateKey,
}: {
  content: DataParams['content'];
  contentType: string;
  encryptionPublicKey: string;
  privateKey: string;
}): string => {
  if (!content) {
    throw new Error('Missing content parameter');
  }
  if (!contentType) {
    throw new Error('Missing FIO content type');
  }
  if (!encryptionPublicKey) {
    throw new Error('Missing encrypt public key');
  }

  const cypheredContent = getCipherContent({
    content,
    fioContentType: contentType,
    privateKey,
    encryptionPublicKey,
  });

  return cypheredContent;
};
