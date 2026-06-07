// Fighter Academy profiles — structured educational content for deep study.
// Covers 5 fighters with: system overview, focus areas, signature habit,
// beginner drill, and a reference to the fighter's advanced FIGHTER_TECHNIQUES lesson.

export const FIGHTER_ACADEMY = {

  // ── Mike Tyson ─────────────────────────────────────────────────────────────
  "mike-tyson": {
    systemName: "Peekaboo Pressure System",
    systemEmoji: "💢",
    systemLabel: "PRESSURE SYSTEM",
    diagramType: "guard",
    accentColor: "#FF3B30",

    focusAreas: [
      {
        title: {
          en: "Inside Range Entry",
          mn: "Дотор зайд орох",
          ko: "인사이드 레인지 진입",
        },
        icon: "🎯",
        description: {
          en: "Tyson's offense operated entirely from inside range. Study how he slipped outside the jab and entered simultaneously — the entry itself was the position he wanted, not just a step toward it. The slip and the punch setup were one movement.",
          mn: "Тайсоны дайралт бүрэн гүйцэд дотор зайнаас ажилладаг байсан. Жааб-г гадна талаас зайлуулж нэгэн зэрэг орох хэрхэн хийдгийг судал — зайлуулалт болон цохилт бэлтгэл нь нэг хөдөлгөөн байсан. Жааб-г зайлуулж орсон нь аль хэдийн хүссэн байрлалд нь байсан.",
          ko: "타이슨의 공격은 전적으로 인사이드 레인지에서 이루어졌다. 잽을 아웃사이드로 슬립하며 동시에 진입하는 방식을 연구하라 — 진입 자체가 원하는 포지션이었지, 단순한 한 걸음이 아니었다. 슬립과 펀치 셋업은 하나의 동작이었다.",
        },
      },
      {
        title: {
          en: "Hip-Loaded Hooks",
          mn: "Бүсэлхийгээс ачаалсан hook",
          ko: "힙 로딩 훅",
        },
        icon: "⚡",
        description: {
          en: "Every Tyson hook was pre-charged by loading the rear hip before the punch fired. The hook was half-done by body position — the arm just delivered what the hip had already stored. Watch how his hip moves before the arm does.",
          mn: "Тайсоны бүх hook нь цохилт гаргахаасаа өмнө арын бүсэлхийг ачааллаж урьдчилан цэнэглэгддэг байсан. Hook нь биеийн байрлалаар аль хэдийн хагас хийгдсэн байдаг — гар нь зөвхөн бүсэлхий хуримтлуулсан хүчийг дамжуулдаг. Гар хөдлөхийн өмнө бүсэлхий хэрхэн хөдлөхийг ажиглаарай.",
          ko: "타이슨의 모든 훅은 펀치를 내뻗기 전 뒷쪽 힙을 로딩하여 미리 충전되었다. 훅의 절반은 이미 신체 포지션으로 완성된 것이었다 — 팔은 힙이 저장해 둔 힘을 전달할 뿐이다. 팔이 움직이기 전에 힙이 어떻게 먼저 움직이는지 주목하라.",
        },
      },
      {
        title: {
          en: "Head Movement Between Combos",
          mn: "Комбо хоорондох толгойн хөдөлгөөн",
          ko: "콤보 사이 헤드 무브먼트",
        },
        icon: "🌀",
        description: {
          en: "Even between combinations, Tyson's head was always weaving slightly. No still position held for more than a moment. This made the start of each new combination unpredictable and meant opponents were never timing a stationary target.",
          mn: "Комбо хоорондоо ч гэсэн Тайсоны толгой үргэлж бага зэрэг хэлбэлзэж байдаг байсан. Нэг ч байрлал хэдий зуурт ч тогтдоггүй байсан. Энэ нь шинэ комбо бүрийн эхлэлийг тааварлашгүй болгож, өрсөлдөгч нь хэзээ ч тогтвортой бай тааруулах боломжгүй байсан.",
          ko: "콤보 사이에도 타이슨의 머리는 항상 약간씩 흔들리고 있었다. 잠시도 멈춰 있는 자세가 없었다. 이는 새로운 콤보의 시작을 예측하기 불가능하게 만들었고, 상대는 절대로 정지된 타겟을 타이밍 잡을 수 없었다.",
        },
      },
    ],

    signatureHabit: {
      title: {
        en: "Constant Head Movement",
        mn: "Тасралтгүй толгойн хөдөлгөөн",
        ko: "끊임없는 헤드 무브먼트",
      },
      description: {
        en: "Between every combination and during resets, Tyson maintained a subtle weave — never standing fully upright or stationary. This made him nearly impossible to time cleanly because there was never a fixed target to calibrate against.",
        mn: "Комбо бүрийн хоорондоо болон эргэн тохируулах үед Тайсон нарийн хэлбэлзлийг хадгалдаг байсан — хэзээ ч бүрэн шулуун зогсох эсвэл зогсонги байхгүй. Энэ нь түүнийг цаг тааруулахад бараг боломжгүй болгосон, учир нь тогтвортой бай байхгүй байв.",
        ko: "모든 콤보 사이와 리셋 중에도 타이슨은 미묘한 위빙을 유지했다 — 절대 완전히 똑바로 서거나 정지하지 않았다. 이는 고정된 타겟이 존재하지 않아 타이밍을 잡기가 거의 불가능하게 만들었다.",
      },
      cue: {
        en: "After every combination, dip once before your guard resets. Never stand fully upright between sequences.",
        mn: "Комбо болгоны дараа guard эргэн тохируулахаасаа өмнө нэг удаа доошоо дагна. Дараалал хоорондоо хэзээ ч бүрэн шулуун зогсож болохгүй.",
        ko: "모든 콤보 후에 가드가 리셋되기 전에 한 번 낮추어라. 콤보 사이에 절대 완전히 똑바로 서지 말 것.",
      },
    },

    beginnerDrill: {
      title: {
        en: "Slip & Entry",
        mn: "Зайлах ба орох",
        ko: "슬립 & 진입",
      },
      description: {
        en: "The foundation of the Peekaboo system — slip outside the jab, enter simultaneously.",
        mn: "Peekaboo системийн үндэс — жааб-г гадна талаас зайлуулж нэгэн зэрэг орох.",
        ko: "피카부 시스템의 기초 — 잽을 아웃사이드로 슬립하며 동시에 진입한다.",
      },
      steps: [
        {
          en: "Partner throws slow jabs — you slip outside left (head moves left, rear hip loads)",
          mn: "Партнер удаан жааб өрнө — чи зүүн гадна тийш зайлна (толгой зүүн тийш хөдөлж, арын бүсэлхий ачаалагдана)",
          ko: "파트너가 느린 잽을 던진다 — 왼쪽 아웃사이드로 슬립한다 (머리는 왼쪽으로 이동, 뒷 힙은 로딩)",
        },
        {
          en: "10 reps — no counter yet, just feel the slip and the new position it creates",
          mn: "10 давталт — эсрэг цохилтгүй, зөвхөн зайлалт болон үүсэх шинэ байрлалыг мэдрэх",
          ko: "10회 반복 — 카운터 없이, 슬립과 그로 인해 생기는 새로운 포지션만 느낀다",
        },
        {
          en: "Add the entry step: slip + step inside, both happening simultaneously",
          mn: "Орох алхам нэмэх: зайлах + дотор тийш алхах, хоёул нэгэн зэрэг",
          ko: "진입 스텝 추가: 슬립 + 인사이드 스텝, 두 동작 동시에",
        },
        {
          en: "Feel the angle after the entry — you're slightly to their left side. That's the Tyson position.",
          mn: "Орсны дараах өнцгийг мэдрэх — чи тэдний зүүн талд бага зэрэг байна. Энэ бол Тайсоны байрлал.",
          ko: "진입 후 각도를 느껴라 — 상대의 왼쪽에 약간 위치하게 된다. 그것이 타이슨 포지션이다.",
        },
      ],
    },

    advancedLessonTitle: "Peekaboo Entry",
    advancedLessonNote: {
      en: "Combines slip, entry step, and hook into one fluid motion.",
      mn: "Зайлах, орох алхам, hook-ийг нэг урсгал хөдөлгөөнд нэгтгэнэ.",
      ko: "슬립, 진입 스텝, 훅을 하나의 유동적인 동작으로 결합한다.",
    },
  },

  // ── Dmitry Bivol ──────────────────────────────────────────────────────────
  "dmitry-bivol": {
    systemName: "Soviet Technical Fundamentals",
    systemEmoji: "📐",
    systemLabel: "TECHNICAL SYSTEM",
    diagramType: "angle",
    accentColor: "#3B82F6",

    focusAreas: [
      {
        title: {
          en: "Jab as a System",
          mn: "Жааб — системчилсэн зэвсэг",
          ko: "잽을 시스템으로",
        },
        icon: "👊",
        description: {
          en: "Bivol's jab isn't used primarily for power — it controls distance, disrupts rhythm, and gathers information. Study how he varies jab timing: rhythm jabs to establish a pattern, then a broken-timing jab to catch the guard in transition.",
          mn: "Биволын жааб гол төлөв хүч чадлаар биш хэрэглэгддэг — энэ нь зай хянах, хэмнэл алдагдуулах, мэдээлэл цуглуулахад зориулагддаг. Жааб хэмнэлийг хэрхэн өөрчилдгийг судал: тогтмол жааб-аар загвар тогтоож, дараа нь хэмнэл тасалсан жааб-аар guard-ийг шилжилтийн үед барих.",
          ko: "비볼의 잽은 주로 파워를 위해 사용되지 않는다 — 거리 조절, 리듬 방해, 정보 수집이 목적이다. 잽 타이밍을 어떻게 변화시키는지 연구하라: 패턴을 만드는 리듬 잽을 던진 다음, 박자를 깨는 잽으로 가드가 전환 중일 때를 잡는다.",
        },
      },
      {
        title: {
          en: "Guard Recovery in Motion",
          mn: "Хөдөлгөөнтэй guard эргэн тохируулалт",
          ko: "움직이며 가드 회복",
        },
        icon: "🛡️",
        description: {
          en: "After every combination, Bivol moves laterally before resetting. He never resets guard while stationary. The lateral step and guard recovery are one motion — the movement IS the reset. Study how clean his position is immediately after combination.",
          mn: "Комбо болгоны дараа Бивол guard эргүүлэхийн өмнө хажуу тийш хөдөлдөг. Зогсонги байхдаа guard-ийг хэзээ ч эргүүлдэггүй. Хажуу тийш алхах болон guard сэргээх нь нэг хөдөлгөөн — хөдөлгөөн нь эргэн тохируулалт юм. Комбоны дараа тэр хэр цэвэр байрлалтай байдгийг судал.",
          ko: "모든 콤보 후에 비볼은 리셋하기 전에 측면으로 움직인다. 정지 상태에서 가드를 리셋하는 법이 없다. 측면 스텝과 가드 회복은 하나의 동작이다 — 움직임 자체가 리셋이다. 콤보 직후 포지션이 얼마나 깔끔한지 연구하라.",
        },
      },
      {
        title: {
          en: "Range Ownership",
          mn: "Зай эзэмших",
          ko: "거리 장악",
        },
        icon: "📏",
        description: {
          en: "Bivol's footwork constantly maintains the exact distance where his jab reaches at full extension. When opponents close, he steps back. When they retreat, he steps in. He doesn't chase — he maintains the gap that makes his punches work.",
          mn: "Биволын хөлийн ажиллагаа нь жааб бүрэн сунасан байрлалд хүрэх яг тэр зайг тасралтгүй хадгалдаг. Өрсөлдөгч ойртоход тэр ухарна. Тэд ухрахад тэр урагшилна. Тэр хөөхгүй — цохилтоо ажиллуулдаг зайг хадгалдаг.",
          ko: "비볼의 풋워크는 잽이 완전히 뻗었을 때 닿는 정확한 거리를 끊임없이 유지한다. 상대가 다가오면 뒤로 물러서고, 물러서면 앞으로 들어간다. 쫓아다니지 않는다 — 펀치가 작동하는 간격을 유지하는 것이다.",
        },
      },
    ],

    signatureHabit: {
      title: {
        en: "Guard Resets After Every Single Punch",
        mn: "Цохилт болгоны дараа guard бүрэн эргэн тохируулалт",
        ko: "모든 단일 펀치 후 가드 리셋",
      },
      description: {
        en: "Most fighters reset their guard between combinations. Bivol resets after every individual punch. Guard is fully formed before the next punch fires. This eliminates the exposure window most fighters carry between punches within a combination.",
        mn: "Ихэнх боксчид комбо хоорондоо guard-аа эргүүлдэг. Бивол дан цохилт болгоны дараа эргүүлдэг. Дараагийн цохилт гарахаасаа өмнө guard бүрэн бүрэлдсэн байдаг. Энэ нь ихэнх боксчид комбо дотор цохилт хоорондоо үлдээдэг ил байх цонхыг устгадаг.",
        ko: "대부분의 선수들은 콤보 사이에 가드를 리셋한다. 비볼은 모든 개별 펀치 후에 리셋한다. 다음 펀치가 나가기 전에 가드는 완전히 형성된다. 이는 대부분의 선수들이 콤보 내 펀치 사이에 가지고 있는 노출 창을 없앤다.",
      },
      cue: {
        en: "After every punch — not every combination — consciously feel your guard reform fully before anything else moves.",
        mn: "Комбо болгоны биш — цохилт болгоны дараа — бусад зүйл хөдлөхийн өмнө guard бүрэн бүрдэхийг ухамсартайгаар мэдрэх.",
        ko: "모든 콤보가 아닌 — 모든 펀치 후에 — 다른 것이 움직이기 전에 가드가 완전히 형성되는 것을 의식적으로 느껴라.",
      },
    },

    beginnerDrill: {
      title: {
        en: "Range Finder",
        mn: "Зай тогтоогч",
        ko: "거리 파인더",
      },
      description: {
        en: "Identify your working distance and build automatic footwork to maintain it.",
        mn: "Ажлын зайгаа тодорхойлж, тэрийг хадгалах автомат хөлийн ажиллагааг бий болго.",
        ko: "자신의 워킹 거리를 파악하고 이를 유지하는 자동적인 풋워크를 만들어라.",
      },
      steps: [
        {
          en: "Extend your jab fully — where your fist reaches at full extension is your working distance",
          mn: "Жааб-аа бүрэн сун — мутар бүрэн сунасан байрлалд хүрэх газар таны ажлын зай",
          ko: "잽을 완전히 뻗어라 — 주먹이 완전히 뻗었을 때 닿는 거리가 워킹 거리다",
        },
        {
          en: "Partner actively tries to change the distance: stepping forward, stepping back",
          mn: "Партнер идэвхтэйгээр зайг өөрчлөхийг оролдоно: урагшаа алхах, ухрах",
          ko: "파트너는 적극적으로 거리를 바꾸려 한다: 앞으로 나가거나 뒤로 물러서거나",
        },
        {
          en: "Your only job: maintain that gap — step back when they close, step in when they retreat",
          mn: "Чиний цорын ганц ажил: тэр зайг хадгалах — тэд ойртоход ухрах, ухрахад урагшлах",
          ko: "네 유일한 임무: 그 간격 유지 — 다가오면 물러서고, 물러서면 들어간다",
        },
        {
          en: "3 minutes continuous — if the gap changes, you lost the drill. No pausing.",
          mn: "3 минут тасралтгүй — хэрэв зай өөрчлөгдвөл дасгал алдсан. Зогсолтгүй.",
          ko: "3분 연속 — 간격이 변하면 드릴에서 진 것이다. 멈추지 않는다.",
        },
      ],
    },

    advancedLessonTitle: "Optimal Range Discipline",
    advancedLessonNote: {
      en: "Trains footwork to maintain working distance automatically under pressure.",
      mn: "Дарамт доор ажлын зайг автоматаар хадгалах хөлийн ажиллагааг сургана.",
      ko: "압박 아래서 워킹 거리를 자동으로 유지하는 풋워크를 훈련한다.",
    },
  },

  // ── Naoya Inoue ──────────────────────────────────────────────────────────
  "naoya-inoue": {
    systemName: "Monster Body-Head System",
    systemEmoji: "🦅",
    systemLabel: "BODY-HEAD SYSTEM",
    diagramType: "angle",
    accentColor: "#F97316",

    focusAreas: [
      {
        title: {
          en: "Level Switching",
          mn: "Түвшин солих",
          ko: "레벨 스위칭",
        },
        icon: "⬆️",
        description: {
          en: "Inoue attacks two levels in every combination, and the second shot is always decided by reading the guard response to the first — not programmed in advance. Study how he watches the elbows: when they rise to protect the head, the body opens.",
          mn: "Иноуэ комбо болгонд хоёр түвшинд дайрдаг, хоёр дахь цохилтыг хамгийн эхний цохилтод guard хариу үйлдлийг уншсаны үндсэн дээр шийддэг — урьдчилан тогтоодоггүй. Тохой хэрхэн ажиглагдагийг судал: тохой толгойг хамгаалахын тулд өргөгдөхөд бие нь нээгддэг.",
          ko: "이노우에는 모든 콤보에서 두 레벨을 공격하고, 두 번째 샷은 첫 번째에 대한 가드 반응을 읽어서 결정한다 — 미리 프로그래밍되지 않는다. 팔꿈치를 어떻게 관찰하는지 연구하라: 팔꿈치가 머리를 보호하기 위해 올라가면 몸이 열린다.",
        },
      },
      {
        title: {
          en: "Counter Right Hand",
          mn: "Баруун гарын эсрэг цохилт",
          ko: "카운터 라이트 핸드",
        },
        icon: "🎯",
        description: {
          en: "Inoue draws jabs by presenting a slightly low guard, slips outside before contact, and fires the right hand through the center lane. The slip and counter happen simultaneously — there's no pause or sequential movement between them.",
          mn: "Иноуэ бага зэрэг доогуур guard харуулж жааб татах, хүрэлцэхийн өмнө гадна тийш зайлж, баруун гараар голын замаар цохидог. Зайлах болон эсрэг цохилт нэгэн зэрэг явагддаг — хоорондоо завсарлага эсвэл дараалсан хөдөлгөөн байхгүй.",
          ko: "이노우에는 약간 낮은 가드를 보여 잽을 유도하고, 접촉 전에 아웃사이드로 슬립하며 오른손을 센터 레인을 통해 발사한다. 슬립과 카운터는 동시에 일어난다 — 사이에 멈춤이나 순차적 움직임이 없다.",
        },
      },
      {
        title: {
          en: "Body Shot Accumulation",
          mn: "Биед цохилт хуримтлуулах",
          ko: "바디 샷 누적",
        },
        icon: "📊",
        description: {
          en: "Body shots are investments. Each one forces the opponent's guard down by a fraction. By punch 5 or 6, the guard has drifted without a decision being made. Inoue thinks three combinations ahead when building his body work.",
          mn: "Биед цохилт бол хөрөнгө оруулалт. Тус бүр нь өрсөлдөгчийн guard-ийг бага зэрэг доош шахдаг. 5-6 дахь цохилтод шийдвэр гаргалгүйгээр guard хазайчихсан байдаг. Иноуэ биед ажиллагаагаа бүрдүүлэхдээ гурван комбо урагш боддог.",
          ko: "바디 샷은 투자다. 각각의 샷이 상대의 가드를 조금씩 낮춘다. 5번째나 6번째 펀치쯤이면 결정 없이 가드가 내려와 있다. 이노우에는 바디 워크를 구축할 때 세 콤보 앞을 생각한다.",
        },
      },
    ],

    signatureHabit: {
      title: {
        en: "Two Levels in Every Combination",
        mn: "Комбо болгонд хоёр түвшин",
        ko: "모든 콤보에 두 레벨",
      },
      description: {
        en: "Inoue never throws a combination that doesn't attack two levels. Even a simple jab-cross includes a body variation in the decision tree. His mind is simultaneously throwing the head shot and reading whether the body just opened.",
        mn: "Иноуэ хоёр түвшинд дайрахгүй комбо огт хаядаггүй. Энгийн жааб-cross ч гэсэн шийдвэрийн модонд биед хувилбар агуулдаг. Тэр толгойд цохилт хаяж байхдаа нэгэн зэрэг бие нээгдэж байгаа эсэхийг унших ухаантай.",
        ko: "이노우에는 두 레벨을 공격하지 않는 콤보는 절대 던지지 않는다. 단순한 잽-크로스조차도 결정 트리에 바디 변형이 포함되어 있다. 그의 마음은 동시에 헤드 샷을 날리면서 바디가 방금 열렸는지 읽고 있다.",
      },
      cue: {
        en: "Every combination you throw should include at least one level change — read the guard response, don't preset the switch.",
        mn: "Чиний хаяж байгаа комбо болгон дор хаяж нэг түвшин солих агуулах ёстой — guard хариу үйлдлийг уншаарай, солилтыг урьдчилан тогтоож болохгүй.",
        ko: "네가 던지는 모든 콤보에는 최소 하나의 레벨 변화가 포함되어야 한다 — 가드 반응을 읽어라, 스위치를 미리 설정하지 마라.",
      },
    },

    beginnerDrill: {
      title: {
        en: "Head-to-Body Double Jab",
        mn: "Толгойгоос биед давхар жааб",
        ko: "헤드에서 바디로 더블 잽",
      },
      description: {
        en: "Train the fundamental head-body level switch from the simplest possible movement.",
        mn: "Хамгийн энгийн хөдөлгөөнөөс толгой-бие түвшин солих үндсийг сургах.",
        ko: "가장 단순한 동작에서 기본적인 헤드-바디 레벨 스위치를 훈련한다.",
      },
      steps: [
        {
          en: "Throw first jab to head level — pause, watch partner's guard",
          mn: "Эхний жааб-г толгойн түвшинд хаях — зогсоох, партнерын guard-ийг харах",
          ko: "첫 번째 잽을 헤드 레벨로 던진다 — 멈추고, 파트너의 가드를 관찰한다",
        },
        {
          en: "Did their guard rise? If yes, the body just opened",
          mn: "Тэдний guard өргөгдсөн үү? Тийм бол бие нь нээгдсэн",
          ko: "가드가 올라갔는가? 그렇다면 바디가 열린 것이다",
        },
        {
          en: "Second jab drops to body level — feel the height change",
          mn: "Хоёр дахь жааб биеийн түвшинд буудаг — өндрийн өөрчлөлтийг мэдрэх",
          ko: "두 번째 잽이 바디 레벨로 내려간다 — 높이 변화를 느껴라",
        },
        {
          en: "Reduce the pause over sessions until head-to-body is one flowing reactive decision",
          mn: "Дасгалын явцад завсарлагааг багасгаж, толгойгоос бие рүү нэг урсгал хариу үйлдлийн шийдвэр болтол хүрэх",
          ko: "세션을 거듭하며 멈춤을 줄여 헤드-바디가 하나의 흐르는 반응적 결정이 되도록 한다",
        },
      ],
    },

    advancedLessonTitle: "High-Low Switch",
    advancedLessonNote: {
      en: "Applies reactive level switching at full combination speed.",
      mn: "Комбоны бүрэн хурдаар хариу үйлдэлт түвшин солилтыг хэрэглэнэ.",
      ko: "풀 콤보 속도에서 반응적 레벨 스위칭을 적용한다.",
    },
  },

  // ── Vasyl Lomachenko ─────────────────────────────────────────────────────
  "vasyl-lomachenko": {
    systemName: "Matrix Footwork System",
    systemEmoji: "🌀",
    systemLabel: "MOVEMENT SYSTEM",
    diagramType: "footwork",
    accentColor: "#A855F7",

    focusAreas: [
      {
        title: {
          en: "Foot Placement as Punch Permission",
          mn: "Хөлийн байршил — цохилтын зөвшөөрөл",
          ko: "발 위치 = 펀치 허가",
        },
        icon: "👣",
        description: {
          en: "Lomachenko never punches from a neutral foot position. Every punch is preceded by a foot placement that creates the angle. Study how the lead foot lands outside, beside, or behind the opponent's lead foot — and how that position dictates which punches are available.",
          mn: "Ломаченко хэзээ ч саармаг хөлийн байрлалаас цохидоггүй. Цохилт болгоныг өнцөг бий болгодог хөлийн байршил өмнөлдөг. Урд хөл өрсөлдөгчийн урд хөлний гадна, хажуу, эсвэл ардаа хэрхэн буудагийг судал — тэр байрлал аль цохилт боломжтойг хэрхэн тодорхойлдгийг ажиглаарай.",
          ko: "로마첸코는 중립 발 위치에서 절대 펀치를 던지지 않는다. 모든 펀치에 앞서 각도를 만드는 발 위치가 선행된다. 앞발이 상대의 앞발 외측, 옆, 또는 뒤에 착지하는 방식과 그 위치가 어떤 펀치를 사용 가능하게 하는지 연구하라.",
        },
      },
      {
        title: {
          en: "Angle Changes Mid-Combination",
          mn: "Комбо дунд өнцөг солих",
          ko: "콤보 중간 각도 변경",
        },
        icon: "🔄",
        description: {
          en: "Lomachenko pivots mid-combination so each punch arrives from a different direction. One combination requires three guard adjustments simultaneously — impossible to do. Study how the pivot happens during the punch flow, not as a reset after it.",
          mn: "Ломаченко комбо дунд эргэдэг тул цохилт болгон өөр чиглэлээс ирдэг. Нэг комбо нэгэн зэрэг гурван guard тохируулалт шаарддаг — хийх боломжгүй. Эргэлт цохилтын урсгалын үеэр буухийг судал, дараа нь эргэн тохируулга биш.",
          ko: "로마첸코는 콤보 중간에 피벗하여 각 펀치가 다른 방향에서 도달하게 한다. 하나의 콤보에 세 가지 가드 조정이 동시에 필요하다 — 불가능한 일이다. 피벗이 펀치 흐름 중에 일어나는 방식을 연구하라, 그 후 리셋으로서가 아니라.",
        },
      },
      {
        title: {
          en: "Direction Change Feints",
          mn: "Чиглэл солих хуурмаг хөдөлгөөн",
          ko: "방향 전환 페인트",
        },
        icon: "↔️",
        description: {
          en: "Movement creates commitment. Lomachenko goes one direction until the opponent's weight loads in response, then reverses. The opponent's own reaction becomes the opening. Study how long he waits before reversing — the timing IS the skill.",
          mn: "Хөдөлгөөн нь зобоололт бий болгодог. Ломаченко нэг чиглэлд өрсөлдөгчийн жин хариу үйлдэлд ачаалагдах хүртэл явж, дараа нь эсрэгээр эргэдэг. Өрсөлдөгчийн хариу үйлдэл нь нээлт болдог. Тэр эргэхийн өмнө хэр удаан хүлээдгийг судал — тэр цаг нь ур чадвар юм.",
          ko: "움직임은 커밋을 만든다. 로마첸코는 상대의 체중이 반응으로 실릴 때까지 한 방향으로 가다가 역전한다. 상대 자신의 반응이 개구부가 된다. 역전하기 전에 얼마나 기다리는지 연구하라 — 그 타이밍이 바로 기술이다.",
        },
      },
    ],

    signatureHabit: {
      title: {
        en: "Foot Placement Before Every Punch",
        mn: "Цохилт болгоны өмнө хөлийн байршил",
        ko: "모든 펀치 전 발 위치 확인",
      },
      description: {
        en: "Lomachenko's rule: foot position before punch permission. He never throws from a neutral foot position. The foot is always placed to create an angle first. This makes every punch arrive unexpectedly, and makes it functionally impossible for the guard to cover all angles.",
        mn: "Ломаченкогийн дүрэм: цохилтын зөвшөөрлийн өмнө хөлийн байрлал. Тэр хэзээ ч саармаг хөлийн байрлалаас хаядаггүй. Хөл нь үргэлж эхлээд өнцөг бий болгоход тавигддаг. Энэ нь цохилт болгоныг гэнэтийн байдлаар ирүүлж, guard бүх өнцгийг хаах боломжгүй болгодог.",
        ko: "로마첸코의 규칙: 펀치 허가 전에 발 위치. 중립 발 위치에서 절대 던지지 않는다. 발은 항상 먼저 각도를 만들기 위해 위치한다. 이는 모든 펀치가 예기치 않게 도달하게 하며, 가드가 모든 각도를 커버하는 것을 기능적으로 불가능하게 만든다.",
      },
      cue: {
        en: "Before throwing any punch, check: where is your lead foot? Is it creating an angle, or are you punching from neutral? Neutral means predictable.",
        mn: "Цохилт хаяхаасаа өмнө шалгаарай: урд хөл хаана байна? Өнцөг бий болгож байна уу, эсвэл саармаг байрлалаас цохиж байна уу? Саармаг нь тааварлашуур гэсэн үг.",
        ko: "펀치를 던지기 전에 확인하라: 앞발은 어디에 있는가? 각도를 만들고 있는가, 아니면 중립에서 펀치하고 있는가? 중립은 예측 가능하다는 뜻이다.",
      },
    },

    beginnerDrill: {
      title: {
        en: "Outside Foot Placement",
        mn: "Гадна хөлийн байршил",
        ko: "아웃사이드 발 위치",
      },
      description: {
        en: "Train the single most important positioning element in Lomachenko's system.",
        mn: "Ломаченкогийн системд хамгийн чухал байршлын элементийг сургах.",
        ko: "로마첸코 시스템에서 가장 중요한 포지셔닝 요소를 훈련한다.",
      },
      steps: [
        {
          en: "Partner stands in front — step your lead foot outside their lead foot",
          mn: "Партнер өмнө зогсоно — урд хөлөө тэдний урд хөлний гадна тал руу алхаарай",
          ko: "파트너가 앞에 선다 — 앞발을 상대의 앞발 외측으로 내딛어라",
        },
        {
          en: "20 reps of foot placement only — no punches yet, just feel the new position",
          mn: "20 давталт хөлийн байршил л хийх — цохилтгүй, зөвхөн шинэ байрлалыг мэдрэх",
          ko: "20회 발 위치만 연습 — 아직 펀치 없이, 새로운 포지션만 느낀다",
        },
        {
          en: "Notice: from outside their foot, their right cross angle is completely closed",
          mn: "Анхааралтай ажиглаарай: тэдний хөлний гадна талаас тэдний баруун cross өнцөг бүрэн хаагдсан",
          ko: "주목하라: 발 외측에서 상대의 라이트 크로스 각도가 완전히 닫힌다",
        },
        {
          en: "Add the left straight: outside foot placement, then left straight through the center lane",
          mn: "Зүүн шулуун нэмэх: гадна хөлийн байршил, дараа нь голын замаар зүүн шулуун",
          ko: "레프트 스트레이트 추가: 아웃사이드 발 위치 후 센터 레인을 통한 레프트 스트레이트",
        },
      ],
    },

    advancedLessonTitle: "Outside Foot Entry",
    advancedLessonNote: {
      en: "Explosive outside entry with immediate left straight down the center lane.",
      mn: "Тэсрэлтэт гадна орох хөдөлгөөн болон нэн даруй голын замаар зүүн шулуун.",
      ko: "폭발적인 아웃사이드 진입과 즉각적인 센터 레인 레프트 스트레이트.",
    },
  },

  // ── Floyd Mayweather ─────────────────────────────────────────────────────
  "floyd-mayweather": {
    systemName: "Philly Shell Defense",
    systemEmoji: "👻",
    systemLabel: "DEFENSE SYSTEM",
    diagramType: "guard",
    accentColor: "#94A3B8",

    focusAreas: [
      {
        title: {
          en: "Shell Architecture",
          mn: "Shell бүтэц",
          ko: "쉘 구조",
        },
        icon: "🛡️",
        description: {
          en: "Right hand at jaw, left arm diagonal, rear shoulder forward — three defense layers from one relaxed position. Study how relaxed the position is held. Tension kills the shoulder roll reflex that makes the Shell work. Rigid = too slow.",
          mn: "Баруун гар эрүүнд, зүүн гар ташуу, арын мөр урагш — нэг тайван байрлалаас гурван хамгаалалтын давхарга. Байрлал хэр тайван барьдгийг судал. Татангир байдал нь Shell-ийг ажилладаг болгодог мөрний эргэлтийн рефлексийг устгадаг. Хатуу = хэтэрхий удаан.",
          ko: "오른손은 턱에, 왼팔은 대각선으로, 뒷 어깨는 앞으로 — 하나의 편안한 자세에서 세 겹의 방어. 얼마나 편안하게 자세를 유지하는지 연구하라. 긴장은 쉘을 작동하게 하는 숄더 롤 반사를 죽인다. 굳어있으면 = 너무 느리다.",
        },
      },
      {
        title: {
          en: "Counter Attached to Every Defense",
          mn: "Хамгаалалт болгонд эсрэг цохилт",
          ko: "모든 방어에 카운터 연결",
        },
        icon: "↩️",
        description: {
          en: "Mayweather never executes a defense without returning something. The shoulder deflects, the body is already in counter position — the left hand is at its shortest counter distance the moment the roll completes. Defense and counter are one motion.",
          mn: "Мэйвэзер хэзээ ч юм буцаалгүйгээр хамгаалалт хийдэггүй. Мөр хазайлгаж байхад бие аль хэдийн эсрэг цохилтын байрлалд байна — эргэлт дуусмагц зүүн гар хамгийн богино эсрэг цохилтын зайд байна. Хамгаалалт болон эсрэг цохилт нэг хөдөлгөөн.",
          ko: "메이웨더는 무언가를 돌려주지 않고 방어를 실행하는 법이 없다. 어깨가 편향하면 몸은 이미 카운터 포지션에 있다 — 롤이 완료되는 순간 왼손은 가장 짧은 카운터 거리에 있다. 방어와 카운터는 하나의 동작이다.",
        },
      },
      {
        title: {
          en: "Catch and Redirect",
          mn: "Барьж чиглэл өөрчлөх",
          ko: "캐치 후 방향 전환",
        },
        icon: "✋",
        description: {
          en: "The rear hand doesn't block the jab — it guides it offline to the outside. The guide and counter happen simultaneously. Study how the catch motion is an outward redirect, not a stopping motion straight back. Redirect, not block.",
          mn: "Арын гар жааб-г зогсоодоггүй — гадна тийш чиглэлийн гадагш хөтөлдөг. Хөтөлгөө болон эсрэг цохилт нэгэн зэрэг явагддаг. Барих хөдөлгөөн гадагш чиглэсэн дахин чиглүүлэлт болохыг судал, шулуун ухрах зогсоолт биш. Дахин чиглүүлэх, зогсоохгүй.",
          ko: "뒷손은 잽을 막지 않는다 — 아웃사이드로 빗나가게 안내한다. 안내와 카운터는 동시에 일어난다. 캐치 동작이 뒤로 멈추는 것이 아닌 외측 방향 전환임을 연구하라. 방향 전환, 블로킹이 아니다.",
        },
      },
    ],

    signatureHabit: {
      title: {
        en: "Counter Attached to Every Defense",
        mn: "Хамгаалалт болгонд эсрэг цохилт",
        ko: "모든 방어에 카운터 연결",
      },
      description: {
        en: "Mayweather trained himself never to execute a defense without immediately attaching a counter. Every roll produces a return shot. Every catch produces a simultaneous response. Defense and offense are never two separate events — always one continuous motion.",
        mn: "Мэйвэзер нэн даруй эсрэг цохилт залгалгүйгээр хамгаалалт хийхгүй байхаар өөрийгөө сургасан. Эргэлт болгон буцах цохилт гаргадаг. Барилт болгон нэгэн зэрэг хариу үйлдэл гаргадаг. Хамгаалалт болон халдлага хэзээ ч хоёр тусдаа үйл явдал биш — үргэлж нэг тасралтгүй хөдөлгөөн.",
        ko: "메이웨더는 즉시 카운터를 붙이지 않고 방어를 실행하지 않도록 스스로를 훈련했다. 모든 롤은 반격 샷을 만들어낸다. 모든 캐치는 동시 반응을 만들어낸다. 방어와 공격은 절대 두 개의 별개 사건이 아니다 — 항상 하나의 연속적인 동작이다.",
      },
      cue: {
        en: "Every defensive movement has a counter attached. Roll and counter. Catch and counter. If you're doing defense-only, you're giving up free punches.",
        mn: "Хамгаалалтын хөдөлгөөн болгонд эсрэг цохилт залгагдсан байна. Эргэж, эсрэг цохил. Бариад, эсрэг цохил. Зөвхөн хамгаалалт хийж байгаа бол үнэгүй цохилт орхиж байна.",
        ko: "모든 방어 동작에는 카운터가 연결되어 있다. 롤하고 카운터. 캐치하고 카운터. 방어만 하고 있다면 공짜 펀치를 포기하는 것이다.",
      },
    },

    beginnerDrill: {
      title: {
        en: "Shell Hold",
        mn: "Shell байрлал барих",
        ko: "쉘 홀드",
      },
      description: {
        en: "Master the position before the motion. The structure must be automatic before the rolls can work.",
        mn: "Хөдөлгөөнийн өмнө байрлалыг эзэмш. Эргэлт ажиллахаасаа өмнө бүтэц автоматик байх ёстой.",
        ko: "동작 전에 자세를 마스터하라. 롤이 작동하기 전에 구조가 자동적이어야 한다.",
      },
      steps: [
        {
          en: "Stand in Philly Shell: right hand by jaw, left arm diagonal, rear shoulder slightly forward",
          mn: "Philly Shell-д зогс: баруун гар эрүүний дэргэд, зүүн гар ташуу, арын мөр бага зэрэг урагш",
          ko: "필리 쉘로 선다: 오른손은 턱 옆, 왼팔은 대각선, 뒷 어깨는 약간 앞으로",
        },
        {
          en: "Hold the position for 60 seconds — feel what's covered and what's not",
          mn: "60 секунд байрлал барих — юу хаагдсан, юу хаагдаагүйг мэдрэх",
          ko: "60초 동안 자세를 유지한다 — 무엇이 커버되고 무엇이 안 되는지 느껴라",
        },
        {
          en: "Walk one full round in Shell — move without breaking the structure",
          mn: "Shell-д нэг бүрэн раунд явах — бүтэц эвдэлгүйгээр хөдлөх",
          ko: "쉘로 한 풀 라운드 걷는다 — 구조를 깨지 않고 움직인다",
        },
        {
          en: "Partner lightly taps your shoulder area: roll with the shoulder surface, not with your arm",
          mn: "Партнер мөрний хэсгийг хөнгөхөн цохино: гараараа биш мөрний гадаргуугаар эргэх",
          ko: "파트너가 어깨 부위를 가볍게 두드린다: 팔이 아닌 어깨 표면으로 롤한다",
        },
      ],
    },

    advancedLessonTitle: "Philly Shell Position",
    advancedLessonNote: {
      en: "Full mechanics of the Shell including active counter from every roll.",
      mn: "Эргэлт болгоноос идэвхтэй эсрэг цохилтыг оролцуулсан Shell-ийн бүрэн механик.",
      ko: "모든 롤에서 적극적인 카운터를 포함한 쉘의 완전한 메카닉.",
    },
  },
};

export function getFighterAcademy(fighterId) {
  return FIGHTER_ACADEMY[fighterId] || null;
}
