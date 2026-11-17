export type ChapterId = "route" | "brand" | "seat" | "number" | "hand";

export type Entry = {
  id: string;
  chapter: ChapterId;
  title: string;
  place: string;
  body: string[];
};

export const CHAPTERS: { id: ChapterId; title: string }[] = [
  { id: "route", title: "동선" },
  { id: "brand", title: "늘밤" },
  { id: "seat", title: "자리" },
  { id: "number", title: "번호" },
  { id: "hand", title: "인수인계" },
];

export const ORDER = [
  "handover",
  "southgate",
  "speaker",
  "exitsign",
  "receipt",
  "freezer",
  "drawer-key",
  "laundry-ticket",
  "laundry-late",
  "photostrip",
  "booth-return",
  "songbook",
  "seat7",
  "rules",
  "coat",
  "badge",
  "cctv",
  "cctv-ghost",
  "service-open",
  "end-name",
  "end-1842",
  "end-blank",
  "pharmacy-off",
  "pharmacy-on",
  "first-train",
] as const;

export const ENTRIES: Record<string, Entry> = {
  handover: {
    id: "handover",
    chapter: "route",
    title: "인수인계 노트",
    place: "방재실",
    body: [
      "11월 16일 23:40. 한도윤.",
      "서림역 B1 마감은 셔터와 출구등이다. 주통로를 북쪽 끝까지 보고, 옆문을 센다.",
      "늘밤이 들어온 칸은 우리 권한이 아니다. 아이스, 세탁, 네컷, 스터디, 노래. 불 끄지 말 것. 카드키도 우리 것이 아니다.",
      "서랍 열쇠는 아이스크림 키오스크 뒤에 테이프로 붙어 있다. 세탁 분실물 캐비닛용.",
      "이상 없음. 이상 있는 것은 늘밤 쪽이다.",
    ],
  },
  southgate: {
    id: "southgate",
    chapter: "route",
    title: "남쪽 셔터",
    place: "주통로",
    body: [
      "개찰구로 올라가는 셔터는 이미 내려가 있다.",
      "당직은 위로 나가지 않는다. 북쪽만 남아 있다.",
    ],
  },
  speaker: {
    id: "speaker",
    chapter: "route",
    title: "안내 스피커",
    place: "주통로",
    body: [
      "스위치는 내려가 있다. 방송은 없다.",
      "가까이 가면 험만 한 박자 늦다. 말은 없고, 숨만 있다.",
    ],
  },
  exitsign: {
    id: "exitsign",
    chapter: "route",
    title: "출구 표지",
    place: "출구 4",
    body: [
      "계단 셔터는 반만 내려와 있다. 밑으로 지나갈 틈은 없어 보인다. 있어도 막혀 있다.",
      "표지는 출구 4. 그 위에 필름이 숫자만 가린다. 7.",
      "안내판의 4와 필름의 7이 같은 화살표를 가리킨다.",
    ],
  },
  receipt: {
    id: "receipt",
    chapter: "brand",
    title: "아이스 영수증",
    place: "늘밤아이스",
    body: [
      "늘밤아이스  서림역점\n11/17  02:11\n붕어싸만코        1,500\n승인  ****1842\n고객명  손님",
      "뒷면, 볼펜이 뭉개져 있다.\n오늘도 여기가 집이다. 위층은 아직 불을 켜는 사람이 있다.",
    ],
  },
  freezer: {
    id: "freezer",
    chapter: "brand",
    title: "열린 냉동고",
    place: "늘밤아이스",
    body: [
      "뚜껑이 한 뼘 열려 있다. 냉기는 남고 상품은 빠졌다.",
      "가격표 한 줄. 붕어싸만코. 바코드 자리는 하얗게 베여 있다.",
    ],
  },
  "drawer-key": {
    id: "drawer-key",
    chapter: "brand",
    title: "테이프 밑 열쇠",
    place: "늘밤아이스",
    body: [
      "키오스크 뒷면. 테이프가 반쯤 떨어지며 열쇠가 붙어 있다.",
      "태그에는 호실 대신 숫자. 1842. 관리 열쇠치고는 너무 작다.",
    ],
  },
  "laundry-ticket": {
    id: "laundry-ticket",
    chapter: "brand",
    title: "세탁 인수증",
    place: "늘밤세탁",
    body: [
      "늘밤세탁\n고객번호  N-1842\n흰 셔츠 1\n완료예정  04:40",
      "메모 칸은 기계 글씨가 아니다.\n구겨지지 말 것. 내일 면접.",
      "돌아가는 통이 아직 하나 있다. 유리는 안쪽에서 김이 서렸다.",
    ],
  },
  "laundry-late": {
    id: "laundry-late",
    chapter: "brand",
    title: "완료 예정 시각",
    place: "늘밤세탁",
    body: [
      "04:40이 지났다. 완료 알림은 울리지 않는다.",
      "통은 여전히 돈다. 셔츠는 아직 안쪽이다.",
    ],
  },
  photostrip: {
    id: "photostrip",
    chapter: "number",
    title: "바닥의 네 컷",
    place: "늘밤네컷",
    body: [
      "네 칸 모두 사람이 없다. 커튼, 스툴, 플래시, 다시 커튼.",
      "여백에 기계가 찍은 문장.\n이 사진은 고객님의 것이 아닙니다.",
      "인화 02:06. 결제 1842.",
    ],
  },
  "booth-return": {
    id: "booth-return",
    chapter: "number",
    title: "다시 들어온 부스",
    place: "늘밤네컷",
    body: [
      "모니터에서 보던 자리는 비어 있다.",
      "스툴만 있고 시트는 식었다. 플래시 램프만 아직 따뜻하다.",
    ],
  },
  songbook: {
    id: "songbook",
    chapter: "seat",
    title: "2번 방 대기곡",
    place: "노래 2번 방",
    body: [
      "문 위 등은 공실, 초록. 문틈으로 화면만 켜져 있다.",
      "대기곡은 하나.\n퇴근길. 02:02. 고객 1842.",
      "마이크는 스탠드에 없고 소파에 눕혀 있다. 아직 미지근하다.",
    ],
  },
  seat7: {
    id: "seat7",
    chapter: "seat",
    title: "7번 좌석",
    place: "늘밤스터디",
    body: [
      "이 칸만 스탠드가 켜져 있다.",
      "예약은 90일 반복, 00:00–06:00. 이름 칸은 비어 있고 번호만 1842.",
      "책갈피 대신 귀마개. 쪽지 한 장.\n위층은 층간소음. 아래층은 없다. 그래서 여기다.",
    ],
  },
  rules: {
    id: "rules",
    chapter: "seat",
    title: "이용수칙",
    place: "늘밤스터디",
    body: [
      "유리에 붙어 있다. 취침 금지. 좌석 밖 취식 금지. 심야 할증 없음.",
      "7번 옆에만 다른 펜으로 한 줄.\n이 줄은 적용하지 않음.",
    ],
  },
  coat: {
    id: "coat",
    chapter: "seat",
    title: "남색 점퍼",
    place: "방재실",
    body: [
      "의자 등받이에 걸려 있다. 명찰 자리는 실밥만 남았다.",
      "주머니에 식은 삼각김밥 봉투. 유통기한은 어제.",
      "한도윤의 당직이 여기서 끝난 것인지, 빼입고 올라간 것인지는 적혀 있지 않다.",
    ],
  },
  badge: {
    id: "badge",
    chapter: "number",
    title: "빈 집게",
    place: "늘밤세탁",
    body: [
      "캐비닛 안에는 옷이 아니라 클립이 하나다.",
      "사원증은 빠지고 집게만 남았다. 안쪽에 같은 숫자. 1842. 회사 이름은 갈려 있다.",
    ],
  },
  cctv: {
    id: "cctv",
    chapter: "number",
    title: "방재 모니터",
    place: "방재실",
    body: [
      "넷은 주통로, 아이스, 세탁, 네컷이다. 점은 지금 서 있는 자리다.",
      "다섯 번째는 아직 검다.",
    ],
  },
  "cctv-ghost": {
    id: "cctv-ghost",
    chapter: "number",
    title: "네컷 채널의 점",
    place: "방재실",
    body: [
      "네컷 화면에 점이 둘이다.",
      "하나는 여기 있고, 다른 하나는 부스 안 스툴 옆이다. 움직이지 않는다.",
    ],
  },
  "service-open": {
    id: "service-open",
    chapter: "route",
    title: "B2-1842",
    place: "방재실",
    body: [
      "다섯 번째 채널이 들어온다. 북쪽 끝 설비. 이름  B2-1842.",
      "카드키를 댄 기억은 없다. 모니터가 먼저 승인하고, 북쪽 문의 잠금등이 꺼진다.",
    ],
  },
  "end-name": {
    id: "end-name",
    chapter: "hand",
    title: "이름으로 저장",
    place: "설비 복도",
    body: ["이름 칸은 잠시 머물다 손님으로 바뀐다."],
  },
  "end-1842": {
    id: "end-1842",
    chapter: "hand",
    title: "1842로 저장",
    place: "설비 복도",
    body: [
      "저장되었다.",
      "라디오가 늦게 응답한다. 1842, 마감 확인.",
      "높이는 당신과 비슷하고, 박자만 한 템포 늦다.",
    ],
  },
  "end-blank": {
    id: "end-blank",
    chapter: "hand",
    title: "빈 칸",
    place: "설비 복도",
    body: [
      "빈 칸은 저장되지 않는다.",
      "오류 한 줄. 이용자를 특정할 수 없음. 출구 안내를 중단합니다.",
      "출구 표지의 불이 꺼진다. 길은 남아 있다. 번호만 없다.",
    ],
  },
  "pharmacy-off": {
    id: "pharmacy-off",
    chapter: "brand",
    title: "꺼진 약국",
    place: "주통로",
    body: [
      "서쪽 셔터에 늘밤약국이라고만 적혀 있다.",
      "십자가는 꺼져 있고, 유리 안은 합판이다. 영업이 아니라 자리만 잡혀 있다.",
    ],
  },
  "pharmacy-on": {
    id: "pharmacy-on",
    chapter: "brand",
    title: "늘밤약국",
    place: "주통로",
    body: [
      "십자가 불만 켜진다. 유리 안은 여전히 비어 있고 가격표도 없다.",
      "셔터 하단 테이프. 내일 02:11. 영업 개시가 아니라 예약이다.",
    ],
  },
  "first-train": {
    id: "first-train",
    chapter: "route",
    title: "첫차 시간",
    place: "주통로",
    body: [
      "05:00. 위에서는 첫차가 들어올 시간이다.",
      "남쪽 셔터는 그대로다. 당직은 날짜만 넘어간다.",
    ],
  },
};

