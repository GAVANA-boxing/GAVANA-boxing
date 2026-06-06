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
        { type: "FOOT",   value: "Weight shifts to rear foot simultaneously with shoulder roll" },
        { type: "WEIGHT", value: "Rear weight is the foundation — no rear weight means no real roll" },
        { type: "ANGLE",  value: "Rounded shoulder surface deflects the punch outward, not into you" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal — both active at once" },
      ],
      explanation:
        "Rear weight and shoulder forward happen simultaneously. The rounded surface deflects the punch outward. Combined with the offline weight shift, there's nothing for the opponent to land on — and you're already in counter position when they miss.",
      bodyCue:
        "Feel your rear shoulder rising forward as weight shifts back — both movements are simultaneous, never one then the other.",
      commonMistake:
        "Rolling the shoulder without shifting weight to the rear foot. The roll alone leaves you flat-footed on the power line — you deflect the punch but stay in range of the next one.",
      coachNotes:
        "The shoulder roll is weight management: shift rear, shoulder turns, nothing to hit. When timed correctly, the defender is always outside the punch — safest position in boxing.",
      drillSteps: [
        "Mirror: practice rear shoulder forward roll without incoming — feel the natural mechanics",
        "Partner light touch: partner presses palm toward face, roll so shoulder deflects",
        "Always combine: roll must be accompanied by rear-foot weight transfer every time",
        "Add counter: roll, feel the cross land on shoulder, return short left hook from rolled position",
      ],
    },
    {
      title: "Duck & Short Hook Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot stays planted as anchor — rear foot doesn't move" },
        { type: "WEIGHT", value: "Duck loads the left hip — hook is pre-charged by the duck itself" },
        { type: "ANGLE",  value: "Head moves offline at 45° to the left — not straight down" },
        { type: "GUARD",  value: "Duck is defense and hook setup simultaneously — one movement" },
      ],
      explanation:
        "The duck pre-charges the hook. When the head moves offline left, the left hip naturally loads. The hook is already half-done by the time you're ready to throw it — duck correctly and the counter is automatic. One movement creates both defense and offense.",
      bodyCue:
        "Feel your head moving offline to the left (not just downward) — a straight duck goes forward into the punch, not away from it.",
      commonMistake:
        "Ducking straight down without going offline. A straight duck brings your head onto the punching line instead of off it — you absorb the punch on the top of your head instead of avoiding it.",
      coachNotes:
        "The duck sets up the counter automatically. When you duck properly — head offline, not just bent forward — your left hip naturally loads. The hook is half-done by the duck itself.",
      drillSteps: [
        "Solo duck practice: head must move offline left, not just downward — 20 reps",
        "Partner press: partner extends jab slowly, you duck offline and feel which hook naturally follows",
        "Add counter: duck, pause to confirm position, then release left hook to marked target",
        "Speed build: reduce the pause over sessions until duck-and-counter is one fluid motion",
      ],
    },
    {
      title: "Body Pattern Accumulation",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Mid-range, stable base — same footwork for all accumulated shots" },
        { type: "WEIGHT", value: "Full hip rotation into each body shot — real force, not feelers" },
        { type: "ANGLE",  value: "Jab body, cross body, hook body — same range, pattern not angle" },
        { type: "GUARD",  value: "Maintain head protection between body shots — guard never drops" },
      ],
      explanation:
        "Each body shot forces the opponent to consciously protect their ribs. By shot four or five, the guard drifts down without a decision being made. The head punch at the end lands on a guard that has partially lowered itself. Accumulation only works if every body shot is a genuine threat.",
      bodyCue:
        "Feel real hip rotation into each body shot — if you're not feeling the ribs compress against the bag, the shot isn't real enough to force a guard response.",
      commonMistake:
        "Throwing body shots at half power to 'set them up.' The brain ignores fake threats. Accumulation only works if each shot is a genuine threat the opponent cannot ignore.",
      coachNotes:
        "Body shots are investments. Each one forces the opponent to think about their ribs. By punch 5 or 6, their guard drifts down automatically. Commit to real body shots — the brain ignores fake threats.",
      drillSteps: [
        "Heavy bag: alternate left-right body shots 20 reps, full hip rotation into each one",
        "Pattern set: jab body, cross body, hook body — then switch last punch to head spontaneously",
        "Partner mitts: 4 body calls then 1 surprise head call — boxer transitions instantly",
        "Sparring intent: attack the body for a full round — head punches only as the final switch",
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
        { type: "FOOT",   value: "Step forward with each jab — close distance progressively" },
        { type: "WEIGHT", value: "Forward pressure adds weight to each successive jab" },
        { type: "ANGLE",  value: "Straight jab line — hook follows the natural shoulder position" },
        { type: "GUARD",  value: "High guard between jabs — opponent tries to counter in the gaps" },
      ],
      explanation:
        "Three jabs establish a pattern. By the third, the opponent is solving for jab. The hook arrives from the same hand, same position — unrecognized as a different punch until it's too late to adjust the guard.",
      bodyCue:
        "Feel your steps closing the distance progressively — each jab should land slightly closer than the last.",
      commonMistake:
        "Telegraphing the hook by dropping the left shoulder before throwing it. The hook must emerge from the same position as the jabs — any shoulder drop is readable at full speed.",
      coachNotes:
        "Three jabs teach the opponent to defend jabs. The hook comes from nowhere because they're still solving for jab three. Each jab must be real — telegraphed jabs teach opponents when to expect the hook.",
      drillSteps: [
        "Shadow: triple jab rhythm, stepping forward, one beat between each — smooth before adding hook",
        "Heavy bag: triple jab with forward pressure, move into the bag on each jab",
        "Partner: triple jab, partner signals when to throw hook — builds reactive timing",
        "Sparring: commit to triple jab sets, resist switching to cross early, let the setup build",
      ],
    },
    {
      title: "Systematic Ring Cut",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Diagonal steps — 45° forward left and 45° forward right, alternating" },
        { type: "WEIGHT", value: "Balanced weight enables equal comfort cutting either direction" },
        { type: "ANGLE",  value: "Move toward where they're going, not where they currently are" },
        { type: "GUARD",  value: "Active guard while cutting — never drop during footwork patterns" },
      ],
      explanation:
        "Diagonal footwork cuts escape routes, reducing the available ring with each exchange. You move toward where they want to go — not toward where they are. You arrive at the destination before they do, and their escape route is gone.",
      bodyCue:
        "Feel your diagonal steps arriving before the opponent — you're moving toward their destination, so you get there first.",
      commonMistake:
        "Moving straight toward the opponent to cut them off. Straight pressure they can easily circle around. Diagonal angles remove the escape route instead of just reducing distance.",
      coachNotes:
        "Cutting the ring is about reducing options, not closing distance. Move at 45° angles toward where the opponent wants to go — not toward where they are. You arrive before them.",
      drillSteps: [
        "Floor exercise: mark corners, move imaginary opponent toward corner using diagonal steps only",
        "Shadow: 45° forward angling left and right alternately while maintaining center line",
        "Partner: they try to circle out, you cut off using only angled footwork — no grabbing",
        "Rope drill: force partner to ropes using only positioning and diagonal footwork",
      ],
    },
    {
      title: "In-Close Right Hand",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Step inside at 45° to access the right hand lane" },
        { type: "WEIGHT", value: "Body weight drives the compact right — shoulder forward through" },
        { type: "ANGLE",  value: "Down the middle, compact — elbow drives the punch, not the arm" },
        { type: "GUARD",  value: "Lead hand controls opponent's guard during the inside step" },
      ],
      explanation:
        "Step inside at 45° to access the right hand lane. At inside range, a compact right hand using the shoulder as the driving force delivers the same power as a full cross — in 15 centimeters of travel instead of full extension.",
      bodyCue:
        "Feel your shoulder driving through the punch rather than your hand extending — if you feel the elbow straightening, you've switched to arm power.",
      commonMistake:
        "Extending a full cross at close range. At inside distance, arm extension creates a push with no snap. The power comes from body weight driving through the elbow — not from arm extension.",
      coachNotes:
        "Inside range, extension equals no power. The in-close right hand is a driving motion — elbow forward, body rotates into it. Throw your shoulder through the punch, not your arm.",
      drillSteps: [
        "Heavy bag: chest within 6 inches, throw right hands from body rotation only — arm barely extends",
        "Compare: full cross vs. compact right on the bag — bag travel should be similar if done correctly",
        "Step-in drill: start mid-range, one step inside, immediately compact right — no pause",
        "Partner pads in close: practice stopping inside their jab range and throwing compact right",
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
        { type: "FOOT",   value: "Orthodox stance, weight slightly rear — ready to roll or exit" },
        { type: "WEIGHT", value: "Rear weight bias enables shoulder roll and lateral exits" },
        { type: "ANGLE",  value: "Right shoulder angled forward presents the deflection surface" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal, shoulder protects simultaneously" },
      ],
      explanation:
        "Right hand at the jaw, left arm diagonal, right shoulder forward — three layers of defense from one relaxed position. When timed correctly, the shoulder deflects before you need to actively react. You're always outside the punch before it reaches you.",
      bodyCue:
        "Feel the relaxed weight of your right hand against your jaw — tension in the arm kills the shoulder roll reflex.",
      commonMistake:
        "Holding the Shell position rigidly as a static pose. It works through relaxation and reactive rolling, not through tense defensive holding. Rigid = slow.",
      coachNotes:
        "The Philly Shell is not a waiting posture — it's a counter-punching position. The shoulder deflects, your arm is already at their guard, the counter fires before they finish extending.",
      drillSteps: [
        "Mirror: hold Shell for 60 seconds — right hand by jaw, left arm diagonal, shoulder forward",
        "Walk one full round in Shell — feel what's covered without anything incoming",
        "Partner light touch: partner taps shoulder area, practice rolling with shoulder, not arm",
        "Counter from Shell: partner jabs, shoulder deflects, immediate left hand return — no cocking",
      ],
    },
    {
      title: "Catch & Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork active during catch — never plant both feet to receive" },
        { type: "WEIGHT", value: "No weight commitment during catch — stay completely mobile" },
        { type: "ANGLE",  value: "Catch guides jab offline, counter fires through the center lane" },
        { type: "GUARD",  value: "Catch hand guides their jab, other hand counters simultaneously" },
      ],
      explanation:
        "The catch is a guide, not a block. The rear hand redirects the jab offline while the counter fires through the opening — both happen simultaneously. The gap between catch and counter is where opponents land the next shot. Remove the gap.",
      bodyCue:
        "Feel the catch hand guiding the jab offline while the counter hand is already moving — both hands active at the same time, not one then the other.",
      commonMistake:
        "Catching the jab then countering as two distinct movements. Sequential catch-and-counter is too slow — the opponent has already started their follow-up before your counter is halfway there.",
      coachNotes:
        "The catch-and-counter is timing, not strength. You're redirecting the punch, not stopping it. Train until the counter begins before the catch finishes — the overlap is the entire key.",
      drillSteps: [
        "Solo: practice catching motion — palm facing opponent, turn inward to guide imaginary jab",
        "Partner slow jabs: catch with rear hand 20 reps — guide not block, feel the difference",
        "Add counter: catch the jab, right hand counter simultaneously — one motion",
        "Speed build: slow × 10, medium × 10, full speed × 10 across multiple sessions",
      ],
    },
    {
      title: "Lead Right Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox, slight lead-weight step extends reach without telegraphing" },
        { type: "WEIGHT", value: "Lead weight transfer adds reach — no backward loading movement" },
        { type: "ANGLE",  value: "Lead right arrives from unexpected hand position — no windup signal" },
        { type: "GUARD",  value: "Shell position enables instant counter after lead right lands" },
      ],
      explanation:
        "The lead right disrupts because it arrives before opponents expect a power punch from that hand. Opponents are calibrated to read orthodox combinations. A power punch from the lead hand breaks the pattern before it starts.",
      bodyCue:
        "Feel the lead right arriving without any loading movement — it should almost surprise you when it lands in training.",
      commonMistake:
        "Loading or cocking the lead right before throwing it. Any backward movement telegraphs the punch and removes all disruption value — it becomes a slow, readable power punch.",
      coachNotes:
        "The lead right is a chess move, not a knockout punch. When opponents are too comfortable in their rhythm, this resets everything. Use it when you want to change the flow of the round.",
      drillSteps: [
        "Shadow: practice lead right from Shell — fast, compact, no loading movement",
        "Heavy bag: throw lead right as first punch (not jab), feel the unusual entry angle",
        "Partner: use lead right as a 'reset' punch whenever their flow gets comfortable",
        "Follow-up: lead right opens the left side — immediately follow with conventional combinations",
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
        { type: "FOOT",   value: "Right foot steps outside opponent's lead foot before engaging" },
        { type: "WEIGHT", value: "Weight transfers onto outside right foot naturally on landing" },
        { type: "ANGLE",  value: "Outside foot closes their cross angle, opens center lane for left" },
        { type: "GUARD",  value: "Guard maintained during the placement step — no drop to step" },
      ],
      explanation:
        "Right foot outside their lead foot closes their most dangerous punch (the right cross) while opening a direct center lane for the left straight. One step removes their best weapon and gives you yours — all in one placement.",
      bodyCue:
        "Feel your right foot fully clear of their lead foot before throwing — if it's not fully outside, don't throw the left.",
      commonMistake:
        "Stepping beside their foot rather than outside it. 'Beside' keeps you in their cross line. 'Outside' removes their cross angle entirely — the difference of a few centimeters changes everything.",
      coachNotes:
        "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place that foot first before throwing anything.",
      drillSteps: [
        "Against partner: practice only stepping outside their foot 20 reps — no punch added yet",
        "Add the punch: outside foot placement, then left straight down the center",
        "Partner check: after foot placement, partner tries their right cross — it should miss cleanly",
        "Speed entry: from distance, explosive step to outside position, immediate left straight",
      ],
    },
    {
      title: "Explosive Zero-Step",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "No prep step — first movement is the real movement at full speed" },
        { type: "WEIGHT", value: "No preliminary weight loading before entry — no observable tell" },
        { type: "ANGLE",  value: "Entry angle established by foot placement, not forward body lean" },
        { type: "GUARD",  value: "Guard up from stillness — don't drop arms before the explosion" },
      ],
      explanation:
        "The first movement is real movement at full speed. Most fighters take a small prep shuffle before entry — opponents read that shuffle and prepare. Remove the prep step and there's no signal to read. You're already arriving before they decide to react.",
      bodyCue:
        "Feel the stillness before the explosion — the first movement should feel sudden even to yourself.",
      commonMistake:
        "Taking a small shuffle step before the entry. That half-step is visible at full speed and gives opponents enough warning to prepare their counter before you arrive.",
      coachNotes:
        "Most fighters take a 'prep step' before entering — a small shuffle before the real movement. This telegraph is what opponents read. Practice explosive first-step from complete stillness.",
      drillSteps: [
        "Reactive sprint: start stationary, partner signals, explode to heavy bag at full speed immediately",
        "Shadow from freeze: stand completely still, then explode into full combination — no prep movement",
        "Film yourself: watch for small weight shifts before entries — eliminate any observable tells",
        "Footwork ladder: explosive first step in and out — trains the neural response to fire from stillness",
      ],
    },
    {
      title: "Southpaw High-Low Left",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Stable base — both shots fired from same foot position" },
        { type: "WEIGHT", value: "Hip drives both independently — weight shifts with each" },
        { type: "ANGLE",  value: "First left travels high angle, second left drops below the guard" },
        { type: "GUARD",  value: "Watch their guard response — elbow rising is the entry signal" },
      ],
      explanation:
        "Throw the left to the head genuinely — a fake doesn't produce a real guard response. Watch the elbows rise. The moment they do, the second left drops to the now-exposed body. Read and react; never preset.",
      bodyCue:
        "Feel your eyes tracking the guard response before committing the second left — the body shot only fires when you see the elbows actually lifting.",
      commonMistake:
        "Throwing head-body as a preset sequence regardless of guard response. The switch only works when the body shot follows a genuine head threat that moved the guard — preset combinations don't create real openings.",
      coachNotes:
        "Only works if the head punch is genuine — a fake doesn't trigger a real guard response. Commit to the head shot, watch the response, then decide. Read first, then switch.",
      drillSteps: [
        "Double left drill: 1st left to head level, pause, 2nd left drops to body level",
        "Speed build: reduce the pause between head and body lefts over sessions",
        "Watch the guard: ask partner to show their guard — notice how long it takes to drop from high to low",
        "Heavy bag: tape two zones, practice left-high then left-low as one reactive combination",
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
        { type: "FOOT",   value: "Inside range — weight centered and grounded, both fighters close" },
        { type: "WEIGHT", value: "Stable body weight used for control, not movement or momentum" },
        { type: "ANGLE",  value: "Lead hand guides head into alignment for the punching hand's lane" },
        { type: "GUARD",  value: "Control hand is active, not passive — it steers and blocks" },
      ],
      explanation:
        "Lead hand guides head position, punching hand follows. When you control where someone's head faces, you control what they can see and where they can reach. The control hand is more valuable than the punch — it creates the opening first.",
      bodyCue:
        "Feel your lead hand as a guiding tool, not a resting hand — it should feel like you're actively steering, not passively holding.",
      commonMistake:
        "Using the control hand passively. Placing a hand on the opponent's shoulder or head without active guidance doesn't create the alignment needed — it's just a touch, not a position change.",
      coachNotes:
        "Head control is leverage. When you control where someone's head faces, you control what they can see and where they can hit. The control hand is more valuable than the punch in close range.",
      drillSteps: [
        "Partner drill: lead hand on partner's shoulder (light pressure) before throwing body shot",
        "Clinch position: establish head control, create body shot opening, safely exit",
        "Shadow: throw all inside combinations with one hand as 'guide' and one as 'hitter'",
        "3-beat sequence: lead hand touches → body rotates → punching hand follows",
      ],
    },
    {
      title: "Rhythm Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork rhythm varies with punch rhythm — both unpredictable" },
        { type: "WEIGHT", value: "Weight loading speed varies — explosive sometimes, deliberate others" },
        { type: "ANGLE",  value: "Same angle, different timing — confusion comes from when, not where" },
        { type: "GUARD",  value: "Guard timing also varies — don't be readable from any position" },
      ],
      explanation:
        "Vary punch timing, not punch power. Power changes are visible in the body before the punch arrives. Timing changes are invisible until the punch lands. Off-beat timing breaks the counter-timing patterns opponents develop within a round.",
      bodyCue:
        "Feel the deliberate pause or rush in your timing — the discomfort of breaking your own rhythm is exactly what creates the opening.",
      commonMistake:
        "Changing punch power instead of punch timing. Slowing a punch down is visible in the shoulder and arm before it lands. Changing when it arrives is invisible until it connects.",
      coachNotes:
        "Rhythm is a double-edged weapon. Your rhythm helps you land combinations. But predictable rhythm helps opponents counter. Learn to throw the same combinations at different speeds within the same round.",
      drillSteps: [
        "Metronome drill: punch to a beat, then deliberately fall off by half a count",
        "Shadow with counts: 1-2-3 at normal speed, then 1-2...3 with pause, then 1...2-3 rushing",
        "Heavy bag: 1-minute rounds alternating fast combinations and slow deliberate single shots",
        "Partner: they try to counter-time your punches — vary rhythm until they consistently miss",
      ],
    },
    {
      title: "Pressure Walk-In",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Continuous forward steps — never retreat, never pause mid-advance" },
        { type: "WEIGHT", value: "Forward weight bias throughout — absorb incoming on forward lean" },
        { type: "ANGLE",  value: "Walk straight at them — forward pressure forces back into the ropes" },
        { type: "GUARD",  value: "Chin down, forehead forward — absorb shots on the hardest skull bone" },
      ],
      explanation:
        "Forward lean and chin down means you absorb on the forehead, not the chin. Continuous forward pressure means the opponent can never fully load a counter — you're arriving before they reset. Pressure is a trained skill, not a personality type.",
      bodyCue:
        "Feel your forehead leading forward with chin tucked — if you feel your chin exposed, you're walking in upright instead of forward-leaning.",
      commonMistake:
        "Walking in with the head upright. An upright head walk-in presents the chin as a target. Chin down and forehead forward means you absorb on the hardest part of the skull while advancing.",
      coachNotes:
        "Walking through punches requires correct head position — chin down, forehead forward. The forehead is hard. The chin is not. Take shots on the hardest part while moving forward.",
      drillSteps: [
        "Walk drill: chin down, forehead forward — partner throws light jabs on your forehead as you advance",
        "Pressure rounds: spend one full sparring round walking forward without stopping regardless of incoming",
        "Head position check: film yourself walking in — chin must be down, head tilted not upright",
        "Alternative to slipping: when you'd normally slip, bend knees slightly and lean in instead",
      ],
    },
  ],
};
