function typhoonName(entry, title = {}) {
  const number = String(title.typhoonNumber || entry.typhoonNumber || "");
  const name = title.name?.jp;
  const label = /^\d{4}$/.test(number) ? `台風第${Number(number.slice(-2))}号` : "熱帯低気圧";
  return name ? `${label}（${name}）` : label;
}

function normalizeTyphoon(entry, data) {
  if (!Array.isArray(data)) throw new Error("台風情報の形式を確認できません。");
  const title = data.find(part => part.part === "title");
  const current = data.find(part => part.advancedHours === 0);
  if (!title || !current || !current.validtime?.JST) throw new Error("台風の実況が見つかりません。");
  return { id: entry.tropicalCyclone, title: typhoonName(entry, title), issuedAt: title.issue?.JST || entry.issue, current, forecasts: data.filter(part => part.advancedHours > 0).slice(0, 4), available: true };
}

async function fetchTyphoons() {
  const response = await fetchWithTimeout(CONFIG.typhoonListUrl, { cache: "no-store" });
  const entries = await response.json();
  if (!Array.isArray(entries) || entries.length > 30 || entries.some(entry => !/^TC\d{4,8}$/.test(entry.tropicalCyclone || ""))) throw new Error("台風一覧の形式を確認できません。");
  const results = await Promise.allSettled(entries.map(async entry => {
    const details = await fetchWithTimeout(`${CONFIG.typhoonDataBaseUrl}/${entry.tropicalCyclone}/specifications.json`, { cache: "no-store" });
    return normalizeTyphoon(entry, await details.json());
  }));
  return { fetchedAt: new Date().toISOString(), items: results.map((result, i) => result.status === "fulfilled" ? result.value : { id: entries[i].tropicalCyclone, title: typhoonName(entries[i]), issuedAt: entries[i].issue, available: false }) };
}
