import { Transaction, TransactionAction } from '../../types';
import { getRawAbi } from '../chain/chain-get-raw-abis';
import {
  SerialBuffer,
  createInitialTypes,
  getTypesFromAbi,
} from '../chain/chain-serialize';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const serializeTransaction = async ({
  apiUrl,
  serializedAction,
  transaction,
}: {
  apiUrl: string;
  serializedAction: TransactionAction | null;
  transaction: Transaction;
}) => {
  const abiMsig = await getRawAbi({
    account: 'eosio.msig',
    apiUrl,
  });

  const typesTransaction = getTypesFromAbi(createInitialTypes(), abiMsig.abi);

  // Get the transaction action type
  const txnAction = typesTransaction.get('transaction');

  const rawTransaction = {
    ...transaction,
    max_net_usage_words: 0,
    max_cpu_usage_ms: 0,
    delay_sec: 0,
    context_free_actions: [],
    actions: [serializedAction], // Actions have to be an array
    transaction_extensions: [],
  };

  // Serialize the transaction
  const buffer = new SerialBuffer({ textEncoder, textDecoder });

  if (txnAction) {
    txnAction.serialize(buffer, rawTransaction);
  }

  const serializedTransaction = buffer.asUint8Array();

  return serializedTransaction;
};
