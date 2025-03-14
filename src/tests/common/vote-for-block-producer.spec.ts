import { signTransaction } from '../../index';
import { BLOCK_PRODUCERS_LIST, RAW_ABIS_ACCOUNT_NAMES } from '../constants';
import { TestWallet } from '../types';
import { pushTransactionResult } from '../utils';

export const VoteForBlockProducer = ({
  apiUrl,
  wallet,
}: {
  apiUrl: string;
  wallet: TestWallet;
}) =>
  describe('Vote for block producer', () => {
    it('should vote for block producer', async () => {
      const transactionActionParams = {
        apiUrl,
        actionParams: [
          {
            action: 'voteproducer',
            account: RAW_ABIS_ACCOUNT_NAMES.eosio,
            data: {
              producers: BLOCK_PRODUCERS_LIST,
              fio_address: wallet.fioHandle,
              max_fee: 1000000000000,
            },
          },
        ],
        privateKey: wallet.privateKey,
      };

      const result = await signTransaction(transactionActionParams);

      const resultObj = JSON.parse(result);

      if (resultObj.successed.length > 0) {
        const txResult = await pushTransactionResult({
          apiUrl,
          signedTransactionsResult: resultObj.successed[0],
        });

        expect(txResult.transaction_id).toBeDefined();
        expect(txResult.processed).toBeDefined();
      } else {
        throw new Error('No transaction was signed');
      }
    });
  });
