import { Transaction, TransactionAction } from '../../types';
import { getRawAbi } from '../chain/chain-get-raw-abis';
import {
  SerialBuffer,
  arrayToHex,
  createInitialTypes,
  getTypesFromAbi,
} from '../chain/chain-serialize';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const serializeAction = async ({
  account,
  action,
  apiUrl,
  transaction,
}: {
  account: string;
  action: string;
  apiUrl: string;
  transaction: Transaction;
}): Promise<TransactionAction | null> => {
  const accountAbi = await getRawAbi({
    account,
    apiUrl,
  });

  // Get a Map of all the types from account
  const typesFioAddress = getTypesFromAbi(createInitialTypes(), accountAbi.abi);

  // Get the addaddress action type
  const fioAction = typesFioAddress.get(action);

  const buffer = new SerialBuffer({ textEncoder, textDecoder });

  if (fioAction) {
    fioAction.serialize(buffer, transaction.actions[0]?.data);
  }

  const serializedData = arrayToHex(buffer.asUint8Array());

  if (!transaction.actions[0]) {
    return null;
  }

  const serializedAction = transaction.actions[0];

  if (serializedAction) {
    serializedAction.data = serializedData;
  }

  return serializedAction;
};
