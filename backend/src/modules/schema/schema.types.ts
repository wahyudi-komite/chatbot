export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchema {
  database: string;
  tables: SchemaTable[];
}

