import path from 'node:path';
import { DATA_ROOT, RAW_DIR } from '../paths';
import { createConnectorBasics } from './connectorBasics';
import { createGoogleConnector } from './googleConnector';
import { createExternalConnectors } from './externalConnectors';

export const connectors = createConnectorBasics(path.join(DATA_ROOT, 'data', 'connectors'));
export const googleConnector = createGoogleConnector(path.join(DATA_ROOT, 'data', 'connectors'));
export const externalConnectors = createExternalConnectors({ directory: path.join(DATA_ROOT, 'data', 'connectors'), rawDir: RAW_DIR, google: googleConnector });
