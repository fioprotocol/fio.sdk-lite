import assert from 'assert';
import BigInteger from 'bigi';
import { Buffer } from 'buffer';
import ecurve, { Point } from 'ecurve';
import { encoding } from 'create-hash';

import { ecdsaSign, calcPubKeyRecoveryParam, verify } from './ecdsa';
import { sha256 } from './hash';
import { checkEncode, checkDecode } from './key_utils';
import { getPrivateKeyInt } from '../getKeys';
import { FIO_CHAIN_NAME } from '../../constants';

import { SignatureObject } from '../../types';

const curve = ecurve.getCurveByName('secp256k1');

const signature = (r: BigInteger, s: BigInteger, i: number): string => {
  assert.equal(r != null, true, 'Missing parameter');
  assert.equal(s != null, true, 'Missing parameter');
  assert.equal(i != null, true, 'Missing parameter');

  const toBuffer = () => {
    let buf;
    buf = Buffer.alloc(65);
    buf.writeUInt8(i, 0);
    r.toBuffer(32).copy(buf, 1);
    s.toBuffer(32).copy(buf, 33);
    return buf;
  };

  const signatureCache = `SIG_K1_${checkEncode({ keyBuffer: toBuffer(), keyType: 'K1' })}`;

  return signatureCache;
};

const signHash = ({
  dataSha256,
  encoding = 'hex',
  privateKey,
}: {
  dataSha256: string | Buffer;
  encoding?: encoding;
  privateKey: string;
}): string => {
  if (typeof dataSha256 === 'string') {
    dataSha256 = Buffer.from(dataSha256, encoding);
  }
  if (dataSha256.length !== 32 || !Buffer.isBuffer(dataSha256)) {
    throw new Error('dataSha256: 32-byte buffer required');
  }

  const privateKeyInt = getPrivateKeyInt({ privateKey });
  const publicKeyCurve = curve.G.multiply(privateKeyInt);

  let der, e: BigInteger, ecsignature, i, lenR, lenS, nonce;
  i = null;
  nonce = 0;
  e = BigInteger.fromBuffer(dataSha256);
  while (true) {
    ecsignature = ecdsaSign({
      curve,
      hash: dataSha256,
      d: privateKeyInt,
      nonce: nonce++,
    });

    der = ecsignature.toDER();
    lenR = der[3];

    if (typeof lenR !== 'undefined') {
      lenS = der[5 + lenR];
      if (lenR === 32 && lenS === 32) {
        i = calcPubKeyRecoveryParam({
          curve,
          e,
          signature: ecsignature,
          Q: publicKeyCurve,
        });
        i += 4; // compressed
        i += 27; // compact  //  24 or 27 :( forcing odd-y 2nd key candidate)
        break;
      }
    }

    if (nonce % 10 === 0) {
      console.log(`WARN: ${nonce} attempts to find a canonical signature`);
    }
  }

  return signature(ecsignature.r, ecsignature.s, i);
};

const signatureFromBuffer = (buf: Buffer): SignatureObject => {
  let i, r, s;
  assert(Buffer.isBuffer(buf), 'Buffer is required');
  assert.equal(buf.length, 65, 'Invalid signature length');
  i = buf.readUInt8(0);
  assert.equal(i - 27, (i - 27) & 7, 'Invalid signature parameter');
  r = BigInteger.fromBuffer(buf.subarray(1, 33));
  s = BigInteger.fromBuffer(buf.subarray(33));
  return { r, s, i };
};

const signatureFromHex = (hex: string): SignatureObject => {
  const hexBuffer = Buffer.from(hex, 'hex');

  return signatureFromBuffer(hexBuffer);
};

const signatureFromString = (signature: string): SignatureObject => {
  assert.equal(typeof signature, 'string', 'signature');
  const match = signature.match(/^SIG_([A-Za-z0-9]+)_([A-Za-z0-9]+)$/);
  assert(
    match != null && match.length === 3,
    'Expecting signature like: SIG_K1_base58signature..'
  );
  const [, keyType, keyString] = match;
  assert.equal(keyType, 'K1', 'K1 signature expected');
  return signatureFromBuffer(checkDecode({ keyString, keyType }));
};

const getSignatureObj = (
  o: string | Buffer | SignatureObject
): SignatureObject => {
  const signature = o
    ? typeof o === 'object' && !Buffer.isBuffer(o) && o.r && o.s && o.i
      ? o
      : typeof o === 'string' && o.length === 130
        ? signatureFromHex(o)
        : typeof o === 'string' && o.length !== 130
          ? signatureFromString(o)
          : Buffer.isBuffer(o)
            ? signatureFromBuffer(o)
            : null
    : null; /*null or undefined*/

  if (!signature) {
    throw new TypeError('signature should be a hex string or buffer');
  }

  return signature;
};

const verifyHash = ({
  dataSha256,
  encoding = 'hex',
  publicKey,
  signature,
}: {
  dataSha256: string | Buffer;
  encoding?: encoding;
  publicKey: string;
  signature: string;
}): boolean => {
  if (typeof dataSha256 === 'string') {
    dataSha256 = Buffer.from(dataSha256, encoding);
  }
  if (dataSha256.length !== 32 || !Buffer.isBuffer(dataSha256)) {
    throw new Error('dataSha256: 32-bytes required');
  }

  const prefixMatch = new RegExp('^' + FIO_CHAIN_NAME);

  let publicKeySerialized = publicKey;

  if (prefixMatch.test(publicKey)) {
    publicKeySerialized = publicKey.substring(FIO_CHAIN_NAME.length);
  }

  const publicKeyBuffer = checkDecode({ keyString: publicKeySerialized });

  const publicKeyInt: Point = ecurve.Point.decodeFrom(curve, publicKeyBuffer);

  const signatureObj = getSignatureObj(signature);

  return verify({
    curve,
    hash: dataSha256,
    signature: signatureObj,
    Q: publicKeyInt,
  });
};

export const signSignature = ({
  data,
  encoding = 'utf8',
  privateKey,
}: {
  data: Buffer | string;
  encoding?: BufferEncoding;
  privateKey: string;
}): string => {
  if (typeof data === 'string') {
    data = Buffer.from(data, encoding);
  }
  assert(Buffer.isBuffer(data), 'data is a required String or Buffer');
  const dataSha256 = sha256(data);
  data = Buffer.isBuffer(dataSha256)
    ? dataSha256
    : Buffer.from(dataSha256, encoding);
  return signHash({ dataSha256: data, privateKey });
};

export const verifySignature = ({
  signature,
  data,
  encoding = 'utf8',
  publicKey,
}: {
  data: Buffer | string;
  encoding?: BufferEncoding;
  publicKey: string;
  signature: string;
}): boolean => {
  if (typeof data === 'string') {
    data = Buffer.from(data, encoding);
  }
  assert(Buffer.isBuffer(data), 'data is a required String or Buffer');

  const dataSha256 = sha256(data);
  data = Buffer.isBuffer(dataSha256)
    ? dataSha256
    : Buffer.from(dataSha256, encoding);

  return verifyHash({ dataSha256: data, publicKey, signature });
};
