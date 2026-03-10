import 'dotenv/config';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './typeorm.config';

const appDataSource = new DataSource(dataSourceOptions);

export default appDataSource;
