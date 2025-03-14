/* eslint-disable @typescript-eslint/no-explicit-any */
export const pushTransactionResult = async ({
  apiUrl,
  signedTransactionsResult,
}: {
  apiUrl: string;
  signedTransactionsResult: any;
}) => {
  const pushResult = await fetch(apiUrl + '/v1/chain/push_transaction', {
    body: JSON.stringify(signedTransactionsResult),
    method: 'POST',
  });

  if ([400, 403, 500].includes(pushResult.status)) {
    const jsonResult = await pushResult.json();
    const errorMessage = jsonResult.message || 'Something went wrong';

    if (jsonResult.fields) {
      const fieldErrors = jsonResult.fields.map((field: any) => ({
        name: field.name,
        value: field.value,
        error: field.error,
      }));
      throw new Error(`${errorMessage}: ${JSON.stringify(fieldErrors)}`);
    } else if (jsonResult.error && jsonResult.error.what) {
      throw new Error(jsonResult.error.what);
    } else {
      throw new Error(errorMessage);
    }
  }

  return await pushResult.json();
};
