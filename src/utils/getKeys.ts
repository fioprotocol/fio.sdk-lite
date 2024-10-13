import BigInteger from 'bigi';
import ecurve from 'ecurve';

const curve = ecurve.getCurveByName('secp256k1');

import { checkDecode, checkEncode } from './encrypt/key_utils';
import { FIO_CHAIN_NAME } from '../constants';

const fromBuffer = (buf: Buffer) => {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('Expecting parameter to be a Buffer type');
  }
  if (buf.length === 33 && buf[32] === 1) {
    // remove compression flag
    buf = buf.slice(0, -1);
  }
  if (32 !== buf.length) {
    throw new Error(`Expecting 32 bytes, instead got ${buf.length}`);
  }
  return BigInteger.fromBuffer(buf);
};

export const getPrivateKeyInt = ({
  privateKey,
}: {
  privateKey: string;
}): BigInteger => {
  const versionKey = checkDecode({
    keyString: privateKey,
    keyType: 'sha256x2',
  });

  const privateKeyInt = fromBuffer(
    Buffer.isBuffer(versionKey) ? versionKey.subarray(1) : versionKey
  );

  return privateKeyInt;
};

export const getPublicKey = ({ privateKey }: { privateKey: string }) => {
  const privateKeyInt = getPrivateKeyInt({ privateKey });

  const Q = curve.G.multiply(privateKeyInt);

  const publicKey =
    FIO_CHAIN_NAME + checkEncode({ keyBuffer: Q.getEncoded(true) });

  return publicKey;
};
