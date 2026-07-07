"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search, Store, Trophy, BarChart3, Loader2 } from "lucide-react";

declare global {
  interface Window {
    kakao: any;
  }
}

const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 4000, label: "4km" },
];

const ZOOM_BY_RADIUS: Record<number, number> = { 500: 5, 1000: 6, 2000: 7, 4000: 8 };

type Suggestion = { place: string; addr: string; x: string; y: string };

type AnalysisResult = {
  upjongLabel: string;
  total: number;
  sameCount: number;
  density: string;
  densityPerKm2: number;
  topBrands: { name: string; count: number }[];
  stores: { name: string; branch: string | null; lon: number; lat: number; addr: string; upjong: string; same: boolean }[];
};

function markerImage(kakao: any, color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  );
  return new kakao.maps.MarkerImage(`data:image/svg+xml,${svg}`, new kakao.maps.Size(16, 16), {
    offset: new kakao.maps.Point(8, 8),
  });
}

export default function TradeAreaAnalysis({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [center, setCenter] = useState<{ lon: number; lat: number; label: string } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);

  // 카카오맵 SDK 로드
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!key) {
      setError("카카오맵 API 키가 설정되지 않았습니다.");
      return;
    }
    if (window.kakao?.maps?.services) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => setSdkReady(true));
    script.onerror = () => setError("카카오맵을 불러오지 못했습니다.");
    document.head.appendChild(script);
  }, []);

  // 주소 자동완성 (디바운스)
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (!sdkReady || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(query, (data: any[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSuggestions(
            data.slice(0, 5).map((d) => ({
              place: d.place_name,
              addr: d.road_address_name || d.address_name,
              x: d.x,
              y: d.y,
            }))
          );
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      });
    }, 300);
  }, [query, sdkReady]);

  const clearOverlays = () => {
    for (const o of overlaysRef.current) o.setMap(null);
    overlaysRef.current = [];
  };

  const runAnalysis = useCallback(
    async (lon: number, lat: number, r: number, label: string) => {
      if (!sdkReady || !mapEl.current) return;
      setLoading(true);
      setError(null);
      setShowSuggestions(false);

      const kakao = window.kakao;
      const pos = new kakao.maps.LatLng(lat, lon);

      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(mapEl.current, { center: pos, level: ZOOM_BY_RADIUS[r] });
      } else {
        mapRef.current.setCenter(pos);
        mapRef.current.setLevel(ZOOM_BY_RADIUS[r]);
      }
      const map = mapRef.current;
      clearOverlays();

      // 중심 마커 + 반경 원
      const centerMarker = new kakao.maps.Marker({ map, position: pos });
      const circle = new kakao.maps.Circle({
        map,
        center: pos,
        radius: r,
        strokeWeight: 2,
        strokeColor: "#1a5c38",
        strokeOpacity: 0.9,
        fillColor: "#1a5c38",
        fillOpacity: 0.08,
      });
      overlaysRef.current.push(centerMarker, circle);

      try {
        const res = await fetch(`/api/trade-area?brand=${encodeURIComponent(brandSlug)}&cx=${lon}&cy=${lat}&radius=${r}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "분석에 실패했습니다.");
        setResult(data);

        // 지도가 hidden 상태에서 생성된 경우 타일이 렌더링되지 않으므로 재계산
        setTimeout(() => {
          map.relayout();
          map.setCenter(pos);
        }, 0);

        const gold = markerImage(kakao, "#f59e0b");
        const gray = markerImage(kakao, "#9ca3af");
        const infoWindow = new kakao.maps.InfoWindow({ removable: true });

        for (const s of data.stores as AnalysisResult["stores"]) {
          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(s.lat, s.lon),
            image: s.same ? gold : gray,
            zIndex: s.same ? 10 : 1,
          });
          kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.setContent(
              `<div style="padding:8px 12px;font-size:12px;max-width:220px;"><b>${s.name}${s.branch ? ` ${s.branch}` : ""}</b><br/><span style="color:#888">${s.addr}</span></div>`
            );
            infoWindow.open(map, marker);
          });
          overlaysRef.current.push(marker);
        }
      } catch (e: any) {
        setError(e.message);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [sdkReady, brandSlug]
  );

  const selectSuggestion = (s: Suggestion) => {
    const lon = Number(s.x);
    const lat = Number(s.y);
    skipSearchRef.current = true;
    setQuery(s.place);
    setSuggestions([]);
    setShowSuggestions(false);
    setCenter({ lon, lat, label: s.place });
    runAnalysis(lon, lat, radius, s.place);
  };

  const submitSearch = () => {
    if (!sdkReady || !query.trim()) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (data: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && data[0]) {
        const lon = Number(data[0].x);
        const lat = Number(data[0].y);
        const label = data[0].road_address?.address_name || data[0].address_name;
        setCenter({ lon, lat, label });
        runAnalysis(lon, lat, radius, label);
      } else if (suggestions[0]) {
        selectSuggestion(suggestions[0]);
      } else {
        setError("주소를 찾지 못했습니다. 다시 입력해주세요.");
      }
    });
  };

  const changeRadius = (r: number) => {
    setRadius(r);
    if (center) runAnalysis(center.lon, center.lat, r, center.label);
  };

  const cards = result
    ? [
        { icon: <Store size={18} className="text-green-700" />, label: `반경 내 ${result.upjongLabel} 점포`, value: `${result.total.toLocaleString()}개` },
        { icon: <MapPin size={18} className="text-amber-500" />, label: `${brandName} 점포`, value: `${result.sameCount}개` },
        { icon: <BarChart3 size={18} className="text-green-700" />, label: "업종 밀집도", value: result.density, sub: `km²당 ${result.densityPerKm2}개` },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* 주소 검색 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-bold text-gray-900 mb-3">창업 예정지 상권 분석</p>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                onFocus={() => suggestions.length && setShowSuggestions(true)}
                placeholder="창업 예정지 주소를 입력하세요 (예: 서울 강남구 테헤란로 123)"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600"
              />
            </div>
            <button
              onClick={submitSearch}
              disabled={!sdkReady || loading}
              className="px-4 py-2.5 bg-green-800 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 shrink-0"
            >
              분석
            </button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-800">{s.place}</span>
                    <span className="block text-xs text-gray-400">{s.addr}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 반경 선택 */}
        <div className="flex gap-2 mt-3">
          {RADIUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => changeRadius(o.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                radius === o.value
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
              }`}
            >
              {o.label}
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center ml-1 hidden sm:inline">배달 반경 기준</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* 지도 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div ref={mapEl} className={`w-full h-[420px] ${center ? "" : "hidden"}`} />
        {!center && (
          <div className="h-[240px] flex flex-col items-center justify-center text-gray-400 gap-2">
            <MapPin size={28} />
            <p className="text-sm">주소를 검색하면 지도와 분석 결과가 표시됩니다</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <Loader2 size={28} className="animate-spin text-green-700" />
          </div>
        )}
        {center && result && (
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> {brandName}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> 동일 업종
            </span>
          </div>
        )}
      </div>

      {/* 분석 카드 */}
      {result && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <div className="flex justify-center mb-1.5">{c.icon}</div>
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-lg font-black text-gray-900">{c.value}</p>
                {"sub" in c && c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
              </div>
            ))}
          </div>

          {result.topBrands.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Trophy size={16} className="text-amber-500" /> 반경 내 경쟁 브랜드 TOP {result.topBrands.length}
              </h3>
              <div className="space-y-1">
                {result.topBrands.map((b, i) => (
                  <div key={b.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">{b.name}</span>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{b.count}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 px-1">
            소상공인시장진흥공단 상가(상권)정보 기준이며, 실제 영업 현황과 차이가 있을 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}
