import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { Button } from '@astryxdesign/core/Button';
import { Typeahead } from '@astryxdesign/core/Typeahead';
import { Switch } from '@astryxdesign/core/Switch';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { useToast, ToastViewport } from '@astryxdesign/core/Toast';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import japaneseMessages from '@astryxdesign/core/locales/ja-JP.generated.js';
import { searchStations } from './station-search.mjs';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

const action = (type, payload = {}) => new Promise(resolve => document.dispatchEvent(new CustomEvent('eorzea:action', { detail: { type, payload, respond: resolve } })));
const place = station => [station?.prefecture, station?.stationName].filter(Boolean).join('・');
const reading = (value, unit, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) + unit : '観測なし';
const jobs = ['job-paladin.png', 'job-darkknight.png', 'job-blackmage.png', 'job-04.png'];

function HeroActions({ state }) {
  return <div className="eorzea-ui action-row">
    <Button label="現在地の天気" variant="primary" isDisabled={!state.current || state.busy} onClick={() => action('locate')} />
    <Button label="更新" isLoading={state.busy} onClick={() => action('refresh')} />
    <Button label="地点を選ぶ" variant="ghost" href="#control-center" />
  </div>;
}

function ControlCenter({ state }) {
  const [view, setView] = useState('search');
  const toast = useToast();
  const items = useMemo(() => state.stations.map(station => ({ id: station.id, label: place(station), auxiliaryData: station })), [state.stations]);
  const source = useMemo(() => ({
    search: query => searchStations(items, query),
    bootstrap: () => {
      const ids = [...new Set([state.current?.id, ...state.favoriteIds, '14163', '44132', '62078', '82182', '91197'])];
      return ids.map(id => items.find(item => item.id === id)).filter(Boolean);
    }
  }), [items, state.current?.id, state.favoriteIds]);
  const selected = items.find(item => item.id === state.current?.id) || null;
  const isSaved = state.favoriteIds.includes(state.current?.id);
  const notify = (result, undo) => {
    toast({ body: result.message || '設定を変更しました。', type: result.ok ? 'info' : 'error', isAutoHide: result.ok && !undo, uniqueID: 'weather-action', renderContent: ({ body, dismiss }) => <div className="weather-toast"><p>{body}</p><div>{undo && <Button label="元に戻す" size="sm" onClick={async () => { const restored = await action('favorite-restore', { ids: undo }); dismiss(); notify(restored); }} />}<Button label="閉じる" variant="ghost" size="sm" onClick={dismiss} /></div></div> });
  };
  const save = async () => {
    const result = await action('favorite-add', { id: state.current?.id });
    notify(result);
    if (result.ok) setView('saved');
  };
  const setPreferences = async patch => {
    const result = await action('preferences', { ...state.preferences, ...patch });
    if (!result.ok) notify(result);
  };
  return <div className="eorzea-ui control-board">
    <header className="control-heading"><div><h2>旅の観測拠点</h2><p>街を探す。仲間に加える。今日の空気を比べる。</p></div><img src="assets/fankit/job-05.png" alt="" /></header>
    <div className="control-current"><div><span>表示している地点</span><strong>{state.current ? place(state.current) : '観測値を読み込み中'}</strong></div><b>{reading(state.current?.temperature, '℃')}</b></div>
    {state.error ? <Banner status={state.current ? 'warning' : 'error'} title={state.current ? '表示中のデータをご確認ください' : '観測データを取得できませんでした'} description={state.error} endContent={<Button label="再試行" size="sm" isLoading={state.busy} onClick={() => action('refresh')} />} /> : state.isCached && <Banner status="warning" title="前回取得した観測値を表示中" description="観測時刻を確認し、更新をお試しください。" />}
    <SegmentedControl label="観測拠点の表示" value={view} onChange={setView} layout="fill" size="lg">
      <SegmentedControlItem value="search" label="地点検索" />
      <SegmentedControlItem value="saved" label={'保存 ' + state.favoriteIds.length + '/4'} />
      <SegmentedControlItem value="settings" label="表示設定" />
    </SegmentedControl>
    <div className="control-content">
      {view === 'search' && <section aria-label="観測地点検索" className="search-view">
        <Typeahead label="地名から観測地点を選ぶ" placeholder="例：札幌、富士山、沖縄" description="入力すると候補が出ます。矢印キーとEnterでも選べます。" searchSource={source} value={selected} onChange={item => item && action('select', { id: item.id })} hasEntriesOnFocus hasClear={false} maxMenuItems={7} debounceMs={0} size="lg" width="100%" isDisabled={state.busy || !items.length} disabledMessage="観測データの読み込みが終わると検索できます。" emptySearchText="一致する地点がありません。県名や短い地名でお試しください。" renderItem={item => <div className="station-result"><div><strong>{item.auxiliaryData.stationName}</strong><small>{item.auxiliaryData.prefecture || 'その他の観測地点'}</small></div><b>{reading(item.auxiliaryData.temperature, '℃')}</b></div>} />
        <div className="save-action"><Button label={isSaved ? '保存済みの地点' : state.favoriteIds.length >= 4 ? '保存枠は4地点まで' : 'この地点を保存'} isDisabled={!state.current || isSaved || state.favoriteIds.length >= 4} onClick={save} /><span>地点の情報は、この端末に保存されます。</span></div>
        <div className="search-guidance"><img src="assets/fankit/job-06.png" alt="" /><p>自宅や旅先を保存しておくと、<br />離れた街の暑さ・寒さもすぐに比較できます。</p></div>
      </section>}
      {view === 'saved' && <section aria-label="保存した観測地点">
        {!state.favorites.length ? <div className="saved-empty"><img src="assets/fankit/job-paladin.png" alt="" /><h3>最初の街を、旅の仲間に。</h3><p>表示中の地点を保存すると、ここに観測値が並びます。</p><Button label="表示中の地点を保存" onClick={save} isDisabled={!state.current} /></div> : <div className="astryx-favorites">{state.favorites.map((station, i) => {
          const delta = station.temperature - state.current?.temperature;
          const comparable = Number.isFinite(station.temperature) && Number.isFinite(state.current?.temperature);
          return <article className="astryx-favorite" key={station.id}>
            {station.scene?.wallpaper && <img className="saved-art" src={station.scene.wallpaper} alt="" loading="lazy" />}
            <div className="saved-title"><img src={'assets/fankit/' + jobs[i]} alt="" /><div><h3>{place(station)}</h3>{station.id === state.current?.id && <Badge label="表示中" variant="teal" />}</div></div>
            <p className="saved-temperature">{reading(station.temperature, '℃')}</p>
            <p className="saved-scene">{station.scene?.title || '現在の気温は観測なし'}</p>
            <p className="saved-delta">{comparable && station.id !== state.current?.id ? '表示中の地点より ' + (delta > 0 ? '+' : '') + delta.toFixed(1) + '℃' : '同じ観測時刻のデータ'}</p>
            <dl><div><dt>湿度</dt><dd>{reading(station.humidity, '％', 0)}</dd></div><div><dt>風速</dt><dd>{reading(station.windSpeed, 'm/s')}</dd></div></dl>
            <div className="saved-actions"><Button label="この天気を見る" size="sm" isDisabled={!Number.isFinite(station.temperature) || state.busy} href={station.id === state.current?.id ? '#weather' : undefined} onClick={async () => { const result = await action('select', { id: station.id }); if (result.ok) document.getElementById('weather').scrollIntoView({ behavior: state.motion ? 'smooth' : 'auto' }); }} /><Button label="保存を解除" size="sm" variant="ghost" onClick={async () => { const result = await action('favorite-remove', { id: station.id }); notify(result, result.ok ? result.previous : undefined); }} /></div>
          </article>;
        })}</div>}
      </section>}
      {view === 'settings' && <section className="settings-view" aria-label="天気帳の表示設定">
        <div className="setting-row"><Switch label="FF14の装飾アニメーション" value={state.motion} onChange={enabled => action('motion', { enabled })} isDisabled={state.reducedMotion} disabledMessage="端末の動きを減らす設定に合わせて停止しています。" description="背景・光の粒子・ドットキャラの動きを切り替えます。" width="100%" /></div>
        <div className="setting-row"><Switch label="10分ごとに自動更新" value={state.preferences.autoRefresh} onChange={autoRefresh => setPreferences({ autoRefresh })} description="このページを表示している間、観測値と台風情報を更新します。位置情報の再取得は行いません。" width="100%" /></div>
        <div className="setting-row"><h3>文字の読みやすさ</h3><SegmentedControl label="文字サイズ" value={state.preferences.largeText ? 'large' : 'standard'} onChange={value => setPreferences({ largeText: value === 'large' })} layout="fill"><SegmentedControlItem value="standard" label="標準" /><SegmentedControlItem value="large" label="大きめ" /></SegmentedControl></div>
        <div className="settings-note"><p>設定と保存地点はこのブラウザだけに記憶します。</p><p>位置情報は端末内で最寄りの観測地点を探すために使い、緯度・経度は保存しません。</p></div>
      </section>}
    </div>
    <footer className="control-footnote">{state.observedAt ? new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }).format(new Date(state.observedAt)) + ' 観測（日本時間）' : '気象庁アメダスに接続中'}<span>{state.preferences.autoRefresh ? '自動更新 ON' : '手動更新'}</span></footer>
  </div>;
}

