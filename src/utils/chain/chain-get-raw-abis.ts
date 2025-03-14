import { GetAbiResult } from './chain-rpc-interfaces';

export const getRawAbi = async ({
  account,
  apiUrl,
}: {
  account: string;
  apiUrl: string;
}): Promise<GetAbiResult> => {
  return await (
    await fetch(`${apiUrl}/v1/chain/get_abi`, {
      body: `{"account_name": "${account}"}`,
      method: 'POST',
    })
  ).json();
};
