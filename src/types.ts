import BigInteger from 'bigi';

export type DecryptedContent = {
  payer_public_address?: string | undefined;
  payee_public_address: string;
  amount: string | number;
  chain_code: string;
  token_code: string;
  status?: string;
  obt_id?: string;
  memo: string | null;
  hash: string | null;
  offline_url: string | null;
};

export type Content = DecryptedContent | string;

/**
 * For more information about data params for specific actions, please refer to the FIO Action server documentation.
 * https://dev.fio.net/reference/fio-chain-actions-api
 */
export type DataParams = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type RequestParamsItem = {
  account: string;
  action: string;
  authActor?: string;
  contentType?: string;
  data: DataParams;
  dataActor?: string;
  id?: string;
  payeeFioPublicKey?: string;
  payerFioPublicKey?: string;
  timeoutOffset?: string;
};

export type RequestParamsTranasction = {
  /**
   * The apiUrl is a FIO Action server URL e.g. mainnet - https://fio.blockpane.com;
   *  Get the action server url from the FIO Action server list https://bpmonitor.fio.net/
   **/
  apiUrl: string;
  actionParams: Array<RequestParamsItem>;
  /**
   * The privateKey is a FIO Private key e.g. 5JTmqev7ZsryGGkN6z4FRzd4ELQJLNZuhtQhobVVsJsBHnXxFCw;
   **/
  privateKey: string;
};

export type BlockInfo = {
  action_mroot: string;
  block_extensions: string[];
  block_num: number;
  confirmed: number;
  header_extensions: string[];
  id: string;
  new_producers: string[] | null;
  previous: string;
  producer: string;
  producer_signature: string;
  ref_block_prefix: number;
  schedule_version: number;
  timestamp: string;
  transaction_mroot: string;
  transactions: string[];
};

export type ChainInfo = {
  block_cpu_limit: number;
  block_net_limit: number;
  chain_id: string;
  fork_db_head_block_id: string;
  fork_db_head_block_num: number;
  head_block_id: string;
  head_block_num: number;
  head_block_producer: string;
  head_block_time: string;
  last_irreversible_block_id: string;
  last_irreversible_block_num: number;
  server_version: string;
  server_version_string: string;
  virtual_block_cpu_limit: number;
  virtual_block_net_limit: number;
};

export type TransactionAction = {
  account: string;
  name: string;
  authorization: Array<{
    actor: string;
    permission: string;
  }>;
  data: DataParams | string;
};

export type Transaction = {
  expiration: string;
  ref_block_num: number;
  ref_block_prefix: number;
  actions: Array<TransactionAction>;
};

export type SignedTransaction = {
  signatures: string[];
  compression: number;
  packed_context_free_data: string;
  packed_trx: string;
};

export type SignatureObject = {
  r: BigInteger;
  s: BigInteger;
  i: number;
};

export type ECSignatureType = {
  r: BigInteger;
  s: BigInteger;
  toDER: () => Buffer;
};

export type SignNonceParams = {
  /**
   * The nonce to be signed. Could be generated like this: `crypto.createHmac('sha256', config.secret).update(string).digest('hex');
   **/
  nonce: string | Buffer;
  privateKey: string;
};
