export const getPrivateKeyBuffer = ({
  privateKey,
}: {
  privateKey: string;
}): Buffer => {
  const versionByte = Buffer.from('80', 'hex');

  if (!privateKey) throw new Error('Private key is missing');

  return Buffer.concat([versionByte, Buffer.from(privateKey)]);
};