export type Spot = {
  id: string;
  x: number;
  z: number;
  label: string;
  range?: number;
};

export const SPOTS: Spot[] = [
  { id: "handover", x: 5.75, z: 14.05, label: "인수인계 노트" },
  { id: "cctv", x: 4.85, z: 12.35, label: "모니터" },
  { id: "coat", x: 7.35, z: 14.55, label: "남색 점퍼" },
  { id: "southgate", x: 0, z: 14.7, label: "남쪽 셔터", range: 2 },
  { id: "speaker", x: 1.35, z: 8.2, label: "스피커" },
  { id: "exitsign", x: -6.1, z: 12.7, label: "출구 표지", range: 2.1 },
  { id: "receipt", x: -7.15, z: 1.05, label: "영수증" },
  { id: "freezer", x: -8.25, z: 2.15, label: "열린 냉동고" },
  { id: "drawer-key", x: -7.55, z: 4.55, label: "테이프 밑 열쇠" },
  { id: "laundry-ticket", x: -6.35, z: -7.4, label: "인수증" },
  { id: "badge", x: -9.15, z: -8.55, label: "분실물 캐비닛" },
  { id: "photostrip", x: 5.15, z: 1.05, label: "네 컷" },
  { id: "songbook", x: 8.25, z: -17.15, label: "대기곡" },
  { id: "seat7", x: 3.45, z: -31.05, label: "7번 좌석" },
  { id: "rules", x: 0.15, z: -25.55, label: "이용수칙" },
  { id: "door", x: 0, z: -31.95, label: "설비문", range: 1.8 },
  { id: "terminal", x: 0, z: -36.15, label: "단말", range: 1.8 },
  { id: "pharmacy", x: -1.15, z: -4.55, label: "늘밤약국" },
];

