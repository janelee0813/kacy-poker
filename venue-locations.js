// Public Naver Place addresses and WGS84 destination coordinates, checked 2026-09-19.
// Only explicitly identified branches belong here. Never guess a location from a search's first result.
const VENUE_LOCATIONS = {
  '신촌 러너펍': { name: '러너펍 신촌점', address: '서울특별시 서대문구 명물길 10 4층', lat: 37.5574179, lon: 126.9375383, placeId: '2040088995' },
  '홍대 러너펍': { name: '러너펍 홍대점', address: '서울특별시 마포구 와우산로 55 1층', lat: 37.5494001, lon: 126.9228925, placeId: '2046841051' },
  '영등포 러너펍': { name: '러너펍 영등포점', address: '서울특별시 영등포구 영등포로50길 5 3층', lat: 37.5184141, lon: 126.9094696, placeId: '2018635124' },
  '논현 러너펍': { name: '러너펍 논현점', address: '서울특별시 강남구 학동로2길 56 1층 103호', lat: 37.5079527, lon: 127.0236557, placeId: '1355597216' },
  '구로 러너펍': { name: '러너펍 구로디지털단지점', address: '서울특별시 구로구 디지털로32나길 17 2층', lat: 37.483949, lon: 126.9003068, placeId: '2054088358' },
  '역삼 러너펍': { name: '러너펍 역삼점', address: '서울특별시 강남구 테헤란로37길 25 지하1층', lat: 37.5038672, lon: 127.0401461, placeId: '2086674448' },
  '방이 러너펍': { name: '러너펍 방이점', address: '서울특별시 송파구 오금로15길 16 2층', lat: 37.513028, lon: 127.1098649, placeId: '1001572777' },
  '구리 러너펍': { name: '러너펍 구리점', address: '경기도 구리시 경춘로 218-9 2층 202호', lat: 37.5998766, lon: 127.1398598, placeId: '2073483960' },
  '노원 러너펍': { name: '러너펍 노원점', address: '서울특별시 노원구 노해로83길 18-10 3층', lat: 37.6560283, lon: 127.0647583, placeId: '2030340889' },
  '별내 러너펍': { name: '러너펍 별내점', address: '경기도 남양주시 별내중앙로 30 2층 201호', lat: 37.6459204, lon: 127.1256903, placeId: '1143938579' },
  '수원역 러너펍': { name: '러너펍 수원역점', address: '경기도 수원시 팔달구 갓매산로55번길 28 3층', lat: 37.2685071, lon: 127.0033175, placeId: '2076651187' },
  '인계 러너펍': { name: '러너펍 인계점', address: '경기도 수원시 팔달구 인계로138번길 44 2층', lat: 37.2650822, lon: 127.0317848, placeId: '2056497115' },
  '파주 러너펍': { name: '러너펍 파주야당점', address: '경기도 파주시 소리천로 25 4층 403호', lat: 37.7148478, lon: 126.7614804, placeId: '2030541255' },
  '목동 KMGM': { name: 'KMGM 목동점', address: '서울특별시 양천구 목동동로 260 2층 202호', lat: 37.5257731, lon: 126.8747829, placeId: '1813057442' },
  '신사 빅스택': { name: '빅스택 신사본점', address: '서울특별시 강남구 강남대로152길 15 3층', lat: 37.5174524, lon: 127.0206702, placeId: '1256288625' },
  '광주 용봉점 치즈홀덤펍': { name: '광주 치즈 용봉점', address: '전남광주통합특별시 북구 운용로95번길 5-4 3층', lat: 35.1772874, lon: 126.8964147, placeId: '2034807510' },
  '광주 스타디움': { name: '더블유에프피스타디움', address: '전남광주통합특별시 서구 상무연하로 68', lat: 35.1543134, lon: 126.8504909, placeId: '2035696580' },
};
VENUE_LOCATIONS['수원 인계 러너펍'] = VENUE_LOCATIONS['인계 러너펍'];

function getVenueLocation(venue) {
  return Object.prototype.hasOwnProperty.call(VENUE_LOCATIONS, venue) ? VENUE_LOCATIONS[venue] : null;
}

function getTmapUrl(venue) {
  const place = getVenueLocation(venue);
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return null;
  return 'tmap://route?goalname=' + encodeURIComponent(place.name) + '&goalx=' + place.lon + '&goaly=' + place.lat;
}

function openTmap(event) {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const help = document.getElementById('tmap-help');
  help.classList.remove('hidden');
  document.getElementById('tmap-help-message').textContent = mobile
    ? '티맵이 열리지 않나요? 티맵 설치 후 Safari 또는 Chrome에서 다시 눌러주세요.'
    : '티맵 길찾기는 휴대폰에서 이용할 수 있어요. 휴대폰으로 이 페이지를 열어주세요.';
  if (!mobile) {
    event.preventDefault();
    help.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
