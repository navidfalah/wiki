/**
 * GENERATED LIST of namespace files -- every `en/<ns>.ts` is merged into one
 * dictionary per language. The German files are typed against the English ones
 * (Record<keyof typeof en, string>), so a missing or extra key is a compile
 * error, not a runtime surprise.
 */
import type { Dict, Lang } from './core';
import { analytics as en_analytics } from './en/analytics';
import { analytics as de_analytics } from './de/analytics';
import { chat as en_chat } from './en/chat';
import { chat as de_chat } from './de/chat';
import { common as en_common } from './en/common';
import { common as de_common } from './de/common';
import { company as en_company } from './en/company';
import { company as de_company } from './de/company';
import { connectorsCallback as en_connectorsCallback } from './en/connectors-callback';
import { connectorsCallback as de_connectorsCallback } from './de/connectors-callback';
import { dashboard as en_dashboard } from './en/dashboard';
import { dashboard as de_dashboard } from './de/dashboard';
import { entities as en_entities } from './en/entities';
import { entities as de_entities } from './de/entities';
import { graph as en_graph } from './en/graph';
import { graph as de_graph } from './de/graph';
import { login as en_login } from './en/login';
import { login as de_login } from './de/login';
import { logs as en_logs } from './en/logs';
import { logs as de_logs } from './de/logs';
import { pipelineArchitecture as en_pipelineArchitecture } from './en/pipeline-architecture';
import { pipelineArchitecture as de_pipelineArchitecture } from './de/pipeline-architecture';
import { pipelines as en_pipelines } from './en/pipelines';
import { pipelines as de_pipelines } from './de/pipelines';
import { ragArchitecture as en_ragArchitecture } from './en/rag-architecture';
import { ragArchitecture as de_ragArchitecture } from './de/rag-architecture';
import { resources as en_resources } from './en/resources';
import { resources as de_resources } from './de/resources';
import { reviewQueue as en_reviewQueue } from './en/review-queue';
import { reviewQueue as de_reviewQueue } from './de/review-queue';
import { settings as en_settings } from './en/settings';
import { settings as de_settings } from './de/settings';
import { usage as en_usage } from './en/usage';
import { usage as de_usage } from './de/usage';
import { users as en_users } from './en/users';
import { users as de_users } from './de/users';
import { wiki as en_wiki } from './en/wiki';
import { wiki as de_wiki } from './de/wiki';

export const dictionaries: Record<Lang, Dict> = {
  en: { ...en_analytics, ...en_chat, ...en_common, ...en_company, ...en_connectorsCallback, ...en_dashboard, ...en_entities, ...en_graph, ...en_login, ...en_logs, ...en_pipelineArchitecture, ...en_pipelines, ...en_ragArchitecture, ...en_resources, ...en_reviewQueue, ...en_settings, ...en_usage, ...en_users, ...en_wiki },
  de: { ...de_analytics, ...de_chat, ...de_common, ...de_company, ...de_connectorsCallback, ...de_dashboard, ...de_entities, ...de_graph, ...de_login, ...de_logs, ...de_pipelineArchitecture, ...de_pipelines, ...de_ragArchitecture, ...de_resources, ...de_reviewQueue, ...de_settings, ...de_usage, ...de_users, ...de_wiki },
};

/** Keys of one namespace group (e.g. `common.`, `dashboard.`) -- what the server embeds for browser scripts. */
export function pickNamespaces(dict: Dict, prefixes: string[]): Dict {
  const out: Dict = {};
  for (const key of Object.keys(dict)) {
    if (prefixes.some((p) => key.startsWith(p))) out[key] = dict[key];
  }
  return out;
}
