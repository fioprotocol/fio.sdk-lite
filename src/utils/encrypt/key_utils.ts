import assert from 'assert';
import base58 from 'bs58';
import { Buffer } from 'buffer';

import { ripemd160, sha256 } from './hash';

export const checkEncode = ({
  keyBuffer,
  keyType = null,
}: {
  keyBuffer: Buffer;
  keyType?: string | null;
}) => {
  assert(Buffer.isBuffer(keyBuffer), 'expecting keyBuffer<Buffer>');

  const check = [keyBuffer];
  if (keyType) {
    check.push(Buffer.from(keyType));
  }
  const checksumBuffer = ripemd160(Buffer.concat(check));
  const checksum =
    checksumBuffer instanceof Buffer
      ? checksumBuffer.subarray(0, 4)
      : Buffer.from(checksumBuffer.slice(0, 4));

  return base58.encode(Buffer.concat([keyBuffer, checksum]));
};

export const checkDecode = ({
  keyString,
  keyType = null,
}: {
  keyString: string;
  keyType?: string | null;
}) => {
  assert(keyString != null, 'private key expected');

  const buffer = Buffer.from(base58.decode(keyString));
  const checksum = buffer.subarray(-4);
  const key = buffer.subarray(0, -4);

  let newCheck;

  if (keyType === 'sha256x2') {
    const hashOne = sha256(key);
    const hash = Buffer.isBuffer(hashOne) ? sha256(hashOne) : hashOne;
    newCheck = Buffer.isBuffer(hash) ? hash.subarray(0, 4) : hash.slice(0, 4);
  } else {
    const check = [key];

    if (keyType) {
      check.push(Buffer.from(keyType));
    }
    const hash = ripemd160(Buffer.concat(check));
    newCheck = hash instanceof Buffer ? hash.subarray(0, 4) : hash.slice(0, 4);
  }

  if (checksum.toString() !== newCheck.toString()) {
    throw new Error(
      'Invalid checksum, ' +
        `${checksum.toString('hex')} != ${newCheck.toString('hex')}`
    );
  }

  return key;
};
