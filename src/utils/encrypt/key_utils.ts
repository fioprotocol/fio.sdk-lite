import assert from 'assert';
import BigInteger from 'bigi';
import base58 from 'bs58';
import { Buffer } from 'buffer';
import ecurve from 'ecurve';

import { ripemd160 } from './hash';
import { FIO_CHAIN_NAME } from '../../constants';

const curve = ecurve.getCurveByName('secp256k1');

export const publicKeyFromPrivateKey = ({
  privateKeyBuffer,
}: {
  privateKeyBuffer: Buffer;
}): string => {
  const privateKeyInt = BigInteger.fromBuffer(privateKeyBuffer);
  const Q = curve.G.multiply(privateKeyInt);

  return FIO_CHAIN_NAME + checkEncode({ keyBuffer: Q.getEncoded(true) });
};

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

  const check = [key];

  if (keyType) {
    check.push(Buffer.from(keyType));
  }

  const newCheckBuff = ripemd160(Buffer.concat(check)); // PVT
  const newCheck =
    newCheckBuff instanceof Buffer
      ? newCheckBuff.subarray(0, 4)
      : newCheckBuff.slice(0, 4);

  if (checksum.toString() !== newCheck.toString()) {
    throw new Error(
      'Invalid checksum, ' +
        `${checksum.toString('hex')} != ${newCheck.toString('hex')}`
    );
  }

  return key;
};
