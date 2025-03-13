import { DocumentClient, TransactWriteItemList } from "aws-sdk/clients/dynamodb.js";

/**
 * DynamoDB Transaction Manager
 * Handles creating and committing transactions.
 */
export class DDBTransactionManager {
  private db: DocumentClient;
  private transactionItems: TransactWriteItemList = [];

  constructor(db: DocumentClient) {
    this.db = db;
  }

  /**
   * Adds a new operation to the transaction.
   */
  public addOperation(operation: DocumentClient.TransactWriteItem): void {
    this.transactionItems.push(operation);
  }

  /**
   * Commits all operations as a single transaction.
   */
  public async commit(): Promise<void> {
    if (this.transactionItems.length === 0) {
      throw new Error("Transaction has no operations to commit");
    }

    await this.db
      .transactWrite({
        TransactItems: this.transactionItems,
      })
      .promise();

    // Clear the transaction after committing
    this.transactionItems = [];
  }

  /**
   * Checks if this transaction has pending operations.
   */
  public hasOperations(): boolean {
    return this.transactionItems.length > 0;
  }
}
