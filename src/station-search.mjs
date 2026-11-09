const normalized = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ja');

export function searchStations(items, query, limit = 30) {
  const needle = normalized(query).trim();
  const words = needle.split(/\s+/).filter(Boolean);
  const score = item => {
    const name = normalized(item.auxiliaryData.stationName);
    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (name.includes(needle)) return 2;
    return 3;
  };
  return items.filter(item => words.every(word => normalized(item.label + ' ' + (item.auxiliaryData.municipality || '')).includes(word)))
    .sort((a, b) => score(a) - score(b) || a.label.localeCompare(b.label, 'ja'))
    .slice(0, limit);
}
