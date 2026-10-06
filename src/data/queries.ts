// Pure OData filter builders. Values are always quote-escaped.

export function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

export function orEquals(column: string, values: readonly string[]): string {
  return values
    .map((value) => `${column} eq '${escapeODataString(value)}'`)
    .join(' or ');
}

export function orEqualsGuid(column: string, ids: readonly string[]): string {
  return ids.map((id) => `${column} eq ${id}`).join(' or ');
}

export function userSearchFilter(text: string, excludeInactive: boolean, nonInteractiveMode: number): string {
  const t = escapeODataString(text);
  const match = `(startswith(firstname,'${t}') or startswith(lastname,'${t}') or contains(fullname,'${t}'))`;
  if (!excludeInactive) return match;
  return `${match} and isdisabled eq false and accessmode ne ${nonInteractiveMode}`;
}

export function joinAnd(parts: readonly (string | null)[]): string {
  return parts
    .filter((part): part is string => part !== null && part !== '')
    .map((part) => `(${part})`)
    .join(' and ');
}
