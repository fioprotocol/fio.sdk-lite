import {
  DEFAULT_TIMEOUT_OFFSET,
  FIO_ENVIRONMENT_CHAIN_NAMES,
  FIO_TRANSACTION_ACTION_NAMES,
} from '../../constants';
import type { RequestParamsTranasction, SignedTransaction } from '../../types';
import { getChainInfo } from '../chain/chain-get-info';
import { signTx } from '../chain/chain-jssig';
import { arrayToHex } from '../chain/chain-numeric';
import { getPublicKey } from '../getKeys';
import { serializeAction } from '../serialize/serialize-action';
import { serializeTransaction } from '../serialize/serialize-transaction';
import { createTransaction } from './create-transaction';
import { encryptContent } from './cypher-content';

export const signTransaction = async (
  params: RequestParamsTranasction
): Promise<string> => {
  const { actionParams, apiUrl, privateKey } = params;

  const transactions: {
    successed: Array<SignedTransaction>;
    failed: Array<{ id: string; error: Error }>;
  } = {
    successed: [],
    failed: [],
  };

  const chainInfo = await getChainInfo({ apiUrl });

  const chainId = chainInfo.info.chain_id;
  const chainName = FIO_ENVIRONMENT_CHAIN_NAMES[chainId];

  if (!chainId || !chainName) {
    throw new Error('Cannot identify FIO chain');
  }

  for (const actionParamItem of actionParams) {
    try {
      const {
        action,
        authActor,
        account,
        contentType,
        data,
        dataActor,
        id,
        payeeFioPublicKey,
        payerFioPublicKey,
        timeoutOffset = DEFAULT_TIMEOUT_OFFSET,
      } = actionParamItem;

      const fioPubKey = getPublicKey({ privateKey });

      const transaction = createTransaction({
        account,
        action,
        authActor,
        chainInfo,
        data,
        dataActor,
        fioPubKey,
        timeoutOffset,
      });

      if (
        (action === FIO_TRANSACTION_ACTION_NAMES.newfundsreq ||
          action === FIO_TRANSACTION_ACTION_NAMES.recordobt) &&
        contentType
      ) {
        const encryptionPublicKey =
          payerFioPublicKey ??
          payeeFioPublicKey ??
          (typeof data?.content === 'object' &&
            data?.content?.payee_public_address);

        if (encryptionPublicKey) {
          const cypheredContent = encryptContent({
            content: data.content,
            fioContentType: contentType,
            encryptionPublicKey,
            privateKey,
          });

          if (
            transaction.actions[0] &&
            typeof transaction.actions[0].data === 'object'
          ) {
            transaction.actions[0].data.content = cypheredContent;
          }
        }
      }

      const serializedAction = await serializeAction({
        account,
        action,
        apiUrl,
        transaction,
      });

      const serializedTransaction = await serializeTransaction({
        apiUrl,
        serializedAction,
        transaction,
      });

      const signedTxnSignatures = signTx({
        chainId,
        privateKey,
        serializedTransaction,
      });

      const signedTransaction = {
        id,
        signatures: signedTxnSignatures,
        compression: 0,
        packed_context_free_data: arrayToHex(new Uint8Array(0)),
        packed_trx: arrayToHex(serializedTransaction),
      };

      transactions.successed.push(signedTransaction);
    } catch (error) {
      if (error instanceof Error) {
        const errorToPush: {
          error: {
            message: string;
            name: string;
            stack?: string;
          };
          id: string;
        } = {
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          id: '0',
        };

        if (actionParamItem?.id) {
          errorToPush.id = actionParamItem?.id || '0';
        }
        transactions.failed.push(errorToPush);
      } else {
        // Handle non-Error objects
        transactions.failed.push({
          error: {
            message: String(error),
            name: 'Unknown Error',
          },
          id: actionParamItem?.id || '0',
        });
      }
    }
  }

  return JSON.stringify(transactions);
};
