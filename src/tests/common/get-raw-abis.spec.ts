import { getRawAbi } from '../../utils/chain/chain-get-raw-abis';
import { RAW_ABIS_ACCOUNT_NAMES } from '../constants';
import { sleep } from '../../utils/general';

export const GetRawAbis = ({ apiUrl }: { apiUrl: string }) =>
  describe('Get raw abis', () => {
    // More specific test for each account - better error isolation but more generic implementation
    describe('Individual account ABI tests', () => {
      // Define a reusable test function
      const testAccountAbi = async (
        accountKey: string,
        accountName: string
      ) => {
        it(`should retrieve ${accountKey} (${accountName}) ABI correctly`, async () => {
          const abiResult = await getRawAbi({
            account: accountName,
            apiUrl: apiUrl,
          });

          expect(abiResult).toBeDefined();
          expect(abiResult.account_name).toBe(accountName);
          expect(abiResult.abi).toBeDefined();
        });
      };

      // Run the test for each account with a delay between calls
      let index = 0;
      const accountEntries = Object.entries(RAW_ABIS_ACCOUNT_NAMES);

      // Using beforeEach to add delay between test executions
      beforeEach(async () => {
        // Skip delay for the first test
        if (index > 0) {
          // Add 0.5 second delay between API calls
          await sleep(500);
        }
        index++;
      });

      accountEntries.forEach(([key, accountName]) => {
        testAccountAbi(key, accountName);
      });
    });
  });
