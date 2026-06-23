import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Standalone DataSource used by the TypeORM CLI for generating and running
 * migrations. The Nest application builds its own connection via
 * TypeOrmModule.forRootAsync (see app.module.ts) but reuses these same options.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'marketplace',
  // Glob covers both src (.ts via ts-node) and dist (.js at runtime).
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