export const HINTS: Record<string, string> = {
  handover: "방재실의 인수인계",
  receipt: "늘밤아이스",
  "laundry-ticket": "늘밤세탁",
  photostrip: "늘밤네컷",
  seat7: "스터디 7번",
  cctv: "방재실 모니터",
  terminal: "설비 복도의 단말",
};

export const CORE = ["receipt", "laundry-ticket", "photostrip", "seat7"] as const;

export function chapterTitle(id: ChapterId): string {
  return CHAPTERS.find((c) => c.id === id)?.title ?? "";
}

export function nameEndingBody(name: string): string[] {
  return [
    `이름은 ${name}. 화면은 그 글자를 잠시 두었다가 손님으로 고친다.`,
    "서쪽 셔터 위에 초록 십자가가 들어온다. 늘밤약국.",
    "오늘은 문이 없다. 내일 영수증에 이 이름이 손님으로 찍힐 것이다.",
  ];
}

export const TERMINAL_BODY = [
  "고객번호 1842의 줄이 직원 한도윤의 당직 기록과 붙어 있다.",
  "이름 칸은 비어 있고 커서가 깜빡인다.",
  "이 칸에 들어가는 글자가 내일 영수증의 고객명이 된다.",
];

export const DOOR_LOCKED = [
  "카드리더의 불이 빨갛다.",
  "늘밤 권한. 당직 열쇠로는 돌아가지 않는다.",
];

export const DOOR_WAIT = [
  "리더가 노랗게 한 번 깜빡이고 다시 빨개진다.",
  "승인은 방재실 모니터 쪽에 있다.",
];

export const BADGE_LOCKED = [
  "분실물 캐비닛은 잠겨 있다.",
  "열쇠 구멍이 유난히 깨끗하다. 최근에 갈아 끼운 자국.",
];