function RankingControl({ state }) {
  return <div className="eorzea-ui ranking-control"><SegmentedControl label="全国の観測ランキングの種類" value={state.rankingKind} onChange={kind => action('ranking', { kind })} layout="fill" size="lg">
    <SegmentedControlItem value="temperature" label="高温" /><SegmentedControlItem value="cold" label="低温" /><SegmentedControlItem value="rain" label="雨量" /><SegmentedControlItem value="wind" label="風速" />
  </SegmentedControl></div>;
}

function Islands() {
  const [state, setState] = useState(null);
  useEffect(() => {
    const update = event => { setState(event.detail); document.documentElement.dataset.astryxReady = 'true'; };
    document.addEventListener('eorzea:state', update);
    document.dispatchEvent(new CustomEvent('eorzea:ui-ready'));
    return () => document.removeEventListener('eorzea:state', update);
  }, []);
  if (!state) return null;
  return <>{createPortal(<HeroActions state={state} />, document.getElementById('astryx-actions'))}{createPortal(<ControlCenter state={state} />, document.getElementById('astryx-stations'))}{createPortal(<RankingControl state={state} />, document.getElementById('astryx-ranking'))}</>;
}

class SafetyBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { delete document.documentElement.dataset.astryxReady; console.error('Enhanced controls unavailable', error); }
  render() { return this.state.failed ? null : this.props.children; }
}

createRoot(document.getElementById('astryx-app')).render(<SafetyBoundary><InternationalizationProvider locale="ja-JP" messages={{ 'ja-JP': japaneseMessages }}><Theme theme={neutralTheme} mode="dark"><ToastViewport position="bottomEnd" maxVisible={2}><Islands /></ToastViewport></Theme></InternationalizationProvider></SafetyBoundary>);
