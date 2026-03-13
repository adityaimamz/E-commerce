declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
  }

  interface TransactionStatusResponse {
    transaction_status?: string;
    fraud_status?: string;
  }

  interface SnapTransaction {
    status(transactionId: string): Promise<TransactionStatusResponse>;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<TransactionResponse>;
    transaction: SnapTransaction;
  }

  export default { Snap };
}
