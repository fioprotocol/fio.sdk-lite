import assert from 'assert';
import BigInteger from 'bigi';
import { Curve, Point } from 'ecurve';

import { ECSignature } from './ecsignature';
import { enforceType } from './enforce_types';
import { HmacSHA256, sha256 } from './hash';
import { ECSignatureType, SignatureObject } from '../../types';

// https://tools.ietf.org/html/rfc6979#section-3.2
const deterministicGenerateK = ({
  curve,
  hash,
  d,
  checkSig,
  nonce,
}: {
  curve: Curve;
  hash: Buffer;
  d: BigInteger;
  checkSig: (k: BigInteger) => boolean;
  nonce: number;
}) => {
  enforceType('Buffer', hash);
  enforceType(BigInteger, d);

  if (nonce) {
    const concatHash = sha256(Buffer.concat([hash, Buffer.alloc(nonce)]));
    hash = Buffer.isBuffer(concatHash) ? concatHash : Buffer.from(concatHash);
  }

  // sanity check
  assert.equal(hash.length, 32, 'Hash must be 256 bit');

  let x = d.toBuffer(32);
  let k = Buffer.alloc(32);
  let v = Buffer.alloc(32);

  // Step B
  v.fill(1);

  // Step C
  k.fill(0);

  // Step D
  k = HmacSHA256(Buffer.concat([v, Buffer.from([0]), x, hash]), k);

  // Step E
  v = HmacSHA256(v, k);

  // Step F
  k = HmacSHA256(Buffer.concat([v, Buffer.from([1]), x, hash]), k);

  // Step G
  v = HmacSHA256(v, k);

  // Step H1/H2a, ignored as tlen === qlen (256 bit)
  // Step H2b
  v = HmacSHA256(v, k);

  let T = BigInteger.fromBuffer(v);

  // Step H3, repeat until T is within the interval [1, n - 1]
  while (
    (T.signum() as unknown as number) <= 0 ||
    T.compareTo(curve.n) >= 0 ||
    !checkSig(T)
  ) {
    k = HmacSHA256(Buffer.concat([v, Buffer.from([0])]), k);
    v = HmacSHA256(v, k);

    // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
    // Step H2b again
    v = HmacSHA256(v, k);

    T = BigInteger.fromBuffer(v);
  }

  return T;
};

export const ecdsaSign = ({
  curve,
  hash,
  d,
  nonce,
}: {
  curve: Curve;
  hash: Buffer;
  d: BigInteger;
  nonce: number;
}): ECSignatureType => {
  const e: BigInteger = BigInteger.fromBuffer(hash);
  const { n, G } = curve;

  let r: BigInteger = BigInteger.ZERO,
    s: BigInteger = BigInteger.ZERO;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const k: BigInteger = deterministicGenerateK({
    curve,
    hash,
    d,
    checkSig: function (k: BigInteger) {
      // find canonically valid signature
      const Q = G.multiply(k);

      if (curve.isInfinity(Q)) {
        return false;
      }

      r = Q.affineX.mod(n);
      if ((r.signum() as unknown as number) === 0) {
        return false;
      }

      s = k
        .modInverse(n)
        .multiply(e.add(d.multiply(r)))
        .mod(n);
      if ((s.signum() as unknown as number) === 0) {
        return false;
      }

      return true;
    },
    nonce,
  });

  const N_OVER_TWO = n.shiftRight(1);

  // enforce low S values, see bip62: 'low s values in signatures'
  if (s.compareTo(N_OVER_TWO) > 0) {
    s = n.subtract(s);
  }

  return ECSignature(r, s);
};

/**
 * Recover a public key from a signature.
 *
 * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
 * Key Recovery Operation".
 *
 * http://www.secg.org/download/aid-780/sec1-v2.pdf
 */
const recoverPubKey = ({
  curve,
  e,
  signature,
  i,
}: {
  curve: Curve;
  e: BigInteger;
  signature: ECSignatureType;
  i: number;
}) => {
  assert.strictEqual(i & 3, i, 'Recovery param is more than two bits');
  const { n, G } = curve;
  const { r, s } = signature;

  assert(
    (r.signum() as unknown as number) > 0 && r.compareTo(n) < 0,
    'Invalid r value'
  );
  assert(
    (s.signum() as unknown as number) > 0 && s.compareTo(n) < 0,
    'Invalid s value'
  );

  // A set LSB signifies that the y-coordinate is odd
  const isYOdd: boolean = !!(i & 1);

  // The more significant bit specifies whether we should use the
  // first or second candidate key.
  const isSecondKey = i >> 1;

  // 1.1 Let x = r + jn
  const x = isSecondKey ? r.add(n) : r;
  const R = curve.pointFromX(isYOdd, x as unknown as Point);

  // 1.4 Check that nR is at infinity
  const nR = R.multiply(n);
  assert(curve.isInfinity(nR), 'nR is not a valid curve point');

  // Compute -e from e
  const eNeg = e.negate().mod(n);

  // 1.6.1 Compute Q = r^-1 (sR -  eG)
  //               Q = r^-1 (sR + -eG)
  const rInv = r.modInverse(n);

  const Q = R.multiplyTwo(s, G, eNeg).multiply(rInv);
  curve.validate(Q);

  return Q;
};

/**
 * Calculate pubkey extraction parameter.
 *
 * When extracting a pubkey from a signature, we have to
 * distinguish four different cases. Rather than putting this
 * burden on the verifier, Bitcoin includes a 2-bit value with the
 * signature.
 *
 * This function simply tries all four cases and returns the value
 * that resulted in a successful pubkey recovery.
 */
export const calcPubKeyRecoveryParam = ({
  curve,
  e,
  signature,
  Q,
}: {
  curve: Curve;
  e: BigInteger;
  signature: ECSignatureType;
  Q: Point;
}) => {
  for (let i = 0; i < 4; i++) {
    const Qprime = recoverPubKey({ curve, e, signature, i });

    // 1.6.2 Verify Q
    if (Qprime.equals(Q)) {
      return i;
    }
  }

  throw new Error('Unable to find valid recovery factor');
};

const verifyRaw = ({
  curve,
  e,
  signature,
  Q,
}: {
  curve: Curve;
  e: BigInteger;
  signature: SignatureObject;
  Q: Point;
}) => {
  const n = curve.n;
  const G = curve.G;

  const r = signature.r;
  const s = signature.s;

  // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
  if ((r.signum() as unknown as number) <= 0 || r.compareTo(n) >= 0)
    return false;
  if ((s.signum() as unknown as number) <= 0 || s.compareTo(n) >= 0)
    return false;

  // c = s^-1 mod n
  const c = s.modInverse(n);

  // 1.4.4 Compute u1 = es^−1 mod n
  //               u2 = rs^−1 mod n
  const u1 = e.multiply(c).mod(n);
  const u2 = r.multiply(c).mod(n);

  // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
  const R = G.multiplyTwo(u1, Q, u2);

  // 1.4.5 (cont.) Enforce R is not at infinity
  if (curve.isInfinity(R)) return false;

  // 1.4.6 Convert the field element R.x to an integer
  const xR = R.affineX;

  // 1.4.7 Set v = xR mod n
  const v = xR.mod(n);

  // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
  return v.equals(r);
};

export const verify = ({
  curve,
  hash,
  signature,
  Q,
}: {
  curve: Curve;
  hash: Buffer;
  signature: SignatureObject;
  Q: Point;
}) => {
  // 1.4.2 H = Hash(M), already done by the user
  // 1.4.3 e = H
  const e = BigInteger.fromBuffer(hash);
  return verifyRaw({ curve, e, signature, Q });
};
