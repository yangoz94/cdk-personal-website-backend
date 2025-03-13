import { DDBInstance } from "@ddb/ddb-instance.js";

/**
 * BaseService: Provides a shared DDBInstance for services.
 */
export abstract class BaseService {
  protected ddbInstance = DDBInstance;
  protected tableName: string;

  constructor() {
    const envTableName = process.env.DDB_TABLE_NAME;
    if (!envTableName) {
      throw new Error("DDB_TABLE_NAME environment variable is required");
    }
    this.tableName = envTableName;
  }
}
