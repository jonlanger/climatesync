export { CLIMATE_VOCABULARY, QUESTION_PATTERNS } from "@/lib/query/vocabulary";
export {
  parseClimateQuery,
  type MatchedCity,
  type MatchedTerm,
  type ParsedQuery,
  type QueryIntentType,
} from "@/lib/query/parse-query";
export {
  resolveClimateQuery,
  type QueryMatch,
  type QueryResultMode,
  type ResolvedClimateQuery,
} from "@/lib/query/resolve-query";
