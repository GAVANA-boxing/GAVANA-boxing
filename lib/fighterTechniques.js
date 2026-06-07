// Fighter-specific technique lessons.
// Each lesson teaches the fighter's unique mechanic + universal coaching principle.
// teachingBlocks types: "FOOT" | "WEIGHT" | "ANGLE" | "GUARD"
// difficulty: "beginner" | "intermediate" | "advanced"

export const FIGHTER_TECHNIQUES = {

  // ── Mike Tyson ──────────────────────────────────────────────────────────────
  "mike-tyson": [
    {
      title: "Peekaboo Entry",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Lead foot anchors the slip; rear foot drives the step inward", mn: "Урд хөл зайлалтыг бэхэлнэ; арын хөл алхалтыг дотор тийш жолоодно", ko: "앞발이 슬립을 고정하고, 뒷발이 안쪽 스텝을 구동한다" } },
        { type: "WEIGHT", value: { en: "Rear hip loads on the slip — hook is already pre-charged", mn: "Зайлалтын үед арын бүсэлхий ачаалагдана — хук аль хэдийн бэлэн болсон байна", ko: "슬립 시 뒷 힙이 로딩된다 — 훅은 이미 예비 충전 상태" } },
        { type: "ANGLE",  value: { en: "Slip outside their jab line, enter at 45° to their centerline", mn: "Жааб-ын шугамаас гадна зайлж, дундын шугамтай 45° өнцгөөр орно", ko: "잽 라인 바깥으로 슬립하고, 센터라인에 45° 각도로 진입한다" } },
        { type: "GUARD",  value: { en: "High guard stays active throughout — no drop during entry", mn: "Өндөр guard бүхэлдээ идэвхтэй байна — орох үед буулгахгүй", ko: "높은 가드를 진입 내내 유지한다 — 진입 중 가드를 내리지 않는다" } },
      ],
      explanation: {
        en: "Slip outside the jab and step in simultaneously — defense and offense in one motion, no gap between. The high guard removes the window where most fighters get countered mid-entry. When both actions happen at once, there's nothing for the opponent to punish.",
        mn: "Жааб-г гадна тийш зайлуулж нэгэн зэрэг дотор тийш алхана — хамгаалалт ба довтолгоо нэг хөдөлгөөнд, завсаргүй. Өндөр guard ихэнх тамирчид орох үед контр авдаг цонхыг арилгана. Хоёр үйлдэл нэгэн зэрэг болоход өрсөлдөгч шийтгэх зүйл байхгүй.",
        ko: "잽을 아웃사이드로 슬립하며 동시에 안으로 진입한다 — 방어와 공격이 하나의 동작으로, 간격 없이. 높은 가드는 대부분의 선수가 진입 중 카운터를 맞는 순간을 제거한다. 두 동작이 동시에 일어나면 상대가 벌할 여지가 없다.",
      },
      bodyCue: {
        en: "Feel the rear hip load the moment your head dips — if the hip hasn't moved, the hook has nothing behind it.",
        mn: "Толгой доошлох мөчид арын бүсэлхий ачаалагдахыг мэдрэ — бүсэлхий хөдлөөгүй бол хукны цаана юу ч байхгүй.",
        ko: "머리가 낮아지는 순간 뒷 힙이 로딩되는 것을 느껴라 — 힙이 움직이지 않으면 훅에 힘이 없다.",
      },
      commonMistake: {
        en: "Dropping the guard during the slip to generate power. Your chin is exposed at the exact moment you're trying to land.",
        mn: "Хүч авахын тулд зайлалтын үед guard буулгах. Цохихыг оролдож буй яг тэр мөчид эрүү нь ил гарна.",
        ko: "파워를 내기 위해 슬립 중 가드를 내리는 것. 타격을 시도하는 바로 그 순간 턱이 노출된다.",
      },
      coachNotes: {
        en: "Slip and fire are one motion. If you think 'slip, then hook' — you're too slow. Think 'enter' and let the body do both.",
        mn: "Зайлах ба буудах нь нэг хөдөлгөөн. 'Зайл, дараа нь хук' гэж бодвол — хэтэрхий удаан. 'Ор' гэж бод, бие нь хоёуланг нь хийг.",
        ko: "슬립과 파이어는 하나의 동작이다. '슬립, 그 다음 훅'으로 생각하면 너무 느리다. '진입'으로 생각하고 몸이 두 가지를 동시에 하게 두어라.",
      },
      drillSteps: [
        { en: "Shadow: imagine the incoming jab, slip outside left, feel weight shift to rear hip — guard stays high", mn: "Сүүдэр: ирж буй жааб-г төсөөлж, зүүн гадна тийш зайл, жин арын бүсэлхий рүү шилжихийг мэдрэ — guard өндөр байна", ko: "섀도우: 들어오는 잽을 상상하며 왼쪽 아웃사이드로 슬립하고, 무게가 뒷 힙으로 이동하는 것을 느껴라 — 가드는 높게 유지" },
        { en: "Partner slow jabs: slip outside 10 reps each side, no counter yet — perfect the entry", mn: "Партнер удаан жааб: хоёр талаас 10 давталт гадна тийш зайл, контр хийхгүй — орох хөдөлгөөнийг төгс болго", ko: "파트너 슬로우 잽: 양쪽 각 10회 아웃사이드 슬립, 카운터 없이 — 진입을 완벽하게" },
        { en: "Add counter: immediately after the slip, release left hook to body — don't reach for the head", mn: "Контр нэм: зайлсны дараа тэр даруй зүүн хукийг бие рүү гаргах — толгой руу сунгалгүй", ko: "카운터 추가: 슬립 직후 바디에 왼쪽 훅을 즉시 릴리즈 — 헤드를 향해 뻗지 말 것" },
        { en: "Speed build: partner throws fight-speed jabs, slip and counter without telegraphing", mn: "Хурд нэмэх: партнер тулааны хурдтай жааб шидэх, телеграфлахгүйгээр зайлж контр хий", ko: "속도 향상: 파트너가 실전 속도로 잽을 던지면, 예고 없이 슬립하고 카운터" },
      ],
    },
    {
      title: "Weight Load & Explode",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Rear foot is the power base — never lifts before the hook lands", mn: "Арын хөл хүчний суурь — хук буухаас өмнө хэзээ ч өргөгдөхгүй", ko: "뒷발이 파워의 기반 — 훅이 닿기 전에 절대 들리지 않는다" } },
        { type: "WEIGHT", value: { en: "Full load onto rear foot → hip → shoulder → fist, in sequence", mn: "Арын хөл рүү бүрэн ачаалал → бүсэлхий → мөр → нударга, дарааллаар", ko: "뒷발로 완전 로딩 → 힙 → 어깨 → 주먹, 순서대로" } },
        { type: "ANGLE",  value: { en: "Vertical axis rotation — power comes from the ground, not the arm", mn: "Босоо тэнхлэгийн эргэлт — хүч газраас ирнэ, гараас биш", ko: "수직 축 회전 — 파워는 땅에서 나온다, 팔이 아니라" } },
        { type: "GUARD",  value: { en: "Lead hand stays up during the load — no drop to cock the hook", mn: "Урд гар ачааллын үед өндөр байна — хук бэлдэхийн тулд буулгахгүй", ko: "로딩 중 앞손은 올라가 있어야 한다 — 훅을 코킹하기 위해 내리지 않는다" } },
      ],
      explanation: {
        en: "The punch fires from the ground. Weight loads fully onto the rear foot first, hips fire like a spring, the shoulder follows, and the fist arrives last. If the arm moves before the hip, the punch has no knockout power regardless of how hard you swing.",
        mn: "Цохилт газраас буудана. Жин эхлээд арын хөл дээр бүрэн ачаалагдаж, бүсэлхий хавар шиг гарч, мөр дагаж, нударга хамгийн сүүлд хүрнэ. Гар бүсэлхийгээс өмнө хөдөлвөл хэр хүчтэй доргисон ч цохилтод нокаутын хүч байхгүй.",
        ko: "펀치는 땅에서 발사된다. 먼저 뒷발에 완전히 로딩되고, 힙이 스프링처럼 작동하며, 어깨가 따르고, 주먹이 마지막에 도달한다. 팔이 힙보다 먼저 움직이면 아무리 세게 휘둘러도 녹아웃 파워가 없다.",
      },
      bodyCue: {
        en: "Feel the rear foot pressing hard into the floor before anything else moves — that floor pressure is where the power starts.",
        mn: "Өөр юм хөдлөхөөс өмнө арын хөл шалыг хүчтэй дарахыг мэдрэ — тэр шалын дарлалт хүч эхэлдэг газар.",
        ko: "다른 것이 움직이기 전에 뒷발이 바닥을 세게 누르는 것을 느껴라 — 그 바닥 압력이 파워가 시작되는 곳이다.",
      },
      commonMistake: {
        en: "Rushing the punch before the weight has fully transferred. Arm-only hooks have no knockout power regardless of extension or arm speed.",
        mn: "Жин бүрэн шилжихээс өмнө цохилтыг яаравчлах. Зөвхөн гарны хук нь сунгалт эсвэл гарны хурдаас үл хамааран нокаутын хүч байхгүй.",
        ko: "무게가 완전히 이동하기 전에 펀치를 서두르는 것. 팔만 쓰는 훅은 익스텐션이나 팔 속도에 관계없이 녹아웃 파워가 없다.",
      },
      coachNotes: {
        en: "The punch is already done before your arm moves. Hip fires → shoulder follows → arm delivers. Practice the sequence slow enough to feel all three steps.",
        mn: "Цохилт гар хөдлөхөөс өмнө аль хэдийн дуусчихсан байна. Бүсэлхий гарна → мөр дагана → гар хүргэнэ. Гурван алхам бүгдийг мэдрэхийн тулд дарааллыг хангалттай удаан дасгал хий.",
        ko: "팔이 움직이기 전에 펀치는 이미 완성된 것이다. 힙 발사 → 어깨 따라옴 → 팔이 전달. 세 단계를 느낄 수 있을 만큼 천천히 시퀀스를 연습하라.",
      },
      drillSteps: [
        { en: "Stand square, rock weight from lead to rear foot — feel the hip shift fully before moving to next step", mn: "Нэг шугаманд зогс, жинг урд хөлнөөс арын хөл рүү чичлэх — дараагийн алхамд орохоос өмнө бүсэлхийн шилжилтийг бүрэн мэдрэх", ko: "스퀘어로 서서 앞발에서 뒷발로 무게를 이동 — 다음 단계로 넘어가기 전 힙 이동을 완전히 느껴라" },
        { en: "Add shoulder rotation from the rear-weight position — it naturally winds the hook", mn: "Арын жингийн байрлалаас мөрний эргэлт нэм — энэ нь хукийг байгалиараа ороодог", ko: "뒷발 로딩 자세에서 어깨 회전 추가 — 자연스럽게 훅이 감긴다" },
        { en: "Shadow: throw hooks from the loaded position, feel the explosion upward from the floor", mn: "Сүүдэр: ачаалагдсан байрлалаас хук шид, газраас дээш тэсрэлтийг мэдрэх", ko: "섀도우: 로딩 자세에서 훅을 던지며 바닥에서 위로 폭발하는 느낌을 느껴라" },
        { en: "Heavy bag: pause 1 sec on the load, then fire — until the load becomes automatic", mn: "Хүнд уут: ачааллал дээр 1 сек зогс, дараа нь гаргах — ачааллал автомат болтол", ko: "헤비백: 로딩 자세에서 1초 멈추고 파이어 — 로딩이 자동화될 때까지" },
      ],
    },
    {
      title: "Short Right Inside",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Chest-to-chest range — weight centered, no room to step out", mn: "Цээж-цээжний зай — жин төвд, гарах зай байхгүй", ko: "가슴 대 가슴 거리 — 무게 중심, 나갈 공간 없음" } },
        { type: "WEIGHT", value: { en: "Body rotation drives the punch — arm extension is minimal", mn: "Биеийн эргэлт цохилтыг жолоодно — гарны сунгалт хамгийн бага", ko: "몸의 회전이 펀치를 구동한다 — 팔 익스텐션은 최소화" } },
        { type: "ANGLE",  value: { en: "Vertical fist straight down the middle — no arc, no telegraph", mn: "Босоо нударга дундаар шулуун — нумгүй, телеграфгүй", ko: "수직 주먹으로 중앙을 직선으로 — 아크 없이, 예고 없이" } },
        { type: "GUARD",  value: { en: "Lead hand controls head/space while punching hand drives through", mn: "Урд гар толгой/зайг хянах ба цохих гар дамжин орно", ko: "앞손이 머리/공간을 컨트롤하며 타격하는 손이 관통한다" } },
      ],
      explanation: {
        en: "At clinch range there's no room for a full cross. Body rotation drives a vertical-fist right down the center — same power delivery, zero space required. The elbow, not the arm, is the engine. Extension at this distance creates a push with no snap.",
        mn: "Клинч зайд бүтэн кросс хийх зай байхгүй. Биеийн эргэлт нь босоо нударгыг дундаар жолоодно — ижил хүч хүргэлт, огт зай хэрэггүй. Тохой нь гар биш, хөдөлгүүр. Энэ зайд сунгалт нь ялигдалгүй түлхэлт үүсгэнэ.",
        ko: "클린치 거리에서는 풀 크로스를 날릴 공간이 없다. 몸의 회전이 수직 주먹을 중앙으로 구동한다 — 동일한 파워 전달, 공간 불필요. 엔진은 팔이 아니라 팔꿈치다. 이 거리에서 익스텐션은 스냅 없는 밀기가 된다.",
      },
      bodyCue: {
        en: "Feel your back shoulder driving into the punch — if you feel the arm extending, you're too far away for this version.",
        mn: "Арын мөр цохилтод орж байгааг мэдрэ — гар сунжиж байгааг мэдэрвэл энэ хувилбарт хэтэрхий хол байна.",
        ko: "뒷 어깨가 펀치 안으로 밀려드는 것을 느껴라 — 팔이 뻗어지는 것이 느껴지면 이 버전에 너무 멀리 있는 것이다.",
      },
      commonMistake: {
        en: "Trying to extend a full cross from inside range. Arm extension at close distance drains power and telegraphs the punch before it lands.",
        mn: "Дотоод зайнаас бүтэн кросс сунгахыг оролдох. Ойрын зайд гар сунгах нь хүчийг шавхаж, цохилт буухаас өмнө телеграфладна.",
        ko: "인사이드 거리에서 풀 크로스를 뻗으려는 것. 가까운 거리에서 팔을 뻗으면 파워가 빠지고 펀치가 닿기 전에 예고가 된다.",
      },
      coachNotes: {
        en: "Think 'push with your shoulder through the elbow' — not 'extend your arm.' At inside range, the shoulder is the strike.",
        mn: "'Тохойгоороо дамжуулан мөрөөрөө түлх' гэж бод — 'гараа сун' биш. Дотоод зайд мөр бол цохилт.",
        ko: "'팔꿈치를 통해 어깨로 밀어라'로 생각하라 — '팔을 뻗어라'가 아니라. 인사이드 거리에서 어깨가 타격이다.",
      },
      drillSteps: [
        { en: "Get in close stance, practice short vertical-fist rights from hip height, arm barely extends", mn: "Ойрын байрлалд ор, бүсний өндрөөс богино босоо нударга баруун гар дасгал хий, гар бараг сунгагдахгүй", ko: "가까운 자세로 서서 힙 높이에서 짧은 수직 주먹 오른손 연습, 팔이 거의 뻗어지지 않게" },
        { en: "Focus on shoulder driving into the punch — the arm doesn't extend, the body rotates through", mn: "Мөрийг цохилтод орохад анхаар — гар сунгагдахгүй, бие дамжин эргэнэ", ko: "어깨가 펀치 안으로 밀려드는 것에 집중 — 팔은 뻗지 않고, 몸이 관통하여 회전한다" },
        { en: "Clinch bag: get chest-to-bag, throw short rights from body rotation only", mn: "Клинч уут: цээжийг уут дээр тавьж, зөвхөн биеийн эргэлтээс богино баруун гар шид", ko: "클린치 백: 가슴을 백에 밀착하고 몸 회전만으로 짧은 오른손을 던져라" },
        { en: "Partner pads in close: practice the distance where only short shots are possible", mn: "Партнер ойрын пад: зөвхөн богино цохилт боломжтой зайг дасгалжуул", ko: "파트너 패드 클로즈 레인지: 짧은 샷만 가능한 거리를 연습하라" },
      ],
    },
  ],

  // ── Muhammad Ali ────────────────────────────────────────────────────────────
  "muhammad-ali": [
    {
      title: "Lead Foot Pivot Exit",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Lead foot ball is the pivot post — rear foot pushes it around", mn: "Урд хөлний бөмбөлөг эргэлтийн тулгуур — арын хөл түлхэж эргүүлнэ", ko: "앞발 볼이 피벗 포스트 — 뒷발이 밀어서 돌린다" } },
        { type: "WEIGHT", value: { en: "Rear foot pushes, weight transfers through the pivot arc", mn: "Арын хөл түлхэж, жин эргэлтийн нумаар дамжин шилжинэ", ko: "뒷발이 밀고, 무게가 피벗 아크를 통해 이동한다" } },
        { type: "ANGLE",  value: { en: "Exit 45–90° to the side — out of every counter-punching line", mn: "45–90° талд гарах — бүх контр цохилтын шугамаас", ko: "옆으로 45–90° 탈출 — 모든 카운터 펀칭 라인에서 벗어난다" } },
        { type: "GUARD",  value: { en: "Guard maintained during pivot, resets clean on the new angle", mn: "Эргэлтийн үед guard байна, шинэ өнцөгт цэвэр дахин тохируулна", ko: "피벗 중 가드 유지, 새 각도에서 깔끔하게 리셋" } },
      ],
      explanation: {
        en: "Jab, then pivot on the lead foot ball — the rear foot pushes. You exit 45–90° sideways, out of any counter line, while the opponent is still processing your jab. One punch creates two results: damage and a free exit.",
        mn: "Жааб хийж, дараа нь урд хөлний бөмбөлөг дээр эргэх — арын хөл түлхэнэ. Өрсөлдөгч таны жааб-г боловсруулж байхад 45–90° тал руу, аливаа контрын шугамаас гарна. Нэг цохилт хоёр үр дүн авчирна: хохирол ба чөлөөт гарц.",
        ko: "잽을 던진 후 앞발 볼로 피벗 — 뒷발이 밀어준다. 상대가 아직 당신의 잽을 처리하는 동안 45–90° 옆으로, 어떤 카운터 라인에서도 벗어난다. 하나의 펀치가 두 가지 결과를 만든다: 데미지와 자유로운 탈출.",
      },
      bodyCue: {
        en: "Feel the rear foot pressing the floor to power the pivot — the lead foot ball should feel like a spinning post under you.",
        mn: "Арын хөл эргэлтэд хүч өгөхийн тулд шалыг дарахыг мэдрэ — урд хөлний бөмбөлөг доор нь эргэж буй тулгуур шиг мэдрэгдэх ёстой.",
        ko: "뒷발이 피벗에 파워를 주기 위해 바닥을 누르는 것을 느껴라 — 앞발 볼이 아래에서 회전하는 포스트처럼 느껴져야 한다.",
      },
      commonMistake: {
        en: "Pivoting on the heel instead of the ball of the foot. Heel pivots are slower, wider, and collapse the stance on exit.",
        mn: "Хөлний бөмбөлгийн оронд өсгийн дээр эргэх. Өсгийн эргэлт удаан, өргөн бөгөөд гарах үед байрлалыг нурааж унагана.",
        ko: "발 볼 대신 뒤꿈치로 피벗하는 것. 뒤꿈치 피벗은 더 느리고, 더 넓으며, 탈출 시 스탠스를 무너뜨린다.",
      },
      coachNotes: {
        en: "After your jab lands, the lead foot is already planted — use it as a post. Push off the rear foot, swivel. You exit the danger zone automatically.",
        mn: "Жааб буусны дараа урд хөл аль хэдийн тогтсон байна — үүнийг тулгуур болгон хэрэглэ. Арын хөлнөөс түлхэж, эрглэж. Аюулын бүсээс автоматаар гарна.",
        ko: "잽이 닿은 후 앞발은 이미 심어져 있다 — 이것을 포스트로 사용하라. 뒷발로 밀고 회전하라. 자동으로 위험 구역에서 벗어난다.",
      },
      drillSteps: [
        { en: "Shadow: throw jab, then pivot 45° left on lead foot ball — practice until smooth", mn: "Сүүдэр: жааб шидэж, дараа нь урд хөлний бөмбөлөг дээр 45° зүүн тийш эрглэх — жигдрэх хүртэл дасгал хий", ko: "섀도우: 잽을 던진 후 앞발 볼로 45° 왼쪽 피벗 — 부드러워질 때까지 연습" },
        { en: "Floor tape: mark target spots at 45° — jab from A, land feet at B consistently", mn: "Шалны тэмдэг: 45°-д зорилтот цэгүүдийг тэмдэглэ — A-аас жааб хийж, тогтмол B дээр хөл буулга", ko: "바닥 테이프: 45° 목표 지점 표시 — A에서 잽, 일관되게 B에 발 착지" },
        { en: "Pivot to attack: jab, pivot, immediate left hook from the new angle", mn: "Дайралтад эрглэх: жааб, эрглэх, шинэ өнцгөөс шууд зүүн хук", ko: "피벗 후 공격: 잽, 피벗, 새 각도에서 즉각적인 왼쪽 훅" },
        { en: "Partner: they throw single jab, you jab-and-exit 5 reps — they cannot reach your new position", mn: "Партнер: тэр нэг жааб шидэх, чи жааб-гарах 5 давталт — тэр шинэ байрлалд хүрч чадахгүй", ko: "파트너: 그들이 단일 잽을 던지면 당신은 잽-탈출 5회 — 그들은 당신의 새 위치에 도달할 수 없다" },
      ],
    },
    {
      title: "Float — Toes, Not Heels",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Weight permanently on balls of feet — heels never fully plant", mn: "Жин байнга хөлний бөмбөлөг дээр — өсгий хэзээ ч бүрэн тогтдоггүй", ko: "무게는 항상 발 볼에 — 뒤꿈치는 절대 완전히 닿지 않는다" } },
        { type: "WEIGHT", value: { en: "Slight forward bias — never heel-heavy or leaning back", mn: "Бага зэрэг урагш хазайлт — өсгийд хэтэрхий хүнд эсвэл арагш хазайхгүй", ko: "약간의 앞쪽 편향 — 뒤꿈치에 무겁거나 뒤로 기울지 않는다" } },
        { type: "ANGLE",  value: { en: "Zero re-weight delay = instant direction change in any direction", mn: "Жин дахин тохируулах хойшлол тэг = аль ч чиглэлд шууд чиглэл өөрчлөлт", ko: "재무게 지연 제로 = 어느 방향으로든 즉각적인 방향 전환" } },
        { type: "GUARD",  value: { en: "Relaxed guard — tension in the arms kills foot speed", mn: "Тайвшсан guard — гарын хурцадмал байдал хөлний хурдыг алана", ko: "릴렉스된 가드 — 팔의 긴장이 발 속도를 죽인다" } },
      ],
      explanation: {
        en: "Heel-weighted stance requires a re-weight step before any movement. Ball-of-foot stance has zero re-weight delay. That delay is what opponents time. Remove it permanently and their counter-timing stops working.",
        mn: "Өсгийд жинтэй байрлал нь аливаа хөдөлгөөнөөс өмнө жин дахин тохируулах алхам шаарддаг. Хөлний бөмбөлгийн байрлалд жин дахин тохируулах хойшлол тэг. Тэр хойшлол бол өрсөлдөгчид цаг тохируулдаг зүйл. Үүнийг бүрмөсөн арилгавал тэдний контр цагийн тохируулга ажиллахаа болино.",
        ko: "뒤꿈치 무게 스탠스는 어떤 움직임 전에도 재무게 단계가 필요하다. 발 볼 스탠스는 재무게 지연이 없다. 그 지연이 상대가 타이밍을 잡는 것이다. 영구적으로 제거하면 그들의 카운터 타이밍이 작동을 멈춘다.",
      },
      bodyCue: {
        en: "Feel light, like your heels could lift off at any moment — if your calves aren't slightly engaged, you're already too flat.",
        mn: "Хөнгөн мэдрэ, өсгий нь хэдийд ч өргөгдөж болох мэт — хөлийн тугалган булчин бага зэрэг идэвхтэй бус бол аль хэдийн хэтэрхий хавтгай байна.",
        ko: "가볍게 느껴라, 뒤꿈치가 언제든지 들릴 수 있을 것처럼 — 종아리가 약간 engage되어 있지 않다면 이미 너무 평평한 것이다.",
      },
      commonMistake: {
        en: "Heel-walking between combinations. Flat feet between punches kills reaction time exactly when you need to move instantly.",
        mn: "Комбинацуудын хооронд өсгийгээр алхах. Цохилтуудын хооронд хавтгай хөл нь яг шууд хөдлөх хэрэгтэй үед хариу үйлдлийн цагийг алана.",
        ko: "콤비네이션 사이에 뒤꿈치로 걷는 것. 펀치 사이의 평발은 즉시 움직여야 하는 바로 그 순간 반응 시간을 죽인다.",
      },
      coachNotes: {
        en: "Stand flat-footed and try a quick step. Now stand on the balls and try. That difference is what Ali had over everyone. Forward weight = zero reaction delay.",
        mn: "Хавтгай хөлтэй зогсоод хурдан алхахыг туршаа. Одоо бөмбөлөг дээр зогсоод туршаа. Тэр ялгаа бол Алигийн бүгдийнхээс давуу тал байсан зүйл. Урагш жин = тэг хариу хойшлол.",
        ko: "평발로 서서 빠른 스텝을 시도해라. 이제 발 볼로 서서 시도해라. 그 차이가 알리가 모든 이보다 앞섰던 것이다. 앞쪽 무게 = 반응 지연 제로.",
      },
      drillSteps: [
        { en: "Hold for 60 seconds on balls of feet — feel the calf and thigh engagement activate", mn: "Хөлний бөмбөлөг дээр 60 секунд барих — тугалга ба гуяны булчингийн идэвхжилтийг мэдрэх", ko: "발 볼로 60초 유지 — 종아리와 허벅지 engage 활성화를 느껴라" },
        { en: "Shadow with awareness: heels never fully touch during active movement phases", mn: "Мэдлэгтэйгээр сүүдэр: идэвхтэй хөдөлгөөний үед өсгий хэзээ ч бүрэн тулдаггүй", ko: "인식하며 섀도우: 활동적인 움직임 단계에서 뒤꿈치가 절대 완전히 닿지 않게" },
        { en: "Lateral shuffle 3 left / 3 right, no pause between direction changes", mn: "3 зүүн / 3 баруун хажуу шавшиглаа, чиглэл солих хооронд завсаргүй", ko: "좌 3 / 우 3 사이드 셔플, 방향 전환 사이 멈춤 없이" },
        { en: "20-jab flurry while maintaining toe-weight throughout — never let heels drop", mn: "20 жааб цаг алдалгүй хурд, туршлагын туршид хурууны жинг хадгалж — өсгийг хэзээ ч буулгахгүй", ko: "20잽 플러리 동안 발끝 무게 내내 유지 — 뒤꿈치가 절대 내려가지 않게" },
      ],
    },
    {
      title: "Snap & Retract",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Footwork stays active — no weight commitment on a jab", mn: "Хөлний ажил идэвхтэй байна — жааб дээр жин оруулахгүй", ko: "풋워크 활성 유지 — 잽에 무게를 실지 않는다" } },
        { type: "WEIGHT", value: { en: "Jab fires without forward weight transfer — stay ready to move", mn: "Жааб урагш жин шилжүүлэлтгүйгээр буудна — хөдлөхөд бэлэн байна", ko: "잽은 앞쪽 무게 이동 없이 발사 — 움직일 준비 유지" } },
        { type: "ANGLE",  value: { en: "Punch travels equal distance out and back — not a one-way trip", mn: "Цохилт тэнцүү зай гарч, буцна — нэг талын аялал биш", ko: "펀치는 나가고 돌아오는 거리가 같다 — 편도 여행이 아니다" } },
        { type: "GUARD",  value: { en: "Guard reforms before opponent can counter — retraction is defense", mn: "Өрсөлдөгч контр хийхээс өмнө guard дахин бүрдэнэ — татаж буцаах нь хамгаалалт", ko: "상대가 카운터하기 전에 가드가 복원된다 — 리트랙션은 방어다" } },
      ],
      explanation: {
        en: "Every punch is a round trip, not a one-way trip. The retraction must be equal in speed to the extension. Slow retraction means the guard is open during recovery. Fast retraction closes the guard before the opponent can exploit it.",
        mn: "Бүх цохилт нь нэг талын биш, зайлшгүй буцах аялал. Татаж буцаах нь сунгалттай хурдаараа тэнцүү байх ёстой. Удаан татаж буцаах нь нөхөн сэргэлтийн үед guard нээлттэй гэсэн үг. Хурдан татаж буцаах нь өрсөлдөгч ашиглахаас өмнө guard-г хаана.",
        ko: "모든 펀치는 편도가 아닌 왕복 여행이다. 리트랙션은 익스텐션과 동일한 속도여야 한다. 느린 리트랙션은 회복 중 가드가 열려 있다는 것을 의미한다. 빠른 리트랙션은 상대가 이용하기 전에 가드를 닫는다.",
      },
      bodyCue: {
        en: "Feel the recoil pulling your guard back — the snap home should feel like a rubber band releasing, not a conscious pull.",
        mn: "Гарын буцах таталт guard-г татаж буцааж байгааг мэдрэ — буцаж очих нь хэмжүүрт татаж биш, резинэн туузны суллагдсан шиг мэдрэгдэх ёстой.",
        ko: "반동이 가드를 뒤로 당기는 것을 느껴라 — 집으로 돌아오는 스냅은 의식적인 당김이 아니라 고무줄이 풀리는 것처럼 느껴져야 한다.",
      },
      commonMistake: {
        en: "Leaving the jab extended to admire where it landed. The moment of follow-through is when you're most exposed to counters.",
        mn: "Жааб буусан газрыг биширч сунгасан байдлаар үлдээх. Дагалт мөч нь контрод хамгийн ил гарсан мөч.",
        ko: "잽이 닿은 곳을 감상하기 위해 뻗은 채로 두는 것. 팔로우스루의 순간이 카운터에 가장 노출된 때이다.",
      },
      coachNotes: {
        en: "Train the retraction as hard as the extension. If your return is slow, your guard is open. Fast retraction = built-in counter defense.",
        mn: "Татаж буцаахыг сунгалттай адил хүчтэй дасгалжуул. Буцалт нь удаан бол guard нээлттэй. Хурдан татаж буцаах = суурилагдсан контр хамгаалалт.",
        ko: "리트랙션을 익스텐션만큼 열심히 훈련하라. 리턴이 느리면 가드가 열려 있다. 빠른 리트랙션 = 내장형 카운터 방어.",
      },
      drillSteps: [
        { en: "Speed bag: focus on retraction speed — return should match extension in timing", mn: "Хурдны уут: татаж буцаах хурдад анхаар — буцалт нь сунгалттай цагийн хувьд тохирох ёстой", ko: "스피드백: 리트랙션 속도에 집중 — 리턴은 익스텐션과 타이밍이 맞아야 한다" },
        { en: "Shadow: jab out, count retraction equal to extension — both halves are the same", mn: "Сүүдэр: жааб гарах, татаж буцаахыг сунгалттай тэнцүү тоо — хоёр хагас ижил", ko: "섀도우: 잽 아웃, 리트랙션을 익스텐션과 동일하게 카운트 — 두 절반이 같다" },
        { en: "Double-end bag: rebound timing forces fast retraction — use this daily", mn: "Хоёр үзүүрт уут: буцах цаг нь хурдан татаж буцаахыг албаддаг — үүнийг өдөр бүр хэрэглэ", ko: "더블엔드백: 리바운드 타이밍이 빠른 리트랙션을 강제한다 — 매일 사용하라" },
        { en: "Wall touch: touch wall with jab hand, retract before count '2' — measures reflex speed", mn: "Хана хүрэлт: жааб гараар хана хүрэх, '2' тоо хэлэхээс өмнө татаж буцаах — рефлексийн хурдыг хэмждэг", ko: "벽 터치: 잽 손으로 벽 터치, '2' 카운트 전에 리트랙트 — 반사 속도 측정" },
      ],
    },
  ],

  // ── Naoya Inoue ─────────────────────────────────────────────────────────────
  "naoya-inoue": [
    {
      title: "High-Low Switch",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Mid-range, feet stable — switching targets, not distance", mn: "Дунд зай, хөл тогтвортой — зорилтыг солих, зайг биш", ko: "미드레인지, 발 안정 — 목표를 바꾸는 것, 거리가 아니라" } },
        { type: "WEIGHT", value: { en: "Hip drives each punch independently — no combined load", mn: "Бүсэлхий бүр цохилтыг бие даан жолоодно — нийлмэл ачааллгүй", ko: "힙이 각 펀치를 독립적으로 구동한다 — 결합 로딩 없이" } },
        { type: "ANGLE",  value: { en: "Head shot draws guard up; body shot takes the exposed angle below", mn: "Толгойн цохилт guard-г дээш татна; биеийн цохилт доорх ил өнцгийг авна", ko: "헤드 샷이 가드를 위로 끌어올린다; 바디 샷이 아래 노출된 각도를 공략한다" } },
        { type: "GUARD",  value: { en: "Watch opponent's elbow rise — that's the entry signal to go low", mn: "Өрсөлдөгчийн тохойны өргөгдөхийг хара — тэр бол доошоо орох дохио", ko: "상대의 팔꿈치가 올라가는 것을 봐라 — 그것이 아래로 공략하는 진입 신호다" } },
      ],
      explanation: {
        en: "A genuine head threat forces the guard up. Two guards cannot coexist simultaneously. When the elbows rise, the body is exposed. The switch only works if the head punch is real — a fake won't produce a real guard response.",
        mn: "Жинхэнэ толгойн аюул guard-г дээш авч явна. Хоёр guard нэгэн зэрэг оршин тогтнож чадахгүй. Тохой өргөгдөхөд бие ил гарна. Шилжүүлэлт зөвхөн толгойн цохилт жинхэнэ бол ажиллана — хуурамч нь жинхэнэ guard хариу үйлдэл үүсгэхгүй.",
        ko: "진짜 헤드 위협은 가드를 위로 올린다. 두 개의 가드는 동시에 공존할 수 없다. 팔꿈치가 올라가면 바디가 노출된다. 스위치는 헤드 펀치가 진짜일 때만 작동한다 — 페이크는 진짜 가드 반응을 만들지 못한다.",
      },
      bodyCue: {
        en: "Feel your eyes tracking the opponent's guard movement — the body shot only fires when you see their elbows actually rising.",
        mn: "Нүд нь өрсөлдөгчийн guard хөдөлгөөнийг дагаж байгааг мэдрэ — биеийн цохилт зөвхөн тэдний тохой үнэхээр өргөгдөхийг харах үед л буудна.",
        ko: "눈이 상대의 가드 움직임을 추적하는 것을 느껴라 — 바디 샷은 그들의 팔꿈치가 실제로 올라가는 것을 볼 때만 발사된다.",
      },
      commonMistake: {
        en: "Throwing head-body as a preset combination regardless of guard response. Predetermined switches become patterns that experienced opponents read and counter.",
        mn: "Guard хариу үйлдлээс үл хамааран толгой-бие-г урьдчилан тогтоосон комбо болгон шидэх. Урьдчилан тогтоосон шилжүүлэлтүүд туршлагатай өрсөлдөгчид уншиж контр хийдэг загвар болдог.",
        ko: "가드 반응에 관계없이 헤드-바디를 사전 설정된 콤비네이션으로 던지는 것. 사전 결정된 스위치는 경험 많은 상대가 읽고 카운터하는 패턴이 된다.",
      },
      coachNotes: {
        en: "Make them commit to one zone, then attack the other. Head threatens, body opens. Body threatens, head opens. Practice both until the decision is automatic.",
        mn: "Нэг бүсэд бууж өгүүл, дараа нь нөгөөд довтол. Толгой заналхийлбэл, бие нээгдэнэ. Бие заналхийлбэл, толгой нээгдэнэ. Шийдвэр автомат болтол хоёуланг нь дасгалжуул.",
        ko: "그들을 한 구역에 전념하게 만들고 다른 구역을 공격하라. 헤드가 위협하면 바디가 열린다. 바디가 위협하면 헤드가 열린다. 결정이 자동화될 때까지 둘 다 연습하라.",
      },
      drillSteps: [
        { en: "Mitt drill: coach calls 'high' or 'low' mid-combination — boxer switches instantly", mn: "Пад дасгал: дасгалжуулагч комбо дундуур 'өндөр' эсвэл 'доор' дуудна — боксчин шууд шилжинэ", ko: "미트 드릴: 코치가 콤비네이션 중간에 '하이' 또는 '로우'를 외치면 — 복서가 즉시 전환" },
        { en: "Double jab: first to head, watch guard react, second drops to body on elbow rise", mn: "Давхар жааб: эхлээд толгой руу, guard хариу үйлдлийг хара, хоёр дахь нь тохой өргөгдөхөд биед буна", ko: "더블 잽: 첫 번째는 헤드로, 가드 반응 관찰, 두 번째는 팔꿈치 올라갈 때 바디로" },
        { en: "Shadow: every combination must switch levels at least once", mn: "Сүүдэр: бүх комбо дор хаяж нэг удаа түвшин солих ёстой", ko: "섀도우: 모든 콤비네이션은 최소 한 번 레벨을 전환해야 한다" },
        { en: "Heavy bag: tape high and low zones, alternate within each combination", mn: "Хүнд уут: өндөр ба доор бүсүүдийг тэмдэглэж, бүр комбо доторх ээлжлэлт", ko: "헤비백: 하이와 로우 존을 테이프로 표시하고, 각 콤비네이션 내에서 교대" },
      ],
    },
    {
      title: "Counter Right Hand",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Slip shifts rear foot outside — creates the counter platform", mn: "Зайлалт арын хөлийг гадна тийш шилжүүлнэ — контрын тавцан үүсгэнэ", ko: "슬립이 뒷발을 바깥으로 이동시킨다 — 카운터 플랫폼을 만든다" } },
        { type: "WEIGHT", value: { en: "Slip weight shifts outward → snaps back to power the counter", mn: "Зайлалтын жин гадна тийш шилжинэ → контрт хүч өгөхийн тулд буцаж хурдан хөдөлнө", ko: "슬립 무게가 바깥으로 이동 → 카운터에 파워를 주기 위해 스냅백" } },
        { type: "ANGLE",  value: { en: "Slip outside their jab, right hand fires through the center lane", mn: "Тэдний жааб-г гадна тийш зайл, баруун гар дундын зам дамжин буудна", ko: "잽 바깥으로 슬립, 오른손이 센터 레인을 통해 발사된다" } },
        { type: "GUARD",  value: { en: "Present slightly low guard to bait — tighten to slip before contact", mn: "Хоолой тавихын тулд бага зэрэг нам guard үзүүл — хүргэлтээс өмнө зайлахын тулд чангал", ko: "미끼를 위해 약간 낮은 가드를 제시 — 접촉 전 슬립하기 위해 조인다" } },
      ],
      explanation: {
        en: "Bait the jab by presenting a slightly low guard. The moment the jab commits, slip outside before contact and fire the right hand through the center — catching the opponent while they're mid-extension, guard not yet reformed.",
        mn: "Бага зэрэг нам guard үзүүлж жааб-г хоолой тав. Жааб бууж өгөх мөчид хүргэлтээс өмнө гадна тийш зайлж, баруун гарыг дундаар гаргах — өрсөлдөгчийг сунгалтын дундуур, guard одоогоор дахин бүрдээгүй байхад барих.",
        ko: "약간 낮은 가드를 제시하여 잽을 유인하라. 잽이 전념하는 순간 접촉 전에 바깥으로 슬립하고 오른손을 중앙으로 발사 — 상대가 익스텐션 중간에 있고 가드가 아직 복원되지 않은 상태를 잡는다.",
      },
      bodyCue: {
        en: "Feel your weight shifting outward during the slip — the counter should feel like releasing energy the slip already stored.",
        mn: "Зайлалтын үед жин гадна тийш шилжиж байгааг мэдрэ — контр нь зайлалт аль хэдийн хуримтлуулсан энергийг суллаж байгаа мэт мэдрэгдэх ёстой.",
        ko: "슬립 중 무게가 바깥으로 이동하는 것을 느껴라 — 카운터는 슬립이 이미 저장한 에너지를 해방하는 것처럼 느껴져야 한다.",
      },
      commonMistake: {
        en: "Slipping as the punch arrives rather than before it. You need to be outside before contact, not as contact happens — the timing gap is the entire point.",
        mn: "Цохилт ирэхийн өмнө биш ирэх үед зайлах. Хүргэлт болох үед биш хүргэлтээс өмнө гадна байх хэрэгтэй — цагийн зай бол бүх цэг.",
        ko: "펀치가 오기 전이 아닌 오는 때 슬립하는 것. 접촉이 일어날 때가 아니라 접촉 전에 밖에 있어야 한다 — 타이밍 갭이 전부다.",
      },
      coachNotes: {
        en: "Slip BEFORE the punch arrives. The timing gap creates safety. Practice until the slip is automatic — the counter is easy once the slip is timed.",
        mn: "Цохилт ирэхээс ӨМНӨ зайл. Цагийн зай аюулгүй байдал бүрдүүлнэ. Зайлалт автомат болтол дасгалжуул — зайлалтын цаг тохирсон үед контр хялбар.",
        ko: "펀치가 도착하기 전에 슬립하라. 타이밍 갭이 안전을 만든다. 슬립이 자동화될 때까지 연습하라 — 슬립 타이밍이 맞으면 카운터는 쉽다.",
      },
      drillSteps: [
        { en: "Partner slow jabs: slip outside 20 reps — focus only on timing, no counter yet", mn: "Партнер удаан жааб: гадна тийш 20 давталт зайл — зөвхөн цагт анхаар, контр хийхгүй", ko: "파트너 슬로우 잽: 아웃사이드 20회 슬립 — 타이밍에만 집중, 아직 카운터 없이" },
        { en: "Add counter: slip and return right hand simultaneously — partner absorbs on guard", mn: "Контр нэм: зайлж нэгэн зэрэг баруун гар буцааж гаргах — партнер guard дээр шингээнэ", ko: "카운터 추가: 슬립하며 동시에 오른손 리턴 — 파트너가 가드로 흡수" },
        { en: "Visualize the lane: when they extend, center opens — your right hand belongs there", mn: "Замыг дүрслэ: тэд сунгахад дунд нээгдэнэ — баруун гар чинь тэнд байх ёстой", ko: "레인을 시각화하라: 그들이 뻗을 때 중앙이 열린다 — 당신의 오른손이 거기 있어야 한다" },
        { en: "Speed progression: slow × 10, medium × 10, full speed × 10 across multiple sessions", mn: "Хурдны дэвшил: удаан × 10, дунд × 10, бүрэн хурд × 10 олон дасгалын туршид", ko: "속도 진행: 슬로우 × 10, 미디엄 × 10, 풀스피드 × 10 여러 세션에 걸쳐" },
      ],
    },
    {
      title: "Compact Hook, Close Range",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Inside range — body rotates on fixed feet, no stepping needed", mn: "Дотоод зай — бие тогтмол хөл дээр эргэнэ, алхах шаардлагагүй", ko: "인사이드 레인지 — 고정된 발 위에서 몸이 회전, 스텝 불필요" } },
        { type: "WEIGHT", value: { en: "Short hip burst — no full body uncoiling, no room for it", mn: "Богино бүсэлхийн тэсрэлт — бүтэн бие задрахгүй, зай байхгүй", ko: "짧은 힙 버스트 — 전체 몸 언코일링 없이, 그럴 공간 없음" } },
        { type: "ANGLE",  value: { en: "Elbow fixed at 90°, body turns the arc — arm just travels with it", mn: "Тохой 90°-д тогтмол, бие нумыг эргүүлнэ — гар зөвхөн хамт явна", ko: "팔꿈치 90°로 고정, 몸이 아크를 돌린다 — 팔은 그냥 함께 이동" } },
        { type: "GUARD",  value: { en: "Lead hand controls the space while hook loads from hip", mn: "Урд гар зайг хянах ба хук бүсэлхийгээс ачаалагдана", ko: "앞손이 공간을 컨트롤하며 훅이 힙에서 로딩된다" } },
      ],
      explanation: {
        en: "Inside range removes arm extension as a power source. The elbow stays fixed at 90° — body rotation carries the punch. 12 centimeters of travel, full rotational power from the trunk. The torso is the engine; the arm is just attached.",
        mn: "Дотоод зай гарны сунгалтыг хүч эх үүсвэр болгохыг арилгана. Тохой 90°-д тогтмол байна — биеийн эргэлт цохилтыг авч явна. 12 сантиметрийн аялал, их биеэс бүтэн эргэлтийн хүч. Их бие бол хөдөлгүүр; гар зөвхөн хавсаргасан.",
        ko: "인사이드 레인지는 팔 익스텐션을 파워 소스로 제거한다. 팔꿈치는 90°로 고정 — 몸의 회전이 펀치를 운반한다. 12센티미터 이동, 몸통에서 나오는 완전한 회전 파워. 몸통이 엔진이고 팔은 그냥 달려 있는 것이다.",
      },
      bodyCue: {
        en: "Feel your elbow staying at 90° as your body rotates — if the arm straightens, you've switched from rotation power to arm power.",
        mn: "Бие эргэх үед тохой 90°-д байгааг мэдрэ — хэрэв гар шулуун болвол эргэлтийн хүчнээс гарны хүч рүү шилжсэн байна.",
        ko: "몸이 회전할 때 팔꿈치가 90°에 있는 것을 느껴라 — 팔이 펴지면 회전 파워에서 팔 파워로 전환된 것이다.",
      },
      commonMistake: {
        en: "Trying to extend the hook at close range. Full arm extension at inside distance creates a pushing motion with no snap — all effort, no power.",
        mn: "Ойрын зайд хукийг сунгахыг оролдох. Дотоод зайд бүтэн гар сунгах нь ялигдалгүй түлхэлт хөдөлгөөн үүсгэнэ — бүх хүчин чармайлт, хүч байхгүй.",
        ko: "가까운 거리에서 훅을 뻗으려는 것. 인사이드 거리에서 풀 암 익스텐션은 스냅 없는 밀기 동작을 만든다 — 모든 노력, 파워 없음.",
      },
      coachNotes: {
        en: "Short hooks are a body rotation skill, not an arm skill. Fix elbow at 90°, body turns, fist follows. Imagine your torso carries the punch and your arm just happens to be attached.",
        mn: "Богино хук бол биеийн эргэлтийн ур чадвар, гарных биш. Тохойг 90°-д бэхэлж, бие эрглэх, нударга дагана. Их бие нь цохилтыг авч яваад гар нь зүгээр хавсаргасан байдаг гэж төсөөлөөрэй.",
        ko: "짧은 훅은 팔 기술이 아니라 몸 회전 기술이다. 팔꿈치를 90°로 고정하고, 몸이 돌고, 주먹이 따라온다. 몸통이 펀치를 운반하고 팔은 그냥 달려 있다고 상상하라.",
      },
      drillSteps: [
        { en: "Stand 3 inches from heavy bag, throw left hooks using only hip and shoulder rotation", mn: "Хүнд уутнаас 7 см зайд зогсоод, зөвхөн бүсэлхий ба мөрний эргэлтийг ашиглан зүүн хук шид", ko: "헤비백에서 7cm 떨어져 서서, 힙과 어깨 회전만 사용하여 왼쪽 훅을 던져라" },
        { en: "Elbow must stay at 90° — if it opens, you're using arm not body", mn: "Тохой 90°-д байх ёстой — хэрэв нээгдвэл гараа ашиглаж байна, биеийг биш", ko: "팔꿈치는 90°를 유지해야 한다 — 열리면 몸이 아닌 팔을 쓰고 있는 것이다" },
        { en: "Clinch position: from body clinch, rotate trunk and throw compact left hooks", mn: "Клинч байрлал: биеийн клинчаас их биеийг эрглэж богино зүүн хук шид", ko: "클린치 자세: 바디 클린치에서 몸통을 회전하고 컴팩트 왼쪽 훅 던지기" },
        { en: "Compare: full hook vs. compact hook on the bag — bag travel should be similar if technique is correct", mn: "Харьцуул: уут дээр бүтэн хук ба богино хук — техник зөв бол уутны хөдөлгөөн төстэй байх ёстой", ko: "비교: 백에서 풀 훅 vs. 컴팩트 훅 — 기술이 올바르면 백 이동이 비슷해야 한다" },
      ],
    },
  ],

  // ── Dmitry Bivol ────────────────────────────────────────────────────────────
  "dmitry-bivol": [
    {
      title: "Jab Rhythm & Reset",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Orthodox, mobile between jabs — step forward with each one", mn: "Ортодокс, жааб хооронд хөдөлгөөнтэй — бүрийнхтэй урагш алхана", ko: "오소독스, 잽 사이에 기동 — 매 잽마다 앞으로 스텝" } },
        { type: "WEIGHT", value: { en: "Light weight on lead foot — jab never fully commits weight", mn: "Урд хөл дээр хөнгөн жин — жааб хэзээ ч бүрэн жин оруулдаггүй", ko: "앞발에 가벼운 무게 — 잽은 절대 완전히 무게를 싣지 않는다" } },
        { type: "ANGLE",  value: { en: "Same jab line, different timing — rhythm not angle is the variable", mn: "Ижил жааб шугам, өөр цаг — хувьсах хэмжигдэхүүн нь өнцөг биш хэмнэл", ko: "같은 잽 라인, 다른 타이밍 — 변수는 각도가 아니라 리듬이다" } },
        { type: "GUARD",  value: { en: "Guard resets fully between rhythm jabs — no drop between", mn: "Guard хэмнэлийн жааб хооронд бүрэн дахин тохируулна — хооронд буулгахгүй", ko: "리듬 잽 사이에 가드 완전 리셋 — 사이에 드롭 없음" } },
      ],
      explanation: {
        en: "Establish a predictable jab rhythm for 2–3 punches, training the opponent's defense to expect the next one. Then break the timing — slightly late or early. The guard responds to pattern, not threat. When the pattern breaks, the guard resets on the wrong beat.",
        mn: "2–3 цохилтод урьдчилан таамаглах боломжтой жааб хэмнэл тогтоож, өрсөлдөгчийн хамгаалалтыг дараагийнхийг хүлээхэд сурга. Дараа нь цагийг тас — бага зэрэг хожим эсвэл эрт. Guard загварт хариу үйлдэл үзүүлнэ, аюулд биш. Загвар таслагдахад guard буруу цохилтонд дахин тохируулна.",
        ko: "2–3번의 펀치로 예측 가능한 잽 리듬을 확립하여 상대의 방어가 다음을 예상하도록 훈련시킨다. 그런 다음 타이밍을 깨뜨린다 — 약간 늦거나 이르게. 가드는 위협이 아니라 패턴에 반응한다. 패턴이 깨지면 가드가 잘못된 박자에 리셋된다.",
      },
      bodyCue: {
        en: "Feel the deliberate pause before the off-rhythm jab — that pause is the trap, not the jab itself.",
        mn: "Хэмнэлээс гарсан жааб-аас өмнөх санаатай завсарлагааг мэдрэ — тэр завсарлагаа бол хоолой, жааб биш.",
        ko: "리듬을 벗어난 잽 전의 의도적인 멈춤을 느껴라 — 그 멈춤이 함정이지, 잽 자체가 아니다.",
      },
      commonMistake: {
        en: "Changing the power of the jabs to signal the 'real' one. Rhythm disruption is about timing variation only — power changes are visible and telegraphed.",
        mn: "'Жинхэнэ'-ийг дохиолохын тулд жааб-ын хүчийг өөрчлөх. Хэмнэлийн тасалдал нь зөвхөн цагийн хувьсалтын тухай — хүчний өөрчлөлт харагддаг бөгөөд телеграфлагддаг.",
        ko: "'진짜'를 신호하기 위해 잽의 파워를 바꾸는 것. 리듬 파괴는 타이밍 변화에 관한 것뿐 — 파워 변화는 눈에 보이고 예고된다.",
      },
      coachNotes: {
        en: "Rhythm is a trap. Establish a beat, then break it once. The opponent's body memorizes the rhythm — be one punch off-pattern when they're least ready.",
        mn: "Хэмнэл бол хоолой. Цохилтыг тогтоож, дараа нь нэг удаа тасал. Өрсөлдөгчийн бие хэмнэлийг цээжлэнэ — тэд хамгийн бага бэлтэй үед нэг цохилт загвараас гар.",
        ko: "리듬은 함정이다. 박자를 확립하고 한 번 깨뜨려라. 상대의 몸이 리듬을 암기한다 — 그들이 가장 준비되지 않은 때 패턴에서 한 펀치 벗어나라.",
      },
      drillSteps: [
        { en: "Count jabs: 1-2-3 normal pace, PAUSE, 4th jab on the reset — feel the gap work", mn: "Жааб тоо: 1-2-3 хэвийн хурд, ЗОГС, 4 дэх жааб дахин тохируулалтаар — завсарыг ажиллахыг мэдрэх", ko: "잽 카운트: 1-2-3 보통 속도, 멈춤, 4번째 잽을 리셋에 — 갭이 작동하는 것을 느껴라" },
        { en: "Speed variation: slow-slow-fast or fast-fast-SLOW — vary without any body telegraph", mn: "Хурдны хувьсалт: удаан-удаан-хурдан эсвэл хурдан-хурдан-УДААН — ямар ч биеийн телеграфгүйгээр хувьсга", ko: "속도 변화: 슬로-슬로-패스트 또는 패스트-패스트-슬로우 — 어떤 몸 예고 없이 변화" },
        { en: "Double jab: land first, feel opponent react, THEN throw second at new guard position", mn: "Давхар жааб: эхлээд буу, өрсөлдөгчийн хариу үйлдлийг мэдрэх, ДАРАА нь шинэ guard байрлалд хоёр дахийг шид", ko: "더블 잽: 먼저 착지, 상대 반응 느끼기, 그다음 새 가드 위치에 두 번째 던지기" },
        { en: "Partner: they try to counter-time your jabs — vary rhythm until they consistently miss", mn: "Партнер: тэд жааб-ынхаа эсрэг цаг тохируулахыг оролдоно — тэд тогтмол алдах хүртэл хэмнэлийг хувьсга", ko: "파트너: 그들이 당신의 잽을 카운터-타이밍하려 한다 — 그들이 일관되게 놓칠 때까지 리듬 변화" },
      ],
    },
    {
      title: "Guard Recovery Movement",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Lateral step accompanies every guard reset — always moving", mn: "Хажуу алхам бүр guard дахин тохируулалтыг дагана — байнга хөдөлж байна", ko: "모든 가드 리셋에 사이드 스텝이 동반된다 — 항상 움직인다" } },
        { type: "WEIGHT", value: { en: "Step left or right — direction doesn't matter, movement does", mn: "Зүүн эсвэл баруун алхах — чиглэл хамаагүй, хөдөлгөөн хамааралтай", ko: "왼쪽 또는 오른쪽 스텝 — 방향은 상관없다, 움직임이 중요하다" } },
        { type: "ANGLE",  value: { en: "Exit laterally not backward — stay at range while recovering", mn: "Арагш биш хажуу тийш гарах — нөхөн сэргэж байхдаа зайд байх", ko: "뒤로가 아닌 옆으로 탈출 — 회복 중 레인지 유지" } },
        { type: "GUARD",  value: { en: "Arms return to guard during the step, not after it", mn: "Гарууд алхалтын үед guard руу буцна, дараа нь биш", ko: "팔이 스텝 중에 가드로 돌아온다, 그 이후가 아니라" } },
      ],
      explanation: {
        en: "After every combination, move laterally while the guard returns. Never stand still to reset. The recovery phase is the most vulnerable moment — moving during it turns a stationary target into a moving one at zero extra cost.",
        mn: "Бүр комбо-ны дараа guard буцаж байхад хажуу тийш хөдөл. Дахин тохируулахын тулд хэзээ ч зогсонги байж болохгүй. Нөхөн сэргэлтийн үе бол хамгийн эмзэг мөч — энэ үед хөдлөх нь зогсонги зорилтыг нэмэлт зардалгүйгээр хөдлөгч зорилт болгодог.",
        ko: "모든 콤비네이션 후 가드가 돌아오는 동안 옆으로 이동하라. 리셋을 위해 절대 가만히 서 있지 마라. 회복 단계가 가장 취약한 순간이다 — 그 중에 움직이면 고정 목표물을 추가 비용 없이 움직이는 목표물로 전환한다.",
      },
      bodyCue: {
        en: "Feel your feet moving as the last punch retracts — the step should overlap with the arm returning, not follow it.",
        mn: "Сүүлчийн цохилт татагдах үед хөл хөдөлж байгааг мэдрэ — алхам нь гар буцахтай давхцах ёстой, дагаж биш.",
        ko: "마지막 펀치가 리트랙트될 때 발이 움직이는 것을 느껴라 — 스텝은 팔이 돌아오는 것과 겹쳐야 한다, 그것을 따라가는 것이 아니라.",
      },
      commonMistake: {
        en: "Resetting guard while standing still. Flat feet after a combination is an open invitation to counter during your most vulnerable moment.",
        mn: "Зогсонги байдлаар guard дахин тохируулах. Комбо-ны дараах хавтгай хөл бол хамгийн эмзэг мөчид контр хийхийг нээлттэй урилга.",
        ko: "서 있는 채로 가드를 리셋하는 것. 콤비네이션 후 평발은 가장 취약한 순간에 카운터를 초대하는 것이다.",
      },
      coachNotes: {
        en: "Build the habit of moving left OR right as the last punch retracts. Never be in the same spot after a combination. Footwork is the period at the end of every sentence.",
        mn: "Сүүлчийн цохилт татагдах үед зүүн ЭСВЭЛ баруун тийш хөдлөх дадал бий болго. Комбо-ны дараа хэзээ ч нэг газарт байж болохгүй. Хөлний ажил бол бүр өгүүлбэрийн эцэст цэг.",
        ko: "마지막 펀치가 리트랙트될 때 왼쪽 또는 오른쪽으로 움직이는 습관을 만들어라. 콤비네이션 후 절대 같은 자리에 있지 마라. 풋워크는 모든 문장 끝의 마침표다.",
      },
      drillSteps: [
        { en: "Shadow: throw 3-punch combo, then mandatory 2 lateral steps before stopping", mn: "Сүүдэр: 3 цохилтын комбо шидэж, дараа нь зогсохоос өмнө заавал 2 хажуу алхам", ko: "섀도우: 3펀치 콤보 던지고, 멈추기 전 필수 2 사이드 스텝" },
        { en: "Heavy bag: hit the bag, push off, take 2–3 steps while guard resets", mn: "Хүнд уут: уутыг цох, түлхэж гарах, guard дахин тохируулах явцад 2–3 алхам хий", ko: "헤비백: 백을 치고, 밀어내고, 가드 리셋하면서 2–3 스텝" },
        { en: "Partner: after each combination, move before partner can touch you", mn: "Партнер: бүр комбо-ны дараа партнер хүрэхийн өмнө хөдөл", ko: "파트너: 각 콤비네이션 후 파트너가 닿기 전에 움직여라" },
        { en: "Timer drill: 3 seconds hitting, 1 second moving — never stationary during the off-second", mn: "Цагийн дасгал: 3 секунд цохих, 1 секунд хөдлөх — хоёрдахь секундын турш хэзээ ч зогсонги байхгүй", ko: "타이머 드릴: 3초 타격, 1초 이동 — 휴식 초 동안 절대 정지 없음" },
      ],
    },
    {
      title: "Optimal Range Discipline",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Footwork calibrates range — step in if too far, back if too close", mn: "Хөлний ажил зайг тохируулна — хэтэрхий хол бол орох, хэтэрхий ойр бол арагш", ko: "풋워크가 레인지를 조율한다 — 너무 멀면 들어가고, 너무 가까우면 물러선다" } },
        { type: "WEIGHT", value: { en: "Balanced weight enables instant recalibration either direction", mn: "Тэнцвэртэй жин аль ч чиглэлд шуурхай дахин тохируулахыг боломжтой болгодог", ko: "균형 잡힌 무게가 어느 방향으로든 즉각적인 재조율을 가능하게 한다" } },
        { type: "ANGLE",  value: { en: "Stay at center line at optimal distance — no chasing needed", mn: "Оновчтой зайд дундын шугаманд байх — хөөх шаардлагагүй", ko: "최적 거리에서 센터라인 유지 — 추격 불필요" } },
        { type: "GUARD",  value: { en: "Active guard at all times — range control removes the need to slip", mn: "Байнга идэвхтэй guard — зайн хяналт зайлах хэрэгцээг арилгана", ko: "항상 활성 가드 — 레인지 컨트롤이 슬립의 필요성을 제거한다" } },
      ],
      explanation: {
        en: "There is exactly one distance where jab and cross both land at full extension and full power. Too close or too far and both punches lose effectiveness. All footwork is about maintaining that one distance continuously.",
        mn: "Жааб ба кросс хоёулаа бүтэн сунгалт, бүтэн хүчтэйгээр буудаг яг нэг зай байдаг. Хэтэрхий ойр эсвэл хол бол хоёр цохилт хоёулаа үр нөлөөгөө алдана. Бүх хөлний ажил тэр нэг зайг тасралтгүй хадгалах тухай.",
        ko: "잽과 크로스 모두 풀 익스텐션과 풀 파워로 닿는 정확히 하나의 거리가 있다. 너무 가깝거나 멀면 두 펀치 모두 효과를 잃는다. 모든 풋워크는 그 하나의 거리를 지속적으로 유지하는 것이다.",
      },
      bodyCue: {
        en: "Feel the tension between staying at optimal range and the instinct to chase or retreat — consciously hold the gap against both impulses.",
        mn: "Оновчтой зайд байх ба хөөх эсвэл ухрах хандлагын хооронд хурцадмал байдлыг мэдрэ — хоёр импульсын эсрэг завсарыг свободно барь.",
        ko: "최적 거리에 머무르는 것과 추격하거나 후퇴하는 본능 사이의 긴장을 느껴라 — 두 충동에 맞서 의식적으로 간격을 유지하라.",
      },
      commonMistake: {
        en: "Chasing the opponent when they back up. Abandoning optimal range to stay close changes your punch angles and forces you to punch while stepping, which removes body weight from the punch.",
        mn: "Өрсөлдөгч ухрах үед хөөх. Ойрхон байхын тулд оновчтой зайг орхих нь цохилтын өнцгийг өөрчлөх бөгөөд алхах явцад цохиход хүргэдэг, энэ нь биеийн жинг цохилтоос арилгадаг.",
        ko: "상대가 물러설 때 추격하는 것. 가까이 있으려고 최적 거리를 포기하면 펀치 각도가 바뀌고 스텝하면서 펀치를 날리게 되어 펀치에서 체중이 빠진다.",
      },
      coachNotes: {
        en: "Find your range: extend your jab fully — where it just reaches is your distance. Train footwork to maintain that gap automatically. When they close, step back. When they retreat, step in. Equal.",
        mn: "Зайгаа ол: жааб-аа бүрэн сун — яг хүрэх газар чинь зай чинь. Тэр завсарыг автоматаар хадгалахын тулд хөлний ажил дасгалжуул. Тэд дөхөхөд арагш алхах. Тэд ухрахад орох. Тэнцүү.",
        ko: "거리를 찾아라: 잽을 완전히 뻗어라 — 막 닿는 곳이 당신의 거리다. 그 간격을 자동으로 유지하도록 풋워크를 훈련하라. 그들이 붙으면 뒤로 스텝. 그들이 물러서면 들어가라. 동등하게.",
      },
      drillSteps: [
        { en: "Range finder: extend jab fully, mark where fist lands — that distance is your floor", mn: "Зай олгогч: жааб-аа бүрэн сун, нударга буух газрыг тэмдэглэ — тэр зай чинь суурь", ko: "레인지 파인더: 잽을 완전히 뻗고, 주먹이 닿는 곳을 표시 — 그 거리가 당신의 기준" },
        { en: "Partner: maintain optimal range while they actively try to change distance for 2 minutes", mn: "Партнер: тэд идэвхтэйгээр зайг өөрчлөхийг оролдох явцад 2 минутын турш оновчтой зайг хадгал", ko: "파트너: 그들이 2분 동안 거리를 바꾸려 적극적으로 시도하는 동안 최적 거리 유지" },
        { en: "Small room drill: stay at jab range throughout — no wild hooks, only ranged shots", mn: "Жижиг өрөөний дасгал: туршлагын туршид жааб зайд байх — зэрлэг хук хийхгүй, зөвхөн зайн цохилт", ko: "좁은 공간 드릴: 내내 잽 레인지 유지 — 와일드 훅 없이, 레인지 샷만" },
        { en: "Shadow box at constant imaginary distance for 3-minute rounds — feel the range discipline", mn: "3 минутын раунд туршид байнгын хийсвэр зайд сүүдэр боксло — зайн хаталтыг мэдрэх", ko: "3분 라운드 동안 일정한 가상 거리에서 섀도우 박스 — 레인지 규율을 느껴라" },
      ],
    },
  ],

  // ── Vasyl Lomachenko ────────────────────────────────────────────────────────
  "vasyl-lomachenko": [
    {
      title: "Outside Foot Entry",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Right foot plants outside their lead foot — this IS the entry", mn: "Баруун хөл тэдний урд хөлний гадна тавигдана — энэ бол орох хөдөлгөөн", ko: "오른발이 그들의 앞발 바깥에 심어진다 — 이것이 진입이다" } },
        { type: "WEIGHT", value: { en: "Weight transfers onto outside foot naturally on landing", mn: "Жин буухад байгалиараа гадна хөл рүү шилжинэ", ko: "착지 시 자연스럽게 바깥 발로 무게가 이동한다" } },
        { type: "ANGLE",  value: { en: "Outside foot closes their cross angle, opens center for left straight", mn: "Гадна хөл тэдний кросс өнцгийг хаах бөгөөд дундыг зүүн шулуун цохилтонд нээнэ", ko: "바깥 발이 그들의 크로스 각도를 닫고, 왼쪽 스트레이트를 위한 중앙을 연다" } },
        { type: "GUARD",  value: { en: "Guard maintained during the foot placement — no drop to step", mn: "Хөл тавих үед guard байна — алхахын тулд буулгахгүй", ko: "발 배치 중 가드 유지 — 스텝을 위해 내리지 않는다" } },
      ],
      explanation: {
        en: "Right foot outside their lead foot: one step that removes their cross angle and opens your left straight lane. Foot position is punch permission. That placement gives you the best punch and removes their most dangerous one — all in one movement.",
        mn: "Баруун хөл тэдний урд хөлний гадна: тэдний кросс өнцгийг арилгаж, зүүн шулуун замыг нээдэг нэг алхам. Хөлний байрлал бол цохилтын зөвшөөрөл. Тэр байршил таньд хамгийн сайн цохилтыг өгч, тэдний хамгийн аюултай цохилтыг арилгадаг — бүгдийг нэг хөдөлгөөнд.",
        ko: "오른발이 그들의 앞발 바깥에: 그들의 크로스 각도를 제거하고 당신의 왼쪽 스트레이트 레인을 여는 하나의 스텝. 발 위치가 펀치 허가다. 그 배치가 당신에게 최고의 펀치를 주고 그들의 가장 위험한 펀치를 제거한다 — 하나의 동작으로.",
      },
      bodyCue: {
        en: "Feel your right foot fully clear of their lead foot before any punch — if it's not fully outside, don't throw.",
        mn: "Аливаа цохилтоос өмнө баруун хөл тэдний урд хөлнөөс бүрэн гарсаныг мэдрэ — бүрэн гадна бус бол шидэлгүй.",
        ko: "어떤 펀치 전에도 오른발이 그들의 앞발을 완전히 벗어났는지 느껴라 — 완전히 바깥에 있지 않으면 던지지 마라.",
      },
      commonMistake: {
        en: "Stepping beside their foot rather than outside it. 'Beside' keeps you in their cross line. 'Outside' removes their cross angle entirely — the difference is a few centimeters with major consequences.",
        mn: "Гадна биш хажуу нь алхах. 'Хажуу' чамайг тэдний кросс шугамд байлгана. 'Гадна' нь тэдний кросс өнцгийг бүрэн арилгана — ялгаа нь чухал үр дагавартай хэдхэн сантиметр.",
        ko: "바깥이 아닌 옆에 스텝하는 것. '옆'은 당신을 그들의 크로스 라인에 두는 것이다. '바깥'은 그들의 크로스 각도를 완전히 제거한다 — 차이는 몇 센티미터지만 결과는 크다.",
      },
      coachNotes: {
        en: "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place the foot first, always, before throwing anything.",
        mn: "Хөлний байрлал бол цохилтын зөвшөөрөл. Гадна хөл = зүүн шулуун цэвэр. Дотор хөл = тэдний аюулын бүсэд байна. Аливаа юм шидэхээс өмнө үргэлж эхлээд хөлийг тав.",
        ko: "발 위치가 펀치 허가다. 바깥 발 = 왼쪽 스트레이트가 클리어. 안쪽 발 = 그들의 위험 구역에 있는 것. 어떤 것을 던지기 전에 항상, 먼저 발을 놓아라.",
      },
      drillSteps: [
        { en: "Against partner: practice only stepping outside their foot 20 reps — no punch yet", mn: "Партнертэй: зөвхөн тэдний хөлний гадна алхах 20 давталт дасгал — цохилтгүй", ko: "파트너 상대: 그들의 발 바깥으로 스텝하는 것만 20회 연습 — 아직 펀치 없이" },
        { en: "Add the punch: outside foot placement, then left straight down the center", mn: "Цохилт нэм: гадна хөлний байршил, дараа нь дундаар зүүн шулуун", ko: "펀치 추가: 바깥 발 배치 후 센터로 왼쪽 스트레이트" },
        { en: "Partner check: after foot placement, partner tries their right cross — it should miss cleanly", mn: "Партнер шалгалт: хөл байрлуулсны дараа партнер баруун кросс оролдоно — цэвэр алдах ёстой", ko: "파트너 체크: 발 배치 후 파트너가 오른쪽 크로스 시도 — 깔끔하게 빗나가야 한다" },
        { en: "Speed entry: from distance, explosive step to outside position, immediate left straight", mn: "Хурдан орох: зайнаас гадна байрлал руу тэсрэлтийн алхам, шууд зүүн шулуун", ko: "스피드 진입: 거리에서 바깥 위치로 폭발적 스텝, 즉각적인 왼쪽 스트레이트" },
      ],
    },
    {
      title: "Angle Change Mid-Combination",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Lead foot pivots between punches — this is what creates the angle", mn: "Урд хөл цохилтуудын хооронд эрглэнэ — энэ нь өнцгийг бүтээдэг зүйл", ko: "앞발이 펀치 사이에 피벗한다 — 이것이 각도를 만드는 것이다" } },
        { type: "WEIGHT", value: { en: "Weight shifts with each pivot to maintain power on new angles", mn: "Жин бүр эргэлтийн хамт шилжиж, шинэ өнцөгт хүч хадгална", ko: "매 피벗마다 무게가 이동하여 새 각도에서 파워를 유지한다" } },
        { type: "ANGLE",  value: { en: "Each punch in the combination arrives from a different direction", mn: "Комбо-н бүр цохилт өөр чиглэлээс ирнэ", ko: "콤비네이션의 각 펀치는 다른 방향에서 도착한다" } },
        { type: "GUARD",  value: { en: "Guard maintained during pivots — punching doesn't stop guarding", mn: "Эргэлтийн үед guard байна — цохих нь хамгаалалтыг зогсоодоггүй", ko: "피벗 중 가드 유지 — 펀칭이 가딩을 멈추지 않는다" } },
      ],
      explanation: {
        en: "Guards face one direction. Multiple angles require multiple adjustments, and no one can make two adjustments simultaneously. A pivot between punches means the combination arrives from different directions — the defense is always one position behind.",
        mn: "Guard нэг чиглэлд нүүрлэнэ. Олон өнцөг олон тохируулга шаарддаг бөгөөд хэн ч нэгэн зэрэг хоёр тохируулга хийж чадахгүй. Цохилтуудын хооронд эргэлт нь комбо өөр чиглэлээс ирнэ гэсэн үг — хамгаалалт үргэлж нэг байрлалаар хоцорно.",
        ko: "가드는 한 방향을 향한다. 여러 각도는 여러 조정이 필요하고, 누구도 두 가지 조정을 동시에 할 수 없다. 펀치 사이의 피벗은 콤비네이션이 다른 방향에서 도착한다는 것을 의미한다 — 방어는 항상 한 위치 뒤처진다.",
      },
      bodyCue: {
        en: "Feel the lead foot pivoting between punches — if you're not feeling the pivot, you're punching from a fixed position and defeating the purpose.",
        mn: "Цохилтуудын хооронд урд хөл эрглэж байгааг мэдрэ — эргэлтийг мэдэрч чадахгүй бол тогтмол байрлалаас цохиж зорилгыг устгаж байна.",
        ko: "펀치 사이에 앞발이 피벗하는 것을 느껴라 — 피벗을 느끼지 못하면 고정 위치에서 펀칭하여 목적을 무산시키는 것이다.",
      },
      commonMistake: {
        en: "Punching then pivoting as two separate actions. The pivot must happen during the combination, not as a reset after it. Sequential is too slow to create the overlap that makes this work.",
        mn: "Цохих дараа эрглэхийг хоёр тусдаа үйлдэл болгох. Эргэлт комбо-ын дундуур болох ёстой, дараа нь дахин тохируулалт болгон биш. Дараалсан нь энэ ажлыг хийдэг давхцлыг бий болгоход хэтэрхий удаан.",
        ko: "펀치 후 피벗을 두 개의 별도 동작으로 하는 것. 피벗은 콤비네이션 후 리셋이 아니라 콤비네이션 중에 일어나야 한다. 순차적은 이것을 작동시키는 오버랩을 만들기에 너무 느리다.",
      },
      coachNotes: {
        en: "Throw a 1-2 but pivot your lead foot 45° between the jab and cross. The cross arrives from a different angle. Same combination, two directions — the opponent needs two different guards.",
        mn: "1-2 шид гэхдээ жааб ба кросс хооронд урд хөлийг 45° эрглэ. Кросс өөр өнцгөөс ирнэ. Ижил комбо, хоёр чиглэл — өрсөлдөгч хоёр өөр guard хэрэгтэй.",
        ko: "1-2를 던지되 잽과 크로스 사이에 앞발을 45° 피벗하라. 크로스가 다른 각도에서 도착한다. 같은 콤비네이션, 두 방향 — 상대는 두 개의 다른 가드가 필요하다.",
      },
      drillSteps: [
        { en: "Shadow: 1-2 with 15° pivot between punches — practice until pivot feels natural within the flow", mn: "Сүүдэр: цохилтуудын хооронд 15° эргэлттэй 1-2 — эргэлт урсгал дотор байгалийн мэт мэдрэгдэх хүртэл дасгал хий", ko: "섀도우: 펀치 사이에 15° 피벗이 있는 1-2 — 피벗이 흐름 안에서 자연스럽게 느껴질 때까지 연습" },
        { en: "Heavy bag: hit from front, pivot 45°, hit again, pivot 90° — same combination from 3 positions", mn: "Хүнд уут: өмнөөс цох, 45° эрглэх, дахин цох, 90° эрглэх — 3 байрлалаас ижил комбо", ko: "헤비백: 앞에서 치고, 45° 피벗, 다시 치고, 90° 피벗 — 3개 위치에서 같은 콤비네이션" },
        { en: "Slow-motion partner: punch from 5 different positions around them in one flow", mn: "Удаан хөдөлгөөнтэй партнер: нэг урсгалд тэдний эргэн тойрны 5 өөр байрлалаас цох", ko: "슬로모션 파트너: 하나의 흐름으로 그들 주변 5개 다른 위치에서 펀치" },
        { en: "Speed build: 1 minute constant angle changes with guard maintained throughout", mn: "Хурд нэмэх: 1 минут тасралтгүй өнцгийн өөрчлөлт, туршлагын туршид guard хадгалж", ko: "속도 향상: 가드를 내내 유지하며 1분 지속적 각도 변화" },
      ],
    },
    {
      title: "Direction Change Feint",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Commit to one direction, read opponent weight shift, instantly reverse", mn: "Нэг чиглэлд бууж өг, өрсөлдөгчийн жингийн шилжилтийг унш, шуурхай эсрэгрүү эрглэ", ko: "한 방향에 전념하고, 상대 무게 이동을 읽고, 즉시 역방향으로" } },
        { type: "WEIGHT", value: { en: "Begin weight loading in feint direction, then snap back the opposite", mn: "Хуурамч чиглэлд жин ачааллаж эхлэх, дараа нь эсрэгрүү хурдан буцаах", ko: "페인트 방향으로 무게 로딩을 시작하고, 반대로 스냅백" } },
        { type: "ANGLE",  value: { en: "Feint line and real line should be 90° apart minimum to create gap", mn: "Хуурамч шугам ба жинхэнэ шугам завсар бий болгохын тулд хамгийн бага 90° зайтай байх ёстой", ko: "페인트 라인과 실제 라인은 갭을 만들기 위해 최소 90° 떨어져야 한다" } },
        { type: "GUARD",  value: { en: "Guard stays up during feints — don't drop arms while misdirecting", mn: "Хуурамч хөдөлгөөний үед guard өндөр байна — буруу чиглэлд оруулах явцад гар буулгахгүй", ko: "페인트 중 가드 올린 상태 유지 — 오도하는 동안 팔을 내리지 않는다" } },
      ],
      explanation: {
        en: "Movement creates commitment. When an opponent chases you left, their weight loads left. The moment that weight loads, reverse direction — their own momentum is now working against them. You arrive at the new position before their feet can adjust.",
        mn: "Хөдөлгөөн бууж өгөлтийг бий болгодог. Өрсөлдөгч зүүн тийш хөөхөд тэдний жин зүүн тийш ачаалагдана. Тэр жин ачаалагдах мөчид чиглэлийг эсрэгрүү эрглэ — тэдний өөрийн хурд одоо тэдний эсрэг ажиллаж байна. Тэдний хөл тохируулахаас өмнө шинэ байрлалд хүрнэ.",
        ko: "움직임이 전념을 만든다. 상대가 왼쪽으로 쫓아오면 그들의 무게가 왼쪽으로 로딩된다. 그 무게가 로딩되는 순간 방향을 바꿔라 — 그들 자신의 모멘텀이 이제 그들에게 불리하게 작용한다. 그들의 발이 조정하기 전에 당신은 새 위치에 도달한다.",
      },
      bodyCue: {
        en: "Feel the opponent's weight pressure against you in the feint direction — that resistance is your signal to reverse.",
        mn: "Хуурамч чиглэлд өрсөлдөгчийн жингийн дарлалтыг мэдрэ — тэр эсэргүүцэл бол эсрэгрүү эрглэх дохио.",
        ko: "페인트 방향에서 상대의 무게 압력을 느껴라 — 그 저항이 역방향의 신호다.",
      },
      commonMistake: {
        en: "Changing direction before the opponent has committed weight. Reverse too early and it's just a shuffle with no effect. Wait for their weight to load — then reverse.",
        mn: "Өрсөлдөгч жин бууж өгөхөөс өмнө чиглэл өөрчлөх. Хэтэрхий эрт эсрэгрүү эрглэвэл нөлөөгүй зүгээр шавшиглаа. Тэдний жин ачаалагдахыг хүлээ — дараа нь эрглэ.",
        ko: "상대가 무게를 실기 전에 방향을 바꾸는 것. 너무 일찍 역방향으로 가면 효과 없는 셔플일 뿐이다. 그들의 무게가 로딩될 때까지 기다려라 — 그다음 역방향으로.",
      },
      coachNotes: {
        en: "Movement creates commitment. When they chase you left, their weight loads left. The moment you feel that load, go right. Their own momentum becomes your opening.",
        mn: "Хөдөлгөөн бууж өгөлтийг бий болгодог. Тэд зүүн тийш хөөхөд тэдний жин зүүн тийш ачаалагдана. Тэр ачааллыг мэдрэх мөчид баруун тийш яв. Тэдний өөрийн хурд таны нээлт болно.",
        ko: "움직임이 전념을 만든다. 그들이 왼쪽으로 쫓아오면 무게가 왼쪽으로 로딩된다. 그 로딩을 느끼는 순간 오른쪽으로 가라. 그들 자신의 모멘텀이 당신의 오프닝이 된다.",
      },
      drillSteps: [
        { en: "Solo: shuffle left 3, immediately right 3 — 50 reps, no hesitation between directions", mn: "Ганцаараа: 3 зүүн шавшиглаа, тэр даруй 3 баруун — 50 давталт, чиглэлүүдийн хооронд эргэлзэлгүй", ko: "솔로: 왼쪽 3 셔플, 즉시 오른쪽 3 — 50회, 방향 사이 망설임 없이" },
        { en: "Add body language: lean left before going right, sell the direction before reversing", mn: "Биеийн хэл нэм: баруун тийш явахаасаа өмнө зүүн тийш хазай, эсрэгрүү эрглэхийн өмнө чиглэлийг зар", ko: "바디 랭귀지 추가: 오른쪽으로 가기 전 왼쪽으로 기울고, 역방향 전에 방향을 팔아라" },
        { en: "Partner: they must follow your movement — read when their weight commits, then change", mn: "Партнер: тэд хөдөлгөөнийг чинийг дагах ёстой — тэдний жин бууж өгөхийг унш, дараа нь өөрчил", ko: "파트너: 그들이 당신의 움직임을 따라야 한다 — 그들의 무게가 전념할 때 읽고, 그다음 전환" },
        { en: "Apply to sparring: feint and move first, create openings through misdirection before punching", mn: "Спаррингт хэрэглэ: эхлээд хуурамч хөдөлгөөн хийж хөдөл, цохихоос өмнө буруу чиглэлээр нээлтүүд бий болго", ko: "스파링에 적용: 먼저 페인트하고 움직여라, 펀칭 전에 오도를 통해 오프닝을 만들어라" },
      ],
    },
  ],

  // ── Canelo Alvarez ──────────────────────────────────────────────────────────
  "canelo-alvarez": [
    {
      title: "Shoulder Roll Defense",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Weight shifts to rear foot simultaneously with shoulder roll", mn: "Арын хөлд жин шилжих нь мөрний эргэлттэй нэгэн зэрэг болдог", ko: "체중이 어깨 롤과 동시에 뒷발로 이동한다" } },
        { type: "WEIGHT", value: { en: "Rear weight is the foundation — no rear weight means no real roll", mn: "Арын жин бол суурь — арын жингүйгээр жинхэнэ эргэлт байхгүй", ko: "뒤쪽 체중이 기반이다 — 뒤쪽 체중 없이는 진정한 롤이 없다" } },
        { type: "ANGLE",  value: { en: "Rounded shoulder surface deflects the punch outward, not into you", mn: "Дугариг мөрний гадаргуу цохилтыг гадагш гулсуулдаг, чинь тийш биш", ko: "둥근 어깨 표면이 펀치를 안으로가 아닌 바깥으로 흘린다" } },
        { type: "GUARD",  value: { en: "Right hand by jaw, left arm diagonal — both active at once", mn: "Баруун гар эрүүний дэргэд, зүүн гар диагональ — хоёулаа нэгэн зэрэг идэвхтэй", ko: "오른손은 턱 옆, 왼팔은 대각선 — 둘 다 동시에 활성화" } },
      ],
      explanation: {
        en: "Rear weight and shoulder forward happen simultaneously. The rounded surface deflects the punch outward. Combined with the offline weight shift, there's nothing for the opponent to land on — and you're already in counter position when they miss.",
        mn: "Арын жин болон мөр урагш нэгэн зэрэг болно. Дугариг гадаргуу цохилтыг гадагш гулсуулдаг. Офлайн жин шилжилттэй хамт дайснаас цохих зай байхгүй болж, тэд алдахад чи аль хэдийн контер позицид байна.",
        ko: "뒤쪽 체중 이동과 어깨 앞으로 내밀기가 동시에 이루어진다. 둥근 표면이 펀치를 바깥으로 흘린다. 오프라인 체중 이동과 결합되면 상대가 맞출 것이 없고, 그들이 빗나갈 때 이미 카운터 자세가 된다.",
      },
      bodyCue: {
        en: "Feel your rear shoulder rising forward as weight shifts back — both movements are simultaneous, never one then the other.",
        mn: "Жин арагш шилжихэд арын мөр урагш өргөгдөхийг мэдрэ — хоёр хөдөлгөөн нэгэн зэрэг, хэзээ ч нэгийг нь дараа нь биш.",
        ko: "체중이 뒤로 이동할 때 뒷 어깨가 앞으로 올라오는 것을 느껴라 — 두 동작은 동시에, 절대 하나씩 순서대로 하지 않는다.",
      },
      commonMistake: {
        en: "Rolling the shoulder without shifting weight to the rear foot. The roll alone leaves you flat-footed on the power line — you deflect the punch but stay in range of the next one.",
        mn: "Арын хөлд жин шилжүүлэлгүйгээр мөр эргүүлэх. Зөвхөн эргэлт нь чамайг хүч шугам дээр хавтгай хөлтэй үлдээдэг — цохилтыг гулсуулдаг ч дараагийнх нь зайд үлдэнэ.",
        ko: "체중을 뒷발로 이동하지 않고 어깨만 롤링하는 것. 롤만으로는 파워 라인 위에 평발로 서게 된다 — 펀치는 흘리지만 다음 펀치 사정거리 안에 남는다.",
      },
      coachNotes: {
        en: "The shoulder roll is weight management: shift rear, shoulder turns, nothing to hit. When timed correctly, the defender is always outside the punch — safest position in boxing.",
        mn: "Мөрний эргэлт бол жин удирдлага: арагш шилжих, мөр эргэх, цохих зүйл байхгүй. Зөв цагтаа хийхэд хамгаалагч үргэлж цохилтын гадна байдаг — боксын хамгийн аюулгүй позиц.",
        ko: "어깨 롤은 체중 관리다: 뒤로 이동, 어깨 회전, 맞을 것 없음. 타이밍이 맞으면 수비자는 항상 펀치 바깥에 있다 — 복싱에서 가장 안전한 위치.",
      },
      drillSteps: [
        { en: "Mirror: practice rear shoulder forward roll without incoming — feel the natural mechanics", mn: "Толь: ирж буй цохилтгүйгээр арын мөр урагш эргүүлэх дасгал — байгалийн механик мэдрэх", ko: "거울 앞: 들어오는 것 없이 뒷 어깨 롤 연습 — 자연스러운 역학 느끼기" },
        { en: "Partner light touch: partner presses palm toward face, roll so shoulder deflects", mn: "Партнер хөнгөн хүрэлцэлт: партнер нүүр тийш алган дарна, мөр эргүүлж гулсуул", ko: "파트너 가벼운 터치: 파트너가 얼굴 쪽으로 손바닥을 누르면, 어깨로 방향 전환" },
        { en: "Always combine: roll must be accompanied by rear-foot weight transfer every time", mn: "Үргэлж хослуул: эргэлт нь арын хөлд жин шилжүүлэлттэй заавал хамт байна", ko: "항상 결합: 롤은 매번 뒷발 체중 이동과 함께해야 한다" },
        { en: "Add counter: roll, feel the cross land on shoulder, return short left hook from rolled position", mn: "Контер нэм: эргэх, кросс мөрөнд тусахыг мэдрэх, эргэлтийн позицоос богино зүүн хук буцаах", ko: "카운터 추가: 롤, 어깨에 크로스 맞는 느낌, 롤된 자세에서 짧은 왼쪽 훅 반격" },
      ],
    },
    {
      title: "Duck & Short Hook Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Lead foot stays planted as anchor — rear foot doesn't move", mn: "Урд хөл зогсоол болж тогтох — арын хөл хөдлөхгүй", ko: "앞발은 앵커로 고정 — 뒷발은 움직이지 않는다" } },
        { type: "WEIGHT", value: { en: "Duck loads the left hip — hook is pre-charged by the duck itself", mn: "Нугарах нь зүүн нуруу ачааллана — хук нь нугарахаар урьдчилан цэнэглэгддэг", ko: "덕이 왼쪽 힙을 로드한다 — 훅은 덕 자체로 미리 충전된다" } },
        { type: "ANGLE",  value: { en: "Head moves offline at 45° to the left — not straight down", mn: "Толгой 45° зүүн тийш офлайн хөдөлдөг — шулуун доош биш", ko: "머리가 왼쪽으로 45° 오프라인 이동 — 곧장 아래로가 아니다" } },
        { type: "GUARD",  value: { en: "Duck is defense and hook setup simultaneously — one movement", mn: "Нугарах нь хамгаалалт болон хук бэлтгэл нэгэн зэрэг — нэг хөдөлгөөн", ko: "덕은 수비와 훅 셋업이 동시에 — 하나의 움직임" } },
      ],
      explanation: {
        en: "The duck pre-charges the hook. When the head moves offline left, the left hip naturally loads. The hook is already half-done by the time you're ready to throw it — duck correctly and the counter is automatic. One movement creates both defense and offense.",
        mn: "Нугарах нь хукийг урьдчилан цэнэглэдэг. Толгой зүүн тийш офлайн хөдлөхөд зүүн нуруу байгалиараа ачааллана. Хаях гэж бэлэн болох үед хук хагас хийгдсэн байна — зөв нугарвал контер автоматаар гарна. Нэг хөдөлгөөн хамгаалалт болон дайралт хоёуланг нь бүтээдэг.",
        ko: "덕이 훅을 미리 충전한다. 머리가 왼쪽으로 오프라인 이동하면 왼쪽 힙이 자연스럽게 로드된다. 던질 준비가 됐을 때 훅은 이미 반쯤 완성되어 있다 — 올바르게 덕하면 카운터는 자동이다. 하나의 움직임이 수비와 공격 둘 다를 만든다.",
      },
      bodyCue: {
        en: "Feel your head moving offline to the left (not just downward) — a straight duck goes forward into the punch, not away from it.",
        mn: "Толгой зүүн тийш офлайн хөдлөхийг мэдрэ (зөвхөн доош биш) — шулуун нугарах нь цохилтоос зайлдаггүй, цохилт руу урагш явдаг.",
        ko: "머리가 왼쪽으로 오프라인 이동하는 것을 느껴라 (그냥 아래로가 아니라) — 곧장 덕은 펀치에서 멀어지는 게 아니라 펀치 쪽으로 전진한다.",
      },
      commonMistake: {
        en: "Ducking straight down without going offline. A straight duck brings your head onto the punching line instead of off it — you absorb the punch on the top of your head instead of avoiding it.",
        mn: "Офлайн болохгүйгээр шулуун доош нугарах. Шулуун нугарах нь толгойг цохилтын шугамаас гадуур гаргахын оронд дээр нь авчирдаг — зайлахын оронд толгойн дээд хэсгээр цохилтыг хүлээн авдаг.",
        ko: "오프라인 없이 곧장 아래로 덕하는 것. 곧장 덕은 머리를 펀치 라인 밖이 아닌 위로 가져온다 — 피하는 대신 머리 꼭대기에서 펀치를 흡수한다.",
      },
      coachNotes: {
        en: "The duck sets up the counter automatically. When you duck properly — head offline, not just bent forward — your left hip naturally loads. The hook is half-done by the duck itself.",
        mn: "Нугарах нь контерийг автоматаар бэлддэг. Зөв нугарахад — толгой офлайн, зөвхөн урагш бөхийхгүй — зүүн нуруу байгалиараа ачааллана. Хук нь нугарахаар хагас хийгдсэн байна.",
        ko: "덕은 카운터를 자동으로 셋업한다. 올바르게 덕할 때 — 머리 오프라인, 그냥 앞으로 숙이는 게 아니라 — 왼쪽 힙이 자연스럽게 로드된다. 훅은 덕 자체로 반쯤 완성된다.",
      },
      drillSteps: [
        { en: "Solo duck practice: head must move offline left, not just downward — 20 reps", mn: "Ганцаарчилсан нугарах дасгал: толгой зүүн тийш офлайн хөдлөх ёстой, зөвхөн доош биш — 20 давталт", ko: "혼자 덕 연습: 머리는 왼쪽으로 오프라인 이동해야 한다, 그냥 아래로가 아니라 — 20회" },
        { en: "Partner press: partner extends jab slowly, you duck offline and feel which hook naturally follows", mn: "Партнер дарах: партнер аажмаар жааб сунгана, чи офлайн нугарч аль хук байгалиараа дагадгийг мэдрэ", ko: "파트너 프레스: 파트너가 천천히 잽을 뻗으면, 오프라인으로 덕하고 어떤 훅이 자연스럽게 따라오는지 느껴라" },
        { en: "Add counter: duck, pause to confirm position, then release left hook to marked target", mn: "Контер нэм: нугарах, позицийг баталгаажуулахаар зогсох, дараа нь тэмдэглэгдсэн зорилтод зүүн хук гаргах", ko: "카운터 추가: 덕, 자세 확인을 위해 멈춤, 그리고 표시된 목표에 왼쪽 훅 릴리즈" },
        { en: "Speed build: reduce the pause over sessions until duck-and-counter is one fluid motion", mn: "Хурдыг нэмэгдүүл: нугарах-контер нэг урсгал хөдөлгөөн болтол сессийн дотор зогсолтыг багасга", ko: "속도 증가: 덕-카운터가 하나의 유동적 움직임이 될 때까지 세션마다 멈춤을 줄여라" },
      ],
    },
    {
      title: "Body Pattern Accumulation",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Mid-range, stable base — same footwork for all accumulated shots", mn: "Дунд зай, тогтвортой суурь — бүх хуримтлагдсан цохилтод ижил хөлийн ажил", ko: "중간 거리, 안정적인 베이스 — 누적된 모든 샷에 동일한 풋워크" } },
        { type: "WEIGHT", value: { en: "Full hip rotation into each body shot — real force, not feelers", mn: "Бие цохилт бүрд бүтэн нуруу эргэлт — жинхэнэ хүч, мэдрэгч биш", ko: "모든 바디 샷에 완전한 힙 회전 — 실제 힘, 가늠샷이 아니다" } },
        { type: "ANGLE",  value: { en: "Jab body, cross body, hook body — same range, pattern not angle", mn: "Жааб бие, кросс бие, хук бие — ижил зай, загвар нь булангийн биш", ko: "잽 바디, 크로스 바디, 훅 바디 — 같은 거리, 각도가 아닌 패턴" } },
        { type: "GUARD",  value: { en: "Maintain head protection between body shots — guard never drops", mn: "Бие цохилтуудын хооронд толгойн хамгаалалтаа хадгал — guard хэзээ ч унахгүй", ko: "바디 샷 사이에 머리 보호 유지 — 가드는 절대 내려가지 않는다" } },
      ],
      explanation: {
        en: "Each body shot forces the opponent to consciously protect their ribs. By shot four or five, the guard drifts down without a decision being made. The head punch at the end lands on a guard that has partially lowered itself. Accumulation only works if every body shot is a genuine threat.",
        mn: "Бие цохилт бүр дайснаа хавирга хамгаалахад сэрэмжтэй байлгадаг. Дөрөв, тав дахь цохилт гэхэд guard шийдвэр гаргалгүйгээр доош бууна. Эцэст нь толгойн цохилт хагас буусан guard руу очно. Хуримтлал нь бодит аюул болсон үед л ажилладаг.",
        ko: "각각의 바디 샷은 상대가 의식적으로 갈비뼈를 보호하게 만든다. 네 번째나 다섯 번째 샷쯤이면 가드가 결정 없이 내려간다. 마지막 머리 펀치는 부분적으로 내려간 가드에 꽂힌다. 모든 바디 샷이 진짜 위협일 때만 누적이 작동한다.",
      },
      bodyCue: {
        en: "Feel real hip rotation into each body shot — if you're not feeling the ribs compress against the bag, the shot isn't real enough to force a guard response.",
        mn: "Бие цохилт бүрд жинхэнэ нуруу эргэлтийг мэдрэ — хэрэв цүнх дээр хавирга шахагдахыг мэдрэхгүй байвал, цохилт guard-ыг хариу өгүүлэхийн тулд хангалттай бодит биш.",
        ko: "모든 바디 샷에서 진짜 힙 회전을 느껴라 — 샌드백에 갈비뼈가 눌리는 느낌이 없다면, 그 샷은 가드 반응을 강제할 만큼 실제적이지 않다.",
      },
      commonMistake: {
        en: "Throwing body shots at half power to 'set them up.' The brain ignores fake threats. Accumulation only works if each shot is a genuine threat the opponent cannot ignore.",
        mn: "Бие цохилтыг хагас хүчээр 'бэлдэхийн тулд' шидэх. Тархи хуурамч аюулыг үл тоодог. Хуримтлал нь дайсан үл тоож чадахгүй жинхэнэ аюул болсон үед л ажилладаг.",
        ko: "'셋업하려고' 반만의 힘으로 바디 샷을 던지는 것. 뇌는 가짜 위협을 무시한다. 상대가 무시할 수 없는 진짜 위협일 때만 누적이 작동한다.",
      },
      coachNotes: {
        en: "Body shots are investments. Each one forces the opponent to think about their ribs. By punch 5 or 6, their guard drifts down automatically. Commit to real body shots — the brain ignores fake threats.",
        mn: "Бие цохилт бол хөрөнгө оруулалт. Тус бүр нь дайснаа хавирга тухай бодоход хүргэдэг. 5-6 дахь цохилт гэхэд guard автоматаар доошоо буудаг. Жинхэнэ бие цохилтод тулгар — тархи хуурамч аюулыг үл тоодог.",
        ko: "바디 샷은 투자다. 하나하나가 상대를 갈비뼈에 대해 생각하게 만든다. 5번째나 6번째 펀치쯤이면 가드가 자동으로 내려간다. 진짜 바디 샷에 전념해라 — 뇌는 가짜 위협을 무시한다.",
      },
      drillSteps: [
        { en: "Heavy bag: alternate left-right body shots 20 reps, full hip rotation into each one", mn: "Хүнд цүнх: зүүн-баруун бие цохилтыг ээлжлэн 20 давталт, тус бүрд бүтэн нуруу эргэлттэй", ko: "헤비백: 왼쪽-오른쪽 바디 샷 교대 20회, 매번 완전한 힙 회전" },
        { en: "Pattern set: jab body, cross body, hook body — then switch last punch to head spontaneously", mn: "Загвар дасгал: жааб бие, кросс бие, хук бие — дараа нь сүүлийн цохилтыг толгойд аяндаа солих", ko: "패턴 세트: 잽 바디, 크로스 바디, 훅 바디 — 그리고 마지막 펀치를 자연스럽게 머리로 전환" },
        { en: "Partner mitts: 4 body calls then 1 surprise head call — boxer transitions instantly", mn: "Партнер митт: 4 бие дуудлага, дараа нь 1 гэнэтийн толгой дуудлага — боксч нэн даруй шилжих", ko: "파트너 미트: 바디 콜 4번 후 깜짝 헤드 콜 1번 — 복서는 즉시 전환" },
        { en: "Sparring intent: attack the body for a full round — head punches only as the final switch", mn: "Спарринг зорилго: бүтэн раундад бие рүү довтол — толгойн цохилт зөвхөн эцсийн шилжилтэд", ko: "스파링 의도: 풀 라운드 동안 바디 공격 — 머리 펀치는 마지막 전환으로만" },
      ],
    },
  ],

  // ── Gennady Golovkin ────────────────────────────────────────────────────────
  "gennady-golovkin": [
    {
      title: "Triple Jab Setup",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Step forward with each jab — close distance progressively", mn: "Жааб бүрд урагш алхах — зайг аажмаар хаах", ko: "잽마다 앞으로 스텝 — 거리를 점진적으로 좁힌다" } },
        { type: "WEIGHT", value: { en: "Forward pressure adds weight to each successive jab", mn: "Урагш даралт бүр дараагийн жаабад жин нэмдэг", ko: "전진 압박이 연속되는 잽마다 체중을 더한다" } },
        { type: "ANGLE",  value: { en: "Straight jab line — hook follows the natural shoulder position", mn: "Шулуун жааб шугам — хук байгалийн мөрний позицийг дагадаг", ko: "직선 잽 라인 — 훅은 자연스러운 어깨 위치를 따른다" } },
        { type: "GUARD",  value: { en: "High guard between jabs — opponent tries to counter in the gaps", mn: "Жаабуудын хооронд өндөр guard — дайсан завсарт контер хийхийг оролддог", ko: "잽 사이에 하이 가드 — 상대는 틈새에서 카운터를 노린다" } },
      ],
      explanation: {
        en: "Three jabs establish a pattern. By the third, the opponent is solving for jab. The hook arrives from the same hand, same position — unrecognized as a different punch until it's too late to adjust the guard.",
        mn: "Гурван жааб загвар тогтооно. Гурав дахь гэхэд дайсан жаабыг шийдвэрлэж байна. Хук ижил гараас, ижил позицоос ирдэг — guard тохируулахад хэтэрхий орой болох хүртэл өөр цохилт гэдгийг таньдаггүй.",
        ko: "세 번의 잽이 패턴을 만든다. 세 번째쯤이면 상대는 잽에 집중하고 있다. 훅은 같은 손, 같은 위치에서 온다 — 가드를 조정하기엔 너무 늦을 때까지 다른 펀치라는 걸 인식하지 못한다.",
      },
      bodyCue: {
        en: "Feel your steps closing the distance progressively — each jab should land slightly closer than the last.",
        mn: "Алхамууд аажмаар зайг хаахыг мэдрэ — жааб бүр өмнөхөөсөө арай ойрхон тусах ёстой.",
        ko: "발걸음이 점진적으로 거리를 좁히는 것을 느껴라 — 잽마다 이전보다 조금 더 가까이 닿아야 한다.",
      },
      commonMistake: {
        en: "Telegraphing the hook by dropping the left shoulder before throwing it. The hook must emerge from the same position as the jabs — any shoulder drop is readable at full speed.",
        mn: "Хук шидэхийн өмнө зүүн мөр унагаж телеграфдах. Хук нь жаабуудтай ижил позицоос гарах ёстой — ямар ч мөр уналт бүрэн хурданд уншигддаг.",
        ko: "던지기 전에 왼쪽 어깨를 떨어뜨려 훅을 예고하는 것. 훅은 잽과 같은 위치에서 나와야 한다 — 어떤 어깨 드롭이든 전속력에서 읽힌다.",
      },
      coachNotes: {
        en: "Three jabs teach the opponent to defend jabs. The hook comes from nowhere because they're still solving for jab three. Each jab must be real — telegraphed jabs teach opponents when to expect the hook.",
        mn: "Гурван жааб дайсанд жааб хамгаалахыг заадаг. Хук хаанаас ч ирэхгүй мэт, учир нь тэд гурав дахь жаабыг шийдвэрлэж байсаар байна. Жааб бүр бодит байх ёстой — телеграф жааб дайсанд хукийг хэзээ хүлээхийг заадаг.",
        ko: "세 번의 잽이 상대에게 잽을 막는 것을 가르친다. 훅은 어디서도 오지 않는 것처럼 느껴지는데, 상대가 아직 세 번째 잽을 처리하고 있기 때문이다. 잽 하나하나가 진짜여야 한다 — 예고된 잽은 상대에게 훅을 예상할 타이밍을 가르친다.",
      },
      drillSteps: [
        { en: "Shadow: triple jab rhythm, stepping forward, one beat between each — smooth before adding hook", mn: "Сүүдэр: гурван жааб хэм, урагш алхалттай, хооронд нэг цохилт — хук нэмэхийн өмнө жигдрүүл", ko: "섀도우: 트리플 잽 리듬, 앞으로 스텝, 각각 한 박자 — 훅 추가 전 부드럽게" },
        { en: "Heavy bag: triple jab with forward pressure, move into the bag on each jab", mn: "Хүнд цүнх: урагш даралттай гурван жааб, жааб бүрд цүнх рүү орох", ko: "헤비백: 전진 압박과 함께 트리플 잽, 잽마다 백 속으로 들어가기" },
        { en: "Partner: triple jab, partner signals when to throw hook — builds reactive timing", mn: "Партнер: гурван жааб, хук хаяхыг партнер дохио өгнө — реактив цаг барилт бүтээх", ko: "파트너: 트리플 잽, 파트너가 훅 던질 타이밍 신호 — 반응 타이밍 구축" },
        { en: "Sparring: commit to triple jab sets, resist switching to cross early, let the setup build", mn: "Спарринг: гурван жааб сетэд тулгар, эрт кросс руу шилжихэд эсэргүүц, бэлтгэлийг бүтэх", ko: "스파링: 트리플 잽 세트에 전념, 일찍 크로스로 전환하는 것을 참아라, 셋업이 쌓이게 두어라" },
      ],
    },
    {
      title: "Systematic Ring Cut",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Diagonal steps — 45° forward left and 45° forward right, alternating", mn: "Диагональ алхам — 45° урагш зүүн, 45° урагш баруун, ээлжлэн", ko: "대각선 스텝 — 45° 전진 왼쪽과 45° 전진 오른쪽, 교대로" } },
        { type: "WEIGHT", value: { en: "Balanced weight enables equal comfort cutting either direction", mn: "Тэнцвэртэй жин аль ч чиглэлд адил тохилтойгоор огтлохыг боломжтой болгодог", ko: "균형 잡힌 체중이 어느 방향으로든 편안하게 커팅 가능하게 한다" } },
        { type: "ANGLE",  value: { en: "Move toward where they're going, not where they currently are", mn: "Тэд одоо байгаа газар руу биш, явах гэж байгаа газар руу хөдөл", ko: "그들이 현재 있는 곳이 아닌, 가려는 곳을 향해 이동한다" } },
        { type: "GUARD",  value: { en: "Active guard while cutting — never drop during footwork patterns", mn: "Огтлох үед идэвхтэй guard — хөлийн ажлын загваруудын үед хэзээ ч унагахгүй", ko: "커팅 중 활성 가드 — 풋워크 패턴 중 절대 내리지 않는다" } },
      ],
      explanation: {
        en: "Diagonal footwork cuts escape routes, reducing the available ring with each exchange. You move toward where they want to go — not toward where they are. You arrive at the destination before they do, and their escape route is gone.",
        mn: "Диагональ хөлийн ажил зугтах замыг таслан, солилцол бүрд боломжит рингийг багасгадаг. Тэд байгаа газар руу биш, явах гэж байгаа газар руу хөдөлдөг. Тэдгээрийн өмнө зорьсон газарт хүрч, тэдний зугтах зам алга болно.",
        ko: "대각선 풋워크가 탈출로를 차단하여 교전마다 사용 가능한 링을 줄인다. 그들이 있는 곳이 아닌, 가려는 곳을 향해 이동한다. 목적지에 먼저 도착하면 그들의 탈출로가 사라진다.",
      },
      bodyCue: {
        en: "Feel your diagonal steps arriving before the opponent — you're moving toward their destination, so you get there first.",
        mn: "Диагональ алхамууд дайснаас өмнө хүрэхийг мэдрэ — тэдний зорьсон газар руу хөдөлж байгаа тул тэндээс түрүүлж хүрнэ.",
        ko: "대각선 스텝이 상대보다 먼저 도착하는 것을 느껴라 — 그들의 목적지를 향해 이동하므로, 먼저 도착한다.",
      },
      commonMistake: {
        en: "Moving straight toward the opponent to cut them off. Straight pressure they can easily circle around. Diagonal angles remove the escape route instead of just reducing distance.",
        mn: "Дайсныг таслахын тулд шулуун тийш нь хөдлөх. Шулуун даралтыг тэд амархан тойрч гарч чадна. Диагональ өнцөг нь зүгээр зайг багасгахын оронд зугтах замыг устгадаг.",
        ko: "상대를 차단하기 위해 직선으로 이동하는 것. 직선 압박은 쉽게 빙 돌아갈 수 있다. 대각선 각도는 거리를 줄이는 게 아니라 탈출로를 없앤다.",
      },
      coachNotes: {
        en: "Cutting the ring is about reducing options, not closing distance. Move at 45° angles toward where the opponent wants to go — not toward where they are. You arrive before them.",
        mn: "Ринг таслах нь зайг хаах биш, сонголтыг багасгах тухай. Дайсан явах гэж байгаа газар руу 45° өнцгөөр хөдөл — тэд байгаа газар руу биш. Тэдгээрийн өмнө хүрнэ.",
        ko: "링 커팅은 거리를 좁히는 게 아니라 선택지를 줄이는 것이다. 상대가 가려는 곳을 향해 45° 각도로 이동해라 — 그들이 있는 곳이 아니라. 먼저 도착한다.",
      },
      drillSteps: [
        { en: "Floor exercise: mark corners, move imaginary opponent toward corner using diagonal steps only", mn: "Шал дасгал: булангуудыг тэмдэглэ, зөвхөн диагональ алхамаар төсөөллийн дайсныг булан руу хөдөлгөх", ko: "바닥 운동: 코너 표시, 대각선 스텝만으로 가상의 상대를 코너로 이동" },
        { en: "Shadow: 45° forward angling left and right alternately while maintaining center line", mn: "Сүүдэр: дундын шугааг хадгалж, 45° урагш зүүн, баруун ээлжлэн өнцөглөх", ko: "섀도우: 센터라인 유지하며 45° 전진으로 왼쪽과 오른쪽 교대 앵글링" },
        { en: "Partner: they try to circle out, you cut off using only angled footwork — no grabbing", mn: "Партнер: тэд тойрч гарахыг оролдоно, чи зөвхөн өнцгийн хөлийн ажлаар таслах — барихгүй", ko: "파트너: 그들이 빙 돌아 나가려 하면, 각진 풋워크만으로 차단 — 잡기 없음" },
        { en: "Rope drill: force partner to ropes using only positioning and diagonal footwork", mn: "Роп дасгал: зөвхөн позиц болон диагональ хөлийн ажлаар партнерыг роп руу хүчлэх", ko: "로프 드릴: 포지셔닝과 대각선 풋워크만으로 파트너를 로프로 몰기" },
      ],
    },
    {
      title: "In-Close Right Hand",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Step inside at 45° to access the right hand lane", mn: "Баруун гарын зам руу хандахын тулд 45° дотогш алхах", ko: "오른손 라인에 접근하기 위해 45° 안쪽으로 스텝" } },
        { type: "WEIGHT", value: { en: "Body weight drives the compact right — shoulder forward through", mn: "Биеийн жин компакт баруун гарыг жолооддог — мөр урагш дамжин", ko: "체중이 컴팩트 라이트를 구동한다 — 어깨가 앞으로 관통" } },
        { type: "ANGLE",  value: { en: "Down the middle, compact — elbow drives the punch, not the arm", mn: "Дундаар доош, компакт — тохой цохилтыг жолооддог, гар биш", ko: "가운데로 아래, 컴팩트 — 팔꿈치가 펀치를 구동한다, 팔이 아니라" } },
        { type: "GUARD",  value: { en: "Lead hand controls opponent's guard during the inside step", mn: "Урд гар дотогш алхах үед дайсны guard-ыг хянана", ko: "앞손이 안쪽 스텝 동안 상대의 가드를 컨트롤한다" } },
      ],
      explanation: {
        en: "Step inside at 45° to access the right hand lane. At inside range, a compact right hand using the shoulder as the driving force delivers the same power as a full cross — in 15 centimeters of travel instead of full extension.",
        mn: "Баруун гарын зам руу хандахын тулд 45° дотогш алхах. Дотоод зайд мөрийг хөдөлгөгч хүч болгосон компакт баруун гар нь бүрэн сунгалтын оронд 15 сантиметрийн замд бүрэн кросстой ижил хүч өгдөг.",
        ko: "오른손 라인에 접근하기 위해 45° 안쪽으로 스텝. 인사이드 거리에서 어깨를 구동력으로 사용하는 컴팩트 라이트 핸드는 풀 익스텐션 대신 15센티미터 이동으로 풀 크로스와 같은 파워를 전달한다.",
      },
      bodyCue: {
        en: "Feel your shoulder driving through the punch rather than your hand extending — if you feel the elbow straightening, you've switched to arm power.",
        mn: "Гараа сунгахын оронд мөр цохилтоор дамжихыг мэдрэ — тохой шулуудахыг мэдэрвэл гарны хүч рүү шилжсэн байна.",
        ko: "손을 뻗는 대신 어깨가 펀치를 관통하는 것을 느껴라 — 팔꿈치가 펴지는 걸 느끼면 팔 파워로 전환된 것이다.",
      },
      commonMistake: {
        en: "Extending a full cross at close range. At inside distance, arm extension creates a push with no snap. The power comes from body weight driving through the elbow — not from arm extension.",
        mn: "Ойр зайд бүрэн кросс сунгах. Дотоод зайд гарны сунгалт нь авирах хөдөлгөөн бүтээдэг, чирх байхгүй. Хүч нь тохойгоор дамжсан биеийн жингээс ирдэг — гарны сунгалтаас биш.",
        ko: "근거리에서 풀 크로스를 뻗는 것. 인사이드 거리에서 팔 익스텐션은 스냅 없는 밀기가 된다. 파워는 팔꿈치를 통한 체중 구동에서 나온다 — 팔 익스텐션이 아니라.",
      },
      coachNotes: {
        en: "Inside range, extension equals no power. The in-close right hand is a driving motion — elbow forward, body rotates into it. Throw your shoulder through the punch, not your arm.",
        mn: "Дотоод зайд сунгалт тэнцүү хүчгүй. Ойр зайн баруун гар бол хөдөлгөгч хөдөлгөөн — тохой урагш, бие нь эргэж ордог. Гараа биш, мөрөө цохилтоор дамжуул.",
        ko: "인사이드 거리에서 익스텐션은 파워 없음과 같다. 인사이드 라이트 핸드는 구동 동작이다 — 팔꿈치 앞으로, 몸이 회전해 들어간다. 팔이 아닌 어깨를 펀치를 통해 던져라.",
      },
      drillSteps: [
        { en: "Heavy bag: chest within 6 inches, throw right hands from body rotation only — arm barely extends", mn: "Хүнд цүнх: цээж 6 инч дотор, зөвхөн биеийн эргэлтээс баруун гар шид — гар бараг сунгахгүй", ko: "헤비백: 가슴을 6인치 이내로, 몸 회전만으로 라이트 핸드 — 팔은 거의 뻗지 않는다" },
        { en: "Compare: full cross vs. compact right on the bag — bag travel should be similar if done correctly", mn: "Харьцуул: цүнх дээр бүрэн кросс vs. компакт баруун гар — зөв хийгдвэл цүнхний хөдөлгөөн ижил байх ёстой", ko: "비교: 백에서 풀 크로스 vs 컴팩트 라이트 — 올바르게 하면 백 이동이 비슷해야 한다" },
        { en: "Step-in drill: start mid-range, one step inside, immediately compact right — no pause", mn: "Дотогш алхах дасгал: дунд зайгаас эхлэх, нэг алхам дотогш, нэн даруй компакт баруун гар — зогсолтгүй", ko: "스텝인 드릴: 중간 거리에서 시작, 안쪽으로 한 스텝, 즉시 컴팩트 라이트 — 멈춤 없이" },
        { en: "Partner pads in close: practice stopping inside their jab range and throwing compact right", mn: "Партнер пад ойр зайд: тэдний жааб зайн дотор зогсож, компакт баруун гар шидэх дасгал", ko: "파트너 패드 근거리: 상대 잽 사정거리 안에서 멈추고 컴팩트 라이트 던지기 연습" },
      ],
    },
  ],

  // ── Floyd Mayweather ────────────────────────────────────────────────────────
  "floyd-mayweather": [
    {
      title: "Philly Shell Position",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Orthodox stance, weight slightly rear — ready to roll or exit", mn: "Ортодокс зогсолт, жин арагш арай — эргэх эсвэл гарахад бэлэн", ko: "오소독스 스탠스, 체중 약간 뒤 — 롤이나 탈출 준비 완료" } },
        { type: "WEIGHT", value: { en: "Rear weight bias enables shoulder roll and lateral exits", mn: "Арын жингийн хазайлт мөрний эргэлт болон хажуу гарахыг боломжтой болгодог", ko: "뒤쪽 체중 편향이 어깨 롤과 측면 탈출을 가능하게 한다" } },
        { type: "ANGLE",  value: { en: "Right shoulder angled forward presents the deflection surface", mn: "Баруун мөр урагш өнцөглөгдөж гулсуулах гадаргуу гаргана", ko: "오른쪽 어깨가 앞으로 각도를 이루어 방향 전환 표면을 만든다" } },
        { type: "GUARD",  value: { en: "Right hand by jaw, left arm diagonal, shoulder protects simultaneously", mn: "Баруун гар эрүүний дэргэд, зүүн гар диагональ, мөр нэгэн зэрэг хамгаалдаг", ko: "오른손은 턱 옆, 왼팔은 대각선, 어깨가 동시에 보호" } },
      ],
      explanation: {
        en: "Right hand at the jaw, left arm diagonal, right shoulder forward — three layers of defense from one relaxed position. When timed correctly, the shoulder deflects before you need to actively react. You're always outside the punch before it reaches you.",
        mn: "Баруун гар эрүүнд, зүүн гар диагональ, баруун мөр урагш — нэг тайвшрал позицоос гурван давхар хамгаалалт. Зөв цагтаа хийхэд мөр идэвхтэй хариу үйлдэл хийх шаардлагатай болохоос өмнө гулсуулдаг. Цохилт хүрэхийн өмнө үргэлж гадна байна.",
        ko: "턱에 오른손, 대각선 왼팔, 오른쪽 어깨 앞으로 — 하나의 릴랙스한 자세에서 세 겹의 방어. 타이밍이 맞으면 어깨가 능동적으로 반응하기 전에 방향을 전환한다. 펀치가 닿기 전에 항상 바깥에 있다.",
      },
      bodyCue: {
        en: "Feel the relaxed weight of your right hand against your jaw — tension in the arm kills the shoulder roll reflex.",
        mn: "Эрүүн дэргэдх баруун гарынхаа тайвшрал жинг мэдрэ — гарны хурцадмал байдал мөрний эргэлтийн рефлексийг устгадаг.",
        ko: "턱에 닿는 오른손의 릴랙스한 무게를 느껴라 — 팔의 긴장이 어깨 롤 반사를 죽인다.",
      },
      commonMistake: {
        en: "Holding the Shell position rigidly as a static pose. It works through relaxation and reactive rolling, not through tense defensive holding. Rigid = slow.",
        mn: "Shell позицийг хатуу статик байдалд барих. Энэ нь хурцадмал хамгаалалтын барилтаар биш, тайвшрал болон реактив эргэлтээр ажилладаг. Хатуу = удаан.",
        ko: "쉘 자세를 정적인 포즈로 경직되게 유지하는 것. 긴장된 수비적 유지가 아닌 릴랙스와 반응적 롤링으로 작동한다. 경직 = 느림.",
      },
      coachNotes: {
        en: "The Philly Shell is not a waiting posture — it's a counter-punching position. The shoulder deflects, your arm is already at their guard, the counter fires before they finish extending.",
        mn: "Philly Shell бол хүлээх байр биш — контер цохих позиц. Мөр гулсуулна, гарынх нь аль хэдийн тэдний guard-д байна, тэд сунгалтаа дуусгахаас өмнө контер гардаг.",
        ko: "필리 쉘은 기다리는 자세가 아니다 — 카운터 펀칭 포지션이다. 어깨가 방향을 전환하면, 팔이 이미 상대 가드에 있고, 상대가 익스텐션을 마치기 전에 카운터가 발사된다.",
      },
      drillSteps: [
        { en: "Mirror: hold Shell for 60 seconds — right hand by jaw, left arm diagonal, shoulder forward", mn: "Толь: 60 секунд Shell барих — баруун гар эрүүний дэргэд, зүүн гар диагональ, мөр урагш", ko: "거울: 60초간 쉘 유지 — 오른손은 턱 옆, 왼팔은 대각선, 어깨 앞으로" },
        { en: "Walk one full round in Shell — feel what's covered without anything incoming", mn: "Shell-д нэг бүтэн раунд алхах — ирж буй зүйлгүйгээр юу бүрхэгдсэнийг мэдрэх", ko: "쉘로 풀 라운드 걷기 — 들어오는 것 없이 무엇이 커버되는지 느껴라" },
        { en: "Partner light touch: partner taps shoulder area, practice rolling with shoulder, not arm", mn: "Партнер хөнгөн хүрэлцэлт: партнер мөрний хэсгийг тогших, мөрөөр эргэх дасгал хий, гараар биш", ko: "파트너 가벼운 터치: 파트너가 어깨 부위를 탭, 팔이 아닌 어깨로 롤링 연습" },
        { en: "Counter from Shell: partner jabs, shoulder deflects, immediate left hand return — no cocking", mn: "Shell-ээс контер: партнер жааб хийнэ, мөр гулсуулна, нэн даруй зүүн гарын буцаалт — бэлдэлгүй", ko: "쉘에서 카운터: 파트너가 잽, 어깨로 방향 전환, 즉시 왼손 반격 — 코킹 없이" },
      ],
    },
    {
      title: "Catch & Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Footwork active during catch — never plant both feet to receive", mn: "Барих үед хөлийн ажил идэвхтэй — хоёр хөлийг хүлээн авахаар хэзээ ч тавихгүй", ko: "캐치 중 풋워크 활성 — 받기 위해 두 발을 절대 고정하지 않는다" } },
        { type: "WEIGHT", value: { en: "No weight commitment during catch — stay completely mobile", mn: "Барих үед жингийн үүрэг байхгүй — бүрэн хөдөлгөөнтэй байх", ko: "캐치 중 체중 고정 없음 — 완전히 기동성 유지" } },
        { type: "ANGLE",  value: { en: "Catch guides jab offline, counter fires through the center lane", mn: "Барилт жаабыг офлайн чиглүүлнэ, контер дундын замаар гардаг", ko: "캐치가 잽을 오프라인으로 유도, 카운터는 센터 레인을 통해 발사" } },
        { type: "GUARD",  value: { en: "Catch hand guides their jab, other hand counters simultaneously", mn: "Барих гар тэдний жаабыг чиглүүлнэ, нөгөө гар нэгэн зэрэг контер хийнэ", ko: "캐치 손이 상대 잽을 유도, 다른 손은 동시에 카운터" } },
      ],
      explanation: {
        en: "The catch is a guide, not a block. The rear hand redirects the jab offline while the counter fires through the opening — both happen simultaneously. The gap between catch and counter is where opponents land the next shot. Remove the gap.",
        mn: "Барилт бол блок биш, чиглүүлэгч. Арын гар жаабыг офлайн дахин чиглүүлэх зуур контер нээлт дундуур гардаг — хоёулаа нэгэн зэрэг болдог. Барилт болон контерын хооронд дайсан дараагийн цохилт тусгадаг. Завсрыг арилга.",
        ko: "캐치는 블록이 아닌 유도다. 뒷손이 잽을 오프라인으로 방향을 바꾸는 동안 카운터가 오프닝을 통해 발사된다 — 둘 다 동시에. 캐치와 카운터 사이의 갭이 상대가 다음 샷을 맞추는 곳이다. 갭을 없애라.",
      },
      bodyCue: {
        en: "Feel the catch hand guiding the jab offline while the counter hand is already moving — both hands active at the same time, not one then the other.",
        mn: "Контер гар аль хэдийн хөдөлж байх зуур барих гар жаабыг офлайн чиглүүлж байгааг мэдрэ — хоёр гар нэгэн зэрэг идэвхтэй, нэгийг нь дараа биш.",
        ko: "카운터 손이 이미 움직이는 동안 캐치 손이 잽을 오프라인으로 유도하는 것을 느껴라 — 두 손이 동시에 활성, 하나씩 차례로가 아니라.",
      },
      commonMistake: {
        en: "Catching the jab then countering as two distinct movements. Sequential catch-and-counter is too slow — the opponent has already started their follow-up before your counter is halfway there.",
        mn: "Жаабыг барьж, дараа нь хоёр тусдаа хөдөлгөөн болгон контер хийх. Дараалсан барилт-контер хэтэрхий удаан — контер хагас хүрэхэд дайсан аль хэдийн дараагийн цохилтоо эхлүүлсэн байдаг.",
        ko: "잽을 잡고 두 개의 별개 동작으로 카운터하는 것. 순차적 캐치-카운터는 너무 느리다 — 카운터가 절반도 가지 않은 상태에서 상대는 이미 후속 동작을 시작했다.",
      },
      coachNotes: {
        en: "The catch-and-counter is timing, not strength. You're redirecting the punch, not stopping it. Train until the counter begins before the catch finishes — the overlap is the entire key.",
        mn: "Барилт-контер бол хүч биш, цаг барилт. Цохилтыг зогсоох биш, дахин чиглүүлж байна. Барилт дуусахаас өмнө контер эхлэх хүртэл дасгалжуул — давхцал нь бүх гол зүйл.",
        ko: "캐치-카운터는 힘이 아닌 타이밍이다. 펀치를 멈추는 게 아니라 방향을 바꾸는 것이다. 캐치가 끝나기 전에 카운터가 시작될 때까지 훈련해라 — 오버랩이 핵심 전부다.",
      },
      drillSteps: [
        { en: "Solo: practice catching motion — palm facing opponent, turn inward to guide imaginary jab", mn: "Ганцаарчилсан: барих хөдөлгөөн дасгалжуул — алга дайсан тийш, дотогш эргэж төсөөллийн жааб чиглүүл", ko: "혼자: 캐치 동작 연습 — 손바닥을 상대 쪽으로, 안쪽으로 돌려 가상의 잽 유도" },
        { en: "Partner slow jabs: catch with rear hand 20 reps — guide not block, feel the difference", mn: "Партнер удаан жааб: арын гараар 20 давталт барих — блок биш чиглүүл, ялгааг мэдрэх", ko: "파트너 슬로우 잽: 뒷손으로 20회 캐치 — 블록이 아닌 유도, 차이를 느껴라" },
        { en: "Add counter: catch the jab, right hand counter simultaneously — one motion", mn: "Контер нэм: жааб барих, баруун гарын контер нэгэн зэрэг — нэг хөдөлгөөн", ko: "카운터 추가: 잽을 잡고, 오른손 카운터 동시에 — 하나의 동작" },
        { en: "Speed build: slow × 10, medium × 10, full speed × 10 across multiple sessions", mn: "Хурдыг нэмэгдүүл: удаан × 10, дунд × 10, бүрэн хурд × 10 олон сессийн турш", ko: "속도 증가: 느리게 × 10, 중간 × 10, 전속력 × 10 여러 세션에 걸쳐" },
      ],
    },
    {
      title: "Lead Right Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Orthodox, slight lead-weight step extends reach without telegraphing", mn: "Ортодокс, арай урд жингийн алхам телеграфлалгүйгээр зайг сунгана", ko: "오소독스, 약간의 앞쪽 체중 스텝이 예고 없이 리치를 늘린다" } },
        { type: "WEIGHT", value: { en: "Lead weight transfer adds reach — no backward loading movement", mn: "Урд жингийн шилжилт зайг нэмдэг — арагш ачааллах хөдөлгөөнгүй", ko: "앞쪽 체중 이동이 리치를 더한다 — 뒤로 로딩 움직임 없음" } },
        { type: "ANGLE",  value: { en: "Lead right arrives from unexpected hand position — no windup signal", mn: "Урд баруун гар гэнэтийн гарын позицоос ирдэг — шилүүрдэх дохиогүй", ko: "리드 라이트가 예상치 못한 손 위치에서 온다 — 와인드업 신호 없음" } },
        { type: "GUARD",  value: { en: "Shell position enables instant counter after lead right lands", mn: "Shell позиц урд баруун гар тусмагц шуурхай контерийг боломжтой болгодог", ko: "쉘 포지션이 리드 라이트 착지 후 즉각적인 카운터를 가능하게 한다" } },
      ],
      explanation: {
        en: "The lead right disrupts because it arrives before opponents expect a power punch from that hand. Opponents are calibrated to read orthodox combinations. A power punch from the lead hand breaks the pattern before it starts.",
        mn: "Урд баруун гар тасалдуулдаг, учир нь тэр гараас хүч цохилт хүлээхийн өмнө ирдэг. Дайснууд ортодокс комбинаци уншихаар тохируулагдсан байдаг. Урд гараас хүч цохилт загварыг эхлэхийн өмнө нь эвдэнэ.",
        ko: "리드 라이트는 상대가 그 손에서 파워 펀치를 예상하기 전에 도착하기 때문에 방해한다. 상대는 오소독스 콤비네이션을 읽도록 조율되어 있다. 앞손에서의 파워 펀치가 패턴이 시작되기 전에 깨뜨린다.",
      },
      bodyCue: {
        en: "Feel the lead right arriving without any loading movement — it should almost surprise you when it lands in training.",
        mn: "Урд баруун гар ямар ч ачааллах хөдөлгөөнгүйгээр ирэхийг мэдрэ — дасгалжуулалтад тусмагц чамайг бараг гайхшруулах ёстой.",
        ko: "어떤 로딩 움직임도 없이 리드 라이트가 도착하는 것을 느껴라 — 훈련에서 맞을 때 거의 자신을 놀라게 해야 한다.",
      },
      commonMistake: {
        en: "Loading or cocking the lead right before throwing it. Any backward movement telegraphs the punch and removes all disruption value — it becomes a slow, readable power punch.",
        mn: "Шидэхийн өмнө урд баруун гарыг ачаалах эсвэл бэлтгэх. Ямар ч арагш хөдөлгөөн цохилтыг телеграфладаг, бүх тасалдуулах үнэ цэнийг арилгадаг — удаан, уншигдах хүч цохилт болдог.",
        ko: "던지기 전에 리드 라이트를 로딩하거나 코킹하는 것. 어떤 뒤로의 움직임이든 펀치를 예고하고 모든 방해 가치를 없앤다 — 느리고 읽히는 파워 펀치가 된다.",
      },
      coachNotes: {
        en: "The lead right is a chess move, not a knockout punch. When opponents are too comfortable in their rhythm, this resets everything. Use it when you want to change the flow of the round.",
        mn: "Урд баруун гар бол нокаут цохилт биш, шатарын нүүдэл. Дайснууд хэм дэндүү тайтайгаар байхад энэ бүгдийг дахин тохируулдаг. Раундын урсгалыг өөрчлөхийг хүсэхэд ашиглах.",
        ko: "리드 라이트는 녹아웃 펀치가 아닌 체스 수다. 상대가 자신의 리듬에 너무 편안할 때, 이것이 모든 것을 리셋한다. 라운드의 흐름을 바꾸고 싶을 때 사용해라.",
      },
      drillSteps: [
        { en: "Shadow: practice lead right from Shell — fast, compact, no loading movement", mn: "Сүүдэр: Shell-ээс урд баруун гар дасгалжуул — хурдан, компакт, ачааллах хөдөлгөөнгүй", ko: "섀도우: 쉘에서 리드 라이트 연습 — 빠르게, 컴팩트하게, 로딩 움직임 없이" },
        { en: "Heavy bag: throw lead right as first punch (not jab), feel the unusual entry angle", mn: "Хүнд цүнх: урд баруун гарыг эхний цохилт болгон (жааб биш) шид, ер бусын орох өнцгийг мэдрэх", ko: "헤비백: 리드 라이트를 첫 번째 펀치로 (잽 아님) 던져, 특이한 진입 각도 느끼기" },
        { en: "Partner: use lead right as a 'reset' punch whenever their flow gets comfortable", mn: "Партнер: тэдний урсгал тайтайгаар болгох үед урд баруун гарыг 'дахин тохируулах' цохилт болгон ашиглах", ko: "파트너: 그들의 흐름이 편안해질 때마다 리드 라이트를 '리셋' 펀치로 사용" },
        { en: "Follow-up: lead right opens the left side — immediately follow with conventional combinations", mn: "Дагалт: урд баруун гар зүүн талыг нээнэ — нэн даруй уламжлалт комбинацуудаар дагах", ko: "후속: 리드 라이트가 왼쪽을 열어준다 — 즉시 일반적인 콤비네이션으로 이어가라" },
      ],
    },
  ],

  // ── Manny Pacquiao ──────────────────────────────────────────────────────────
  "manny-pacquiao": [
    {
      title: "Southpaw Foot Position",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Right foot steps outside opponent's lead foot before engaging", mn: "Баруун хөл оролцохын өмнө дайсны урд хөлийн гадна алхана", ko: "오른발이 교전 전 상대의 앞발 바깥으로 스텝" } },
        { type: "WEIGHT", value: { en: "Weight transfers onto outside right foot naturally on landing", mn: "Жин газардахад байгалиараа гадна баруун хөлд шилждэг", ko: "착지 시 체중이 자연스럽게 바깥쪽 오른발로 이동" } },
        { type: "ANGLE",  value: { en: "Outside foot closes their cross angle, opens center lane for left", mn: "Гадна хөл тэдний кросс өнцгийг хаана, зүүн гарт зориулан дундын зам нээнэ", ko: "바깥발이 상대의 크로스 각도를 닫고, 왼손을 위한 센터 레인을 열어준다" } },
        { type: "GUARD",  value: { en: "Guard maintained during the placement step — no drop to step", mn: "Байрлуулах алхамын үед guard хадгалагдана — алхаханд унагахгүй", ko: "배치 스텝 중 가드 유지 — 스텝을 위해 내리지 않는다" } },
      ],
      explanation: {
        en: "Right foot outside their lead foot closes their most dangerous punch (the right cross) while opening a direct center lane for the left straight. One step removes their best weapon and gives you yours — all in one placement.",
        mn: "Баруун хөлийг тэдний урд хөлийн гадна тавих нь тэдний хамгийн аюултай цохилт (баруун кросс)-ыг хааж, зүүн шулуун гарт шууд дундын зам нээдэг. Нэг алхам тэдний хамгийн сайн зэвсгийг арилгаж, чинийхийг өгдөг — бүгдийг нэг байрлуулалтаар.",
        ko: "오른발을 상대 앞발 바깥에 놓으면 그들의 가장 위험한 펀치(오른쪽 크로스)를 닫으면서 왼쪽 스트레이트를 위한 직접적인 센터 레인을 열어준다. 한 스텝이 상대의 최고 무기를 없애고 당신의 것을 준다 — 하나의 배치로 모두.",
      },
      bodyCue: {
        en: "Feel your right foot fully clear of their lead foot before throwing — if it's not fully outside, don't throw the left.",
        mn: "Шидэхийн өмнө баруун хөл тэдний урд хөлийг бүрэн давсан эсэхийг мэдрэ — бүрэн гадна биш бол зүүн гар шидэхгүй.",
        ko: "던지기 전에 오른발이 상대 앞발을 완전히 벗어났는지 느껴라 — 완전히 바깥이 아니면 왼손을 던지지 마라.",
      },
      commonMistake: {
        en: "Stepping beside their foot rather than outside it. 'Beside' keeps you in their cross line. 'Outside' removes their cross angle entirely — the difference of a few centimeters changes everything.",
        mn: "Хөлийн гадна биш, хажуунд нь алхах. 'Хажуунд' нь чамайг тэдний кросс шугаманд байлгадаг. 'Гадна' нь тэдний кросс өнцгийг бүрэн арилгадаг — хэдхэн сантиметрийн ялгаа бүгдийг өөрчилдөг.",
        ko: "바깥이 아닌 옆에 스텝하는 것. '옆'은 당신을 크로스 라인 안에 두게 한다. '바깥'은 크로스 각도를 완전히 없앤다 — 몇 센티미터의 차이가 모든 것을 바꾼다.",
      },
      coachNotes: {
        en: "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place that foot first before throwing anything.",
        mn: "Хөлийн байрлал бол цохилтын зөвшөөрөл. Гадна хөл = зүүн шулуун цэвэр. Дотоод хөл = тэдний аюулын бүсэд байна. Ямар нэгэн зүйл шидэхийн өмнө тэр хөлийг эхлээд тавь.",
        ko: "발 위치는 펀치 허가다. 바깥발 = 왼쪽 스트레이트 클리어. 안쪽발 = 상대의 위험 구역에 있다. 무엇이든 던지기 전에 그 발을 먼저 놓아라.",
      },
      drillSteps: [
        { en: "Against partner: practice only stepping outside their foot 20 reps — no punch added yet", mn: "Партнертэй: зөвхөн тэдний хөлийн гадна алхах дасгал 20 давталт — цохилт нэмэлгүй", ko: "파트너 상대: 상대 발 바깥으로 스텝하는 것만 20회 연습 — 아직 펀치 추가 없음" },
        { en: "Add the punch: outside foot placement, then left straight down the center", mn: "Цохилт нэм: гадна хөлийн байрлуулалт, дараа нь дундаар зүүн шулуун гар", ko: "펀치 추가: 바깥발 배치, 그리고 센터로 왼쪽 스트레이트" },
        { en: "Partner check: after foot placement, partner tries their right cross — it should miss cleanly", mn: "Партнер шалгалт: хөл байрлуулсны дараа партнер баруун кросс оролдоно — цэвэр алдах ёстой", ko: "파트너 체크: 발 배치 후, 파트너가 오른쪽 크로스 시도 — 깔끔하게 빗나가야 한다" },
        { en: "Speed entry: from distance, explosive step to outside position, immediate left straight", mn: "Хурдан орох: зайгаас, гадна позиц руу тэсрэлтийн алхам, нэн даруй зүүн шулуун гар", ko: "스피드 엔트리: 거리에서, 바깥 포지션으로 폭발적 스텝, 즉시 왼쪽 스트레이트" },
      ],
    },
    {
      title: "Explosive Zero-Step",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "No prep step — first movement is the real movement at full speed", mn: "Бэлтгэл алхамгүй — эхний хөдөлгөөн нь бүрэн хурданд жинхэнэ хөдөлгөөн", ko: "준비 스텝 없음 — 첫 번째 움직임이 전속력의 실제 움직임이다" } },
        { type: "WEIGHT", value: { en: "No preliminary weight loading before entry — no observable tell", mn: "Оролтын өмнө урьдчилсан жин ачааллалгүй — ажиглагдах тэмдэггүй", ko: "진입 전 예비 체중 로딩 없음 — 관찰 가능한 텔 없음" } },
        { type: "ANGLE",  value: { en: "Entry angle established by foot placement, not forward body lean", mn: "Оролтын өнцөг урагш биеийн хазайлтаар биш, хөлийн байрлуулалтаар тогтоогдоно", ko: "진입 각도는 앞으로 몸 기울기가 아닌 발 배치로 설정된다" } },
        { type: "GUARD",  value: { en: "Guard up from stillness — don't drop arms before the explosion", mn: "Зогсонги байдлаас guard дээшлүүлэх — тэсрэлтийн өмнө гараа унагахгүй", ko: "정지 상태에서 가드 올리기 — 폭발 전 팔을 내리지 마라" } },
      ],
      explanation: {
        en: "The first movement is real movement at full speed. Most fighters take a small prep shuffle before entry — opponents read that shuffle and prepare. Remove the prep step and there's no signal to read. You're already arriving before they decide to react.",
        mn: "Эхний хөдөлгөөн нь бүрэн хурданд жинхэнэ хөдөлгөөн. Ихэнх тулаанчид оролтын өмнө жижиг бэлтгэл шамшиглалт хийдэг — дайснууд тэр шамшиглалтыг уншиж бэлддэг. Бэлтгэл алхамыг арилга, уншигдах дохио байхгүй болно. Тэд хариу үйлдэл хийхийг шийдэхийн өмнө аль хэдийн хүрч байна.",
        ko: "첫 번째 움직임이 전속력의 실제 움직임이다. 대부분의 파이터는 진입 전 작은 준비 셔플을 한다 — 상대는 그 셔플을 읽고 준비한다. 준비 스텝을 없애면 읽을 신호가 없다. 그들이 반응할지 결정하기 전에 이미 도착하고 있다.",
      },
      bodyCue: {
        en: "Feel the stillness before the explosion — the first movement should feel sudden even to yourself.",
        mn: "Тэсрэлтийн өмнөх тайван байдлыг мэдрэ — эхний хөдөлгөөн өөртөө ч гэсэн гэнэтийн мэдрэмж өгөх ёстой.",
        ko: "폭발 전 정지 상태를 느껴라 — 첫 번째 움직임은 자신에게도 갑작스럽게 느껴져야 한다.",
      },
      commonMistake: {
        en: "Taking a small shuffle step before the entry. That half-step is visible at full speed and gives opponents enough warning to prepare their counter before you arrive.",
        mn: "Оролтын өмнө жижиг шамшиглалтын алхам хийх. Тэр хагас алхам бүрэн хурданд харагддаг бөгөөд дайснуудад чи хүрэхийн өмнө контерийг бэлдэхэд хангалттай анхааруулга өгдөг.",
        ko: "진입 전 작은 셔플 스텝을 하는 것. 그 반발 스텝은 전속력에서 보이고, 당신이 도착하기 전에 상대에게 카운터를 준비할 충분한 경고를 준다.",
      },
      coachNotes: {
        en: "Most fighters take a 'prep step' before entering — a small shuffle before the real movement. This telegraph is what opponents read. Practice explosive first-step from complete stillness.",
        mn: "Ихэнх тулаанчид оролтын өмнө 'бэлтгэл алхам' хийдэг — жинхэнэ хөдөлгөөний өмнө жижиг шамшиглалт. Энэ телеграф бол дайснуудын уншдаг зүйл. Бүрэн тайван байдлаас тэсрэлтийн эхний алхамыг дасгалжуул.",
        ko: "대부분의 파이터가 진입 전 '준비 스텝'을 한다 — 실제 움직임 전 작은 셔플. 이 텔레그래프가 상대가 읽는 것이다. 완전한 정지 상태에서 폭발적인 첫 스텝을 연습해라.",
      },
      drillSteps: [
        { en: "Reactive sprint: start stationary, partner signals, explode to heavy bag at full speed immediately", mn: "Реактив гүйлт: зогсонги байдлаас эхлэх, партнер дохио өгнө, нэн даруй бүрэн хурдаар хүнд цүнх рүү тэсрэх", ko: "반응 스프린트: 정지 상태에서 시작, 파트너 신호, 즉시 전속력으로 헤비백으로 폭발" },
        { en: "Shadow from freeze: stand completely still, then explode into full combination — no prep movement", mn: "Хөлдөлтөөс сүүдэр: бүрэн тайван зогс, дараа нь бүрэн комбинац руу тэсрэх — бэлтгэл хөдөлгөөнгүй", ko: "프리즈에서 섀도우: 완전히 정지, 그리고 풀 콤비네이션으로 폭발 — 준비 움직임 없이" },
        { en: "Film yourself: watch for small weight shifts before entries — eliminate any observable tells", mn: "Өөрийгөө бич: оролтын өмнө жижиг жингийн шилжилтийг хай — ажиглагдах тэмдэг бүрийг арилга", ko: "스스로 촬영: 진입 전 작은 체중 이동을 찾아라 — 관찰 가능한 텔을 모두 없애라" },
        { en: "Footwork ladder: explosive first step in and out — trains the neural response to fire from stillness", mn: "Хөлийн ажлын шат: тэсрэлтийн эхний алхам орж гарах — тайван байдлаас гарт гал гаргах мэдрэлийн хариу үйлдлийг дасгалжуулна", ko: "풋워크 래더: 폭발적인 첫 스텝 인아웃 — 정지 상태에서 발사하는 신경 반응 훈련" },
      ],
    },
    {
      title: "Southpaw High-Low Left",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Stable base — both shots fired from same foot position", mn: "Тогтвортой суурь — хоёр цохилт ижил хөлийн позицоос гардаг", ko: "안정적인 베이스 — 두 샷 모두 같은 발 위치에서 발사" } },
        { type: "WEIGHT", value: { en: "Hip drives both independently — weight shifts with each", mn: "Нуруу хоёуланг нь бие даан жолооддог — жин тус бүрд шилждэг", ko: "힙이 둘 다 독립적으로 구동한다 — 각각과 함께 체중 이동" } },
        { type: "ANGLE",  value: { en: "First left travels high angle, second left drops below the guard", mn: "Эхний зүүн гар өндөр өнцгөөр явдаг, хоёр дахь зүүн гар guard-ын доор буудаг", ko: "첫 번째 왼손은 높은 각도, 두 번째 왼손은 가드 아래로 떨어진다" } },
        { type: "GUARD",  value: { en: "Watch their guard response — elbow rising is the entry signal", mn: "Тэдний guard хариу үйлдлийг ажиглах — тохой өргөгдөх нь оролтын дохио", ko: "상대 가드 반응을 주시 — 팔꿈치 올라가는 것이 진입 신호" } },
      ],
      explanation: {
        en: "Throw the left to the head genuinely — a fake doesn't produce a real guard response. Watch the elbows rise. The moment they do, the second left drops to the now-exposed body. Read and react; never preset.",
        mn: "Зүүн гарыг толгойд жинхэнэ шид — хуурамч нь жинхэнэ guard хариу үйлдэл өгдөггүй. Тохой өргөгдөхийг ажиглах. Тэд өргөгдмөгц хоёр дахь зүүн гар одоо ил болсон биед буудаг. Уншиж хариу үйлдэл хийх; хэзээ ч урьдчилан тохируулахгүй.",
        ko: "왼손을 머리에 진짜로 던져라 — 가짜는 진짜 가드 반응을 만들지 않는다. 팔꿈치가 올라가는 것을 주시해라. 그 순간, 두 번째 왼손이 이제 노출된 바디로 떨어진다. 읽고 반응해라; 절대 사전 설정하지 마라.",
      },
      bodyCue: {
        en: "Feel your eyes tracking the guard response before committing the second left — the body shot only fires when you see the elbows actually lifting.",
        mn: "Хоёр дахь зүүн гарыг шийдэхийн өмнө нүд нь guard хариу үйлдлийг мөрдөж байгааг мэдрэ — биеийн цохилт зөвхөн тохой жинхэнэ өргөгдөхийг харахад гардаг.",
        ko: "두 번째 왼손을 결정하기 전에 눈이 가드 반응을 추적하는 것을 느껴라 — 바디 샷은 팔꿈치가 실제로 올라가는 것을 볼 때만 발사된다.",
      },
      commonMistake: {
        en: "Throwing head-body as a preset sequence regardless of guard response. The switch only works when the body shot follows a genuine head threat that moved the guard — preset combinations don't create real openings.",
        mn: "Guard хариу үйлдэлийг үл харгалзан толгой-бие урьдчилан тохируулсан дарааллаар шидэх. Шилжилт нь зөвхөн биеийн цохилт guard-ыг хөдөлгөсөн жинхэнэ толгойн аюулын дараа гарахад л ажилладаг — урьдчилан тохируулсан комбинаци жинхэнэ нээлт бүтээдэггүй.",
        ko: "가드 반응과 관계없이 헤드-바디를 사전 설정된 순서로 던지는 것. 스위치는 가드를 움직인 진짜 머리 위협 다음에 바디 샷이 따라올 때만 작동한다 — 사전 설정 콤비네이션은 진짜 오프닝을 만들지 않는다.",
      },
      coachNotes: {
        en: "Only works if the head punch is genuine — a fake doesn't trigger a real guard response. Commit to the head shot, watch the response, then decide. Read first, then switch.",
        mn: "Зөвхөн толгойн цохилт жинхэнэ байхад л ажилладаг — хуурамч нь жинхэнэ guard хариу үйлдлийг өдөөдөггүй. Толгойн цохилтод тулгар, хариу үйлдлийг ажиглаж, дараа нь шийд. Эхлээд унш, дараа нь шилж.",
        ko: "머리 펀치가 진짜일 때만 작동한다 — 가짜는 진짜 가드 반응을 유발하지 않는다. 머리 샷에 전념하고, 반응을 주시하고, 그리고 결정해라. 먼저 읽고, 그리고 스위치해라.",
      },
      drillSteps: [
        { en: "Double left drill: 1st left to head level, pause, 2nd left drops to body level", mn: "Хос зүүн гарын дасгал: 1-р зүүн гар толгойн түвшинд, зогсолт, 2-р зүүн гар биеийн түвшинд буудаг", ko: "더블 레프트 드릴: 첫 번째 왼손 머리 레벨, 멈춤, 두 번째 왼손 바디 레벨로 떨어진다" },
        { en: "Speed build: reduce the pause between head and body lefts over sessions", mn: "Хурдыг нэмэгдүүл: сессийн дотор толгой болон биеийн зүүн гаруудын хооронд зогсолтыг багасга", ko: "속도 증가: 세션마다 머리와 바디 왼손 사이의 멈춤을 줄여라" },
        { en: "Watch the guard: ask partner to show their guard — notice how long it takes to drop from high to low", mn: "Guard-ыг ажиглах: партнерт guard-аа харуулахыг хүс — өндрөөс доош буухад хэр их хугацаа зарцуулагддагийг анхаарна уу", ko: "가드 주시: 파트너에게 가드를 보여달라고 — 높은 데서 낮은 데로 내리는 데 얼마나 걸리는지 주목해라" },
        { en: "Heavy bag: tape two zones, practice left-high then left-low as one reactive combination", mn: "Хүнд цүнх: хоёр бүсийг таптаар тэмдэглэ, зүүн-өндөр дараа нь зүүн-доош нэг реактив комбинац болгон дасгалжуул", ko: "헤비백: 두 구역 테이프 표시, 왼쪽-높게 그리고 왼쪽-낮게를 하나의 반응 콤비네이션으로 연습" },
      ],
    },
  ],

  // ── Roberto Duran ────────────────────────────────────────────────────────────
  "roberto-duran": [
    {
      title: "Inside Head Control",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Inside range — weight centered and grounded, both fighters close", mn: "Дотоод зай — жин голд тогтворжиж, хоёр тулаанч ойр", ko: "인사이드 거리 — 체중 중앙에 고정, 두 파이터 근접" } },
        { type: "WEIGHT", value: { en: "Stable body weight used for control, not movement or momentum", mn: "Тогтвортой биеийн жин хяналтад ашиглагддаг, хөдөлгөөн эсвэл хурдасгалд биш", ko: "안정적인 체중이 움직임이나 모멘텀이 아닌 컨트롤에 사용된다" } },
        { type: "ANGLE",  value: { en: "Lead hand guides head into alignment for the punching hand's lane", mn: "Урд гар толгойг цохих гарын зам руу хэвтрүүлж чиглүүлнэ", ko: "앞손이 머리를 펀치 손 레인에 정렬되도록 유도한다" } },
        { type: "GUARD",  value: { en: "Control hand is active, not passive — it steers and blocks", mn: "Хяналтын гар идэвхтэй, идэвхгүй биш — жолоодож блок хийдэг", ko: "컨트롤 손은 수동이 아닌 능동적 — 조종하고 블록한다" } },
      ],
      explanation: {
        en: "Lead hand guides head position, punching hand follows. When you control where someone's head faces, you control what they can see and where they can reach. The control hand is more valuable than the punch — it creates the opening first.",
        mn: "Урд гар толгойн позицийг чиглүүлж, цохих гар дагадаг. Хэн нэгний толгой хаашаа харахыг хянахад тэд юу харж, хаана хүрч чадахыг хянадаг. Хяналтын гар нь цохилтоос илүү үнэ цэнтэй — энэ нь эхлээд нээлтийг бүтээдэг.",
        ko: "앞손이 머리 위치를 유도하고, 펀치 손이 따른다. 누군가의 머리가 어디를 향하는지 컨트롤하면, 그들이 무엇을 보고 어디에 닿을 수 있는지를 컨트롤한다. 컨트롤 손이 펀치보다 더 가치 있다 — 먼저 오프닝을 만들기 때문이다.",
      },
      bodyCue: {
        en: "Feel your lead hand as a guiding tool, not a resting hand — it should feel like you're actively steering, not passively holding.",
        mn: "Урд гараа амраах гар биш, чиглүүлэх хэрэгсэл болгож мэдрэ — идэвхгүй барьж биш, идэвхтэй жолоодож байгаа мэт мэдрэгдэх ёстой.",
        ko: "앞손을 쉬는 손이 아닌 유도 도구로 느껴라 — 수동적으로 잡고 있는 것이 아니라 능동적으로 조종하는 것처럼 느껴져야 한다.",
      },
      commonMistake: {
        en: "Using the control hand passively. Placing a hand on the opponent's shoulder or head without active guidance doesn't create the alignment needed — it's just a touch, not a position change.",
        mn: "Хяналтын гарыг идэвхгүй ашиглах. Идэвхтэй чиглүүлэлтгүйгээр дайсны мөр эсвэл толгойд гар тавих нь шаардлагатай хэвтрэлтийг бүтээдэггүй — энэ нь зүгээр хүрэлцэлт, байрлалын өөрчлөлт биш.",
        ko: "컨트롤 손을 수동적으로 사용하는 것. 능동적 유도 없이 상대 어깨나 머리에 손을 얹는 것은 필요한 정렬을 만들지 않는다 — 그냥 터치일 뿐, 위치 변화가 아니다.",
      },
      coachNotes: {
        en: "Head control is leverage. When you control where someone's head faces, you control what they can see and where they can hit. The control hand is more valuable than the punch in close range.",
        mn: "Толгойн хяналт бол хөшүүрэг. Хэн нэгний толгой хаашаа харахыг хянахад тэд юу харж, хаана цохиж чадахыг хянадаг. Хяналтын гар ойр зайд цохилтоос илүү үнэ цэнтэй.",
        ko: "머리 컨트롤은 레버리지다. 누군가의 머리가 어디를 향하는지 컨트롤하면, 그들이 무엇을 보고 어디를 칠 수 있는지를 컨트롤한다. 컨트롤 손은 근거리에서 펀치보다 더 가치 있다.",
      },
      drillSteps: [
        { en: "Partner drill: lead hand on partner's shoulder (light pressure) before throwing body shot", mn: "Партнер дасгал: биеийн цохилт шидэхийн өмнө урд гараа партнерын мөрөнд тавих (хөнгөн даралт)", ko: "파트너 드릴: 바디 샷 던지기 전 앞손을 파트너 어깨에 (가벼운 압박)" },
        { en: "Clinch position: establish head control, create body shot opening, safely exit", mn: "Клинч позиц: толгойн хяналт тогтоох, биеийн цохилтын нээлт бүтээх, аюулгүйгээр гарах", ko: "클린치 자세: 머리 컨트롤 확립, 바디 샷 오프닝 만들기, 안전하게 탈출" },
        { en: "Shadow: throw all inside combinations with one hand as 'guide' and one as 'hitter'", mn: "Сүүдэр: бүх дотоод комбинацийг нэг гараар 'чиглүүлэгч', нэг гараар 'цохигч' болгон шидэх", ko: "섀도우: 한 손은 '가이드', 한 손은 '히터'로 모든 인사이드 콤비네이션 던지기" },
        { en: "3-beat sequence: lead hand touches → body rotates → punching hand follows", mn: "3 цохилтын дараалал: урд гар хүрнэ → бие эргэнэ → цохих гар дагана", ko: "3박자 시퀀스: 앞손 터치 → 몸 회전 → 펀치 손 따라온다" },
      ],
    },
    {
      title: "Rhythm Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Footwork rhythm varies with punch rhythm — both unpredictable", mn: "Хөлийн ажлын хэм цохилтын хэмтэй хамт хувьсдаг — хоёулаа тааварлашгүй", ko: "풋워크 리듬이 펀치 리듬과 함께 변한다 — 둘 다 예측 불가" } },
        { type: "WEIGHT", value: { en: "Weight loading speed varies — explosive sometimes, deliberate others", mn: "Жин ачааллах хурд хувьсдаг — заримдаа тэсрэлтийн, заримдаа зориудын", ko: "체중 로딩 속도가 변한다 — 때로는 폭발적, 때로는 의도적" } },
        { type: "ANGLE",  value: { en: "Same angle, different timing — confusion comes from when, not where", mn: "Ижил өнцөг, өөр цаг барилт — будилаан хаанаас биш, хэзээнээс ирдэг", ko: "같은 각도, 다른 타이밍 — 혼란은 어디서가 아닌 언제에서 온다" } },
        { type: "GUARD",  value: { en: "Guard timing also varies — don't be readable from any position", mn: "Guard-ын цаг барилт ч мөн хувьсдаг — ямар ч позицоос уншигдахгүй байх", ko: "가드 타이밍도 변한다 — 어떤 자세에서도 읽히지 마라" } },
      ],
      explanation: {
        en: "Vary punch timing, not punch power. Power changes are visible in the body before the punch arrives. Timing changes are invisible until the punch lands. Off-beat timing breaks the counter-timing patterns opponents develop within a round.",
        mn: "Цохилтын хүч биш, цохилтын цаг барилтыг хувьсгах. Хүчний өөрчлөлт нь цохилт ирэхийн өмнө биед харагддаг. Цаг барилтын өөрчлөлт нь цохилт тусах хүртэл харагддаггүй. Хэмнэлтэй бус цаг барилт нь дайснуудад нэг раундад хөгжүүлсэн контер-цаг барилтын загварыг эвддэг.",
        ko: "펀치 파워가 아닌 펀치 타이밍을 변화시켜라. 파워 변화는 펀치가 도착하기 전에 몸에서 보인다. 타이밍 변화는 펀치가 착지할 때까지 보이지 않는다. 박자가 어긋난 타이밍이 상대가 한 라운드 내에서 개발하는 카운터-타이밍 패턴을 깨뜨린다.",
      },
      bodyCue: {
        en: "Feel the deliberate pause or rush in your timing — the discomfort of breaking your own rhythm is exactly what creates the opening.",
        mn: "Цаг барилтын зориудын зогсолт эсвэл яарахыг мэдрэ — өөрийн хэмийг эвдэх тухтай бус байдал нь яг нээлтийг бүтээдэг зүйл.",
        ko: "타이밍에서 의도적인 멈춤이나 급함을 느껴라 — 자신의 리듬을 깨는 불편함이 정확히 오프닝을 만드는 것이다.",
      },
      commonMistake: {
        en: "Changing punch power instead of punch timing. Slowing a punch down is visible in the shoulder and arm before it lands. Changing when it arrives is invisible until it connects.",
        mn: "Цохилтын цаг барилтын оронд цохилтын хүчийг өөрчлөх. Цохилтыг удаашруулах нь тусахаас өмнө мөр болон гарт харагддаг. Хэзээ ирэхийг өөрчлөх нь холбогдох хүртэл харагддаггүй.",
        ko: "펀치 타이밍 대신 펀치 파워를 바꾸는 것. 펀치를 느리게 하면 착지 전에 어깨와 팔에서 보인다. 언제 도착하는지를 바꾸면 연결될 때까지 보이지 않는다.",
      },
      coachNotes: {
        en: "Rhythm is a double-edged weapon. Your rhythm helps you land combinations. But predictable rhythm helps opponents counter. Learn to throw the same combinations at different speeds within the same round.",
        mn: "Хэм бол хоёр ирмэгтэй зэвсэг. Чиний хэм комбинаци тусгахад тусалдаг. Гэхдээ тааварлаж болох хэм дайснуудын контерт тусалдаг. Нэг раундад ижил комбинацийг өөр өөр хурдаар шидэхийг сур.",
        ko: "리듬은 양날의 무기다. 당신의 리듬이 콤비네이션을 맞추는 데 도움이 된다. 하지만 예측 가능한 리듬은 상대의 카운터를 돕는다. 같은 라운드 내에서 같은 콤비네이션을 다른 속도로 던지는 것을 배워라.",
      },
      drillSteps: [
        { en: "Metronome drill: punch to a beat, then deliberately fall off by half a count", mn: "Метроном дасгал: хэмд цох, дараа нь зориудаар хагас хэмээр унах", ko: "메트로놈 드릴: 박자에 맞춰 펀치, 그리고 의도적으로 반 박자 어긋나기" },
        { en: "Shadow with counts: 1-2-3 at normal speed, then 1-2...3 with pause, then 1...2-3 rushing", mn: "Тоолуурын сүүдэр: 1-2-3 хэвийн хурдаар, дараа нь 1-2...3 зогсолттой, дараа нь 1...2-3 яарахтай", ko: "카운트와 섀도우: 1-2-3 일반 속도, 그리고 1-2...3 멈춤과 함께, 그리고 1...2-3 서두르며" },
        { en: "Heavy bag: 1-minute rounds alternating fast combinations and slow deliberate single shots", mn: "Хүнд цүнх: 1 минутын раундыг хурдан комбинаци болон удаан зориудын ганц цохилтуудаар ээлжлэн", ko: "헤비백: 빠른 콤비네이션과 느린 의도적 단일 샷을 교대하는 1분 라운드" },
        { en: "Partner: they try to counter-time your punches — vary rhythm until they consistently miss", mn: "Партнер: тэд чиний цохилтыг контер-цаг барина — тэд тогтмол алдах хүртэл хэмийг хувьсга", ko: "파트너: 그들이 당신의 펀치를 카운터-타이밍하려 한다 — 그들이 일관되게 빗나갈 때까지 리듬을 변화시켜라" },
      ],
    },
    {
      title: "Pressure Walk-In",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: { en: "Continuous forward steps — never retreat, never pause mid-advance", mn: "Тасралтгүй урагш алхам — хэзээ ч ухрахгүй, урагшлах дунд хэзээ ч зогсохгүй", ko: "지속적인 전진 스텝 — 절대 후퇴 없음, 전진 중 절대 멈춤 없음" } },
        { type: "WEIGHT", value: { en: "Forward weight bias throughout — absorb incoming on forward lean", mn: "Туршид урагш жингийн хазайлт — урагш хазайлт дээр ирж буй цохилтыг шингээх", ko: "전반적으로 앞쪽 체중 편향 — 앞으로 기울기에서 들어오는 것 흡수" } },
        { type: "ANGLE",  value: { en: "Walk straight at them — forward pressure forces back into the ropes", mn: "Тэд рүү шулуун алха — урагш даралт тэдийг роп руу буцааж хүчилдэг", ko: "그들을 향해 직선으로 걷기 — 전진 압박이 로프로 밀어낸다" } },
        { type: "GUARD",  value: { en: "Chin down, forehead forward — absorb shots on the hardest skull bone", mn: "Эрүү доош, духан урагш — гавлын хамгийн хатуу ясан дээр цохилтыг шингээх", ko: "턱 아래, 이마 앞으로 — 두개골에서 가장 단단한 뼈에서 샷 흡수" } },
      ],
      explanation: {
        en: "Forward lean and chin down means you absorb on the forehead, not the chin. Continuous forward pressure means the opponent can never fully load a counter — you're arriving before they reset. Pressure is a trained skill, not a personality type.",
        mn: "Урагш хазайлт болон эрүү доош гэдэг нь эрүүн дээр биш, духан дээр шингээдэг. Тасралтгүй урагш даралт нь дайсан хэзээ ч контерыг бүрэн ачааллаж чадахгүй гэсэн үг — тэд дахин тохируулахаас өмнө хүрч байна. Даралт бол зан чанарын төрөл биш, сурсан ур чадвар.",
        ko: "앞으로 기울기와 턱 아래는 턱이 아닌 이마에서 흡수한다는 뜻이다. 지속적인 전진 압박은 상대가 카운터를 완전히 로드할 수 없다는 뜻이다 — 그들이 리셋하기 전에 도착하고 있다. 압박은 성격 유형이 아닌 훈련된 기술이다.",
      },
      bodyCue: {
        en: "Feel your forehead leading forward with chin tucked — if you feel your chin exposed, you're walking in upright instead of forward-leaning.",
        mn: "Эрүү хавчуулж духан урагш удирдахыг мэдрэ — эрүү ил болохыг мэдэрвэл урагш хазайхын оронд тэгшлэн орж байна.",
        ko: "턱을 당기고 이마가 앞으로 나아가는 것을 느껴라 — 턱이 노출된 것을 느끼면, 앞으로 기울기 대신 곧추서서 걷고 있는 것이다.",
      },
      commonMistake: {
        en: "Walking in with the head upright. An upright head walk-in presents the chin as a target. Chin down and forehead forward means you absorb on the hardest part of the skull while advancing.",
        mn: "Толгой тэгшлэн орох. Тэгш толгойн орох нь эрүүг зорилт болгон гаргадаг. Эрүү доош болон духан урагш гэдэг нь урагшлах зуур гавлын хамгийн хатуу хэсгийн дээр шингээдэг.",
        ko: "머리를 곧추세우고 들어가는 것. 곧추선 머리로 들어가면 턱이 목표물이 된다. 턱 아래와 이마 앞으로는 전진하면서 두개골의 가장 단단한 부분에서 흡수한다는 뜻이다.",
      },
      coachNotes: {
        en: "Walking through punches requires correct head position — chin down, forehead forward. The forehead is hard. The chin is not. Take shots on the hardest part while moving forward.",
        mn: "Цохилтоор алхах нь зөв толгойн позиц шаарддаг — эрүү доош, духан урагш. Духан хатуу. Эрүү биш. Урагш хөдөлж байхдаа хамгийн хатуу хэсэгт цохилт ав.",
        ko: "펀치를 뚫고 걷는 것은 올바른 머리 위치가 필요하다 — 턱 아래, 이마 앞으로. 이마는 단단하다. 턱은 그렇지 않다. 앞으로 이동하면서 가장 단단한 부분에서 샷을 받아라.",
      },
      drillSteps: [
        { en: "Walk drill: chin down, forehead forward — partner throws light jabs on your forehead as you advance", mn: "Алхах дасгал: эрүү доош, духан урагш — урагшлах зуур партнер духан дээр чинь хөнгөн жааб шидэнэ", ko: "워크 드릴: 턱 아래, 이마 앞으로 — 전진하는 동안 파트너가 이마에 가벼운 잽 던지기" },
        { en: "Pressure rounds: spend one full sparring round walking forward without stopping regardless of incoming", mn: "Даралтын раундууд: ирж буй цохилтаас үл харгалзан зогсолтгүйгээр урагш алхах нэг бүтэн спарринг раунд зарцуул", ko: "프레셔 라운드: 들어오는 것과 관계없이 멈추지 않고 앞으로 걷는 풀 스파링 라운드 하기" },
        { en: "Head position check: film yourself walking in — chin must be down, head tilted not upright", mn: "Толгойн позиц шалгах: орж байгааг өөрийгөө бич — эрүү доош байх ёстой, толгой хазайсан, тэгш биш", ko: "머리 위치 체크: 들어가는 자신을 촬영 — 턱은 내려가야 하고, 머리는 기울어져야 한다, 곧추서지 않게" },
        { en: "Alternative to slipping: when you'd normally slip, bend knees slightly and lean in instead", mn: "Зайлахын оролдлого: хэвийндээ зайлах үед, өвдгийг арай гулзайлж, оронд нь урагш хазайх", ko: "슬리핑 대안: 보통 슬립할 때, 무릎을 약간 굽히고 대신 안으로 기울어라" },
      ],
    },
  ],
};
