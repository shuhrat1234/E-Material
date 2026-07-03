 // АИС "Е-Материал" - Первоначальные данные (Имитация Базы Данных)

window.INITIAL_MOCK_DATA = {
  departments: [
    { id: "so", nameRu: "Следственный отдел", nameUz: "Tergov bo'limi" },
    { id: "od", nameRu: "Отдел дознания", nameUz: "Surishtiruv bo'limi" },
    { id: "ur", nameRu: "Уголовный розыск", nameUz: "Jinoyat qidiruv" }
  ],

  officers: [
    {
      id: "off_karimov",
      nameRu: "Каримов Сардор Бекзодович",
      nameUz: "Karimov Sardor Bekzodovich",
      rankRu: "Капитан",
      rankUz: "Kapitan",
      role: "investigator",
      deptId: "so",
      likes: 42, dislikes: 3, index: 92, photo: "K.S."
    },
    {
      id: "off_akhmedova",
      nameRu: "Ахмедова Дильноза Рустамовна",
      nameUz: "Axmedova Dilnoza Rustamovna",
      rankRu: "Старший лейтенант",
      rankUz: "Katta leytenant",
      role: "investigator",
      deptId: "so",
      likes: 28, dislikes: 6, index: 78, photo: "A.D."
    },
    {
      id: "off_makhmudov",
      nameRu: "Махмудов Жасур Акромович",
      nameUz: "Maxmudov Jasur Akromovich",
      rankRu: "Майор",
      rankUz: "Mayor",
      role: "inquiry_officer",
      deptId: "od",
      likes: 56, dislikes: 2, index: 98, photo: "M.J."
    },
    {
      id: "off_tokhirov",
      nameRu: "Тохиров Темур Шавкатович",
      nameUz: "Toxirov Temur Shavkatovich",
      rankRu: "Лейтенант",
      rankUz: "Leytenant",
      role: "inquiry_officer",
      deptId: "od",
      likes: 15, dislikes: 8, index: 68, photo: "T.T."
    },
    {
      id: "off_saidov",
      nameRu: "Саидов Бобур Комилович",
      nameUz: "Saidov Bobur Komilovich",
      rankRu: "Старший лейтенант",
      rankUz: "Katta leytenant",
      role: "investigator",
      deptId: "ur",
      likes: 34, dislikes: 4, index: 88, photo: "S.B."
    }
  ],

  materials: [
    {
      id: "MAT-2026-0001",
      citizenName: "Абдуллаев Алишер Улугбекович",
      citizenPhone: "+998 90 123-45-67",
      titleRu: "Заявление о краже мобильного телефона в ТРЦ 'Ривьера'",
      titleUz: "Rivyera KO'Mda mobil telefon o'g'irlangani haqida ariza",
      registeredAt: "2026-06-10T10:00:00",
      deadline: "2026-06-20T10:00:00",
      status: "срок_нарушен",
      officerId: "off_karimov",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "ariza",
      sourceFrom: "portal",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-10T10:00:00" },
        { status: "Анализ и решение", time: "2026-06-10T11:30:00" },
        { status: "Оперативная отправка уведомления", time: "2026-06-10T11:32:00" }
      ]
    },
    {
      id: "MAT-2026-0002",
      citizenName: "Каримова Наргиза Фарходовна",
      citizenPhone: "+998 93 456-78-90",
      titleRu: "Жалоба на мошенничество при покупке авто через OLX",
      titleUz: "OLX orqali avtomobil sotib olishdagi firibgarlik ustidan shikoyat",
      registeredAt: "2026-06-05T09:15:00",
      deadline: "2026-06-15T09:15:00",
      status: "срок_нарушен",
      officerId: "off_akhmedova",
      deptId: "so",
      isAccepted: true, extensionCount: 1,
      difficulty: 4,
      materialType: "ariza",
      sourceFrom: "prakuratura",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-05T09:15:00" },
        { status: "Анализ и решение", time: "2026-06-05T10:00:00" }
      ]
    },
    {
      id: "MAT-2026-0003",
      citizenName: "Рахимов Сарвар Илхомович",
      citizenPhone: "+998 94 987-65-43",
      titleRu: "Повреждение имущества (автомобиля) во дворе жилого дома",
      titleUz: "Turar joy hovlisida avtomobilga shikast yetkazish",
      registeredAt: "2026-06-22T14:30:00",
      deadline: "2026-07-02T14:30:00",
      status: "изучаемый",
      officerId: "off_makhmudov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 2,
      materialType: "bildirgi",
      sourceFrom: "iio",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-22T14:30:00" }
      ]
    },
    {
      id: "MAT-2026-0004",
      citizenName: "Усманов Дониёр Рустамович",
      citizenPhone: "+998 97 111-22-33",
      titleRu: "Кража велосипеда из подъезда дома №12",
      titleUz: "12-sonli uy yo'lagidan velosiped o'g'irlanishi",
      registeredAt: "2026-06-29T11:00:00",
      deadline: "2026-07-01T11:00:00",
      status: "срок_приближается",
      officerId: "off_tokhirov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 1,
      materialType: "ariza",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-29T11:00:00" }
      ]
    },
    {
      id: "MAT-2026-0005",
      citizenName: "Юсупов Тимур Маратович",
      citizenPhone: "+998 99 888-77-66",
      titleRu: "Потеря документов (паспорт, водительские права) при невыясненных обстоятельствах",
      titleUz: "Noma'lum sharoitda hujjatlarni yo'qotish (pasport, guvohnoma)",
      registeredAt: "2026-06-15T16:00:00",
      deadline: "2026-06-25T16:00:00",
      closedAt: "2026-06-24T15:30:00",
      status: "закрыт_в_срок",
      officerId: "off_saidov",
      deptId: "ur",
      isAccepted: true, extensionCount: 0,
      difficulty: 2,
      materialType: "boshqa",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-15T16:00:00" },
        { status: "Анализ и решение", time: "2026-06-15T17:00:00" },
        { status: "Оперативная отправка уведомления", time: "2026-06-15T17:02:00" },
        { status: "Прием гражданином уведомления", time: "2026-06-15T17:10:00" }
      ]
    },
    {
      id: "MAT-2026-0006",
      citizenName: "Азимова Лола Бахтияровна",
      citizenPhone: "+998 90 999-00-11",
      titleRu: "Заявление об угрозах физической расправы со стороны соседа",
      titleUz: "Qo'shni tomonidan jismoniy zo'ravonlik tahdidlari to'g'risida ariza",
      registeredAt: "2026-06-28T15:00:00",
      deadline: "2026-07-08T15:00:00",
      status: "изучаемый",
      officerId: "off_karimov",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "ariza",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-28T15:00:00" }
      ]
    },
    {
      id: "MAT-2026-0007",
      citizenName: "Бакиров Эльёр Шухратович",
      citizenPhone: "+998 91 777-55-44",
      titleRu: "Мошеннические действия под предлогом трудоустройства за рубежом",
      titleUz: "Chet elda ishga joylashtirish bahonasi bilan firibgarlik harakatlari",
      registeredAt: "2026-06-18T10:00:00",
      deadline: "2026-06-28T10:00:00",
      status: "срок_нарушен",
      officerId: "off_karimov",
      deptId: "so",
      isAccepted: true, extensionCount: 1,
      difficulty: 5,
      materialType: "ariza",
      sourceFrom: "prezident_aparat",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-18T10:00:00" }
      ]
    },
    {
      id: "MAT-2026-0008",
      citizenName: "Сулейманов Санжар Отабекович",
      citizenPhone: "+998 95 333-22-11",
      titleRu: "Заявление о пропаже несовершеннолетнего сына",
      titleUz: "Voyaga yetmagan o'g'lining yo'qolishi haqida ariza",
      registeredAt: "2026-06-26T18:20:00",
      deadline: "2026-07-06T18:20:00",
      status: "изучаемый",
      officerId: "off_saidov",
      deptId: "ur",
      isAccepted: true, extensionCount: 0,
      difficulty: 5,
      materialType: "ariza",
      sourceFrom: "portal",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-26T18:20:00" }
      ]
    },
    {
      id: "MAT-2026-0009",
      citizenName: "Ахмедов Мансур Комил угли",
      citizenPhone: "+998 90 444-55-66",
      titleRu: "Незаконное проникновение в нежилое помещение (склад)",
      titleUz: "Noshahar binoga (omborgacha) noqonuniy kirish",
      registeredAt: "2026-06-20T11:00:00",
      deadline: "2026-06-30T11:00:00",
      status: "срок_приближается",
      officerId: "off_makhmudov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "bildirgi",
      sourceFrom: "iio",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-20T11:00:00" }
      ]
    },
    {
      id: "MAT-2026-0010",
      citizenName: "Ибрагимова Рано Рустамовна",
      citizenPhone: "+998 97 888-99-00",
      titleRu: "Семейный конфликт, нанесение легких телесных повреждений",
      titleUz: "Oilaviy mojaro, yengil tan jarohati yetkazish",
      registeredAt: "2026-06-10T14:00:00",
      deadline: "2026-06-20T14:00:00",
      closedAt: "2026-06-19T12:00:00",
      status: "закрыт_в_срок",
      officerId: "off_tokhirov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 2,
      materialType: "ariza",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-10T14:00:00" },
        { status: "Анализ и решение", time: "2026-06-19T11:00:00" },
        { status: "Оперативная отправка уведомления", time: "2026-06-19T11:05:00" },
        { status: "Прием гражданином уведомления", time: "2026-06-19T11:15:00" }
      ]
    },
    {
      id: "MAT-2026-0011",
      citizenName: "Назаров Отабек Хуршидович",
      citizenPhone: "+998 93 222-33-44",
      titleRu: "Вымогательство со стороны должностного лица",
      titleUz: "Mansabdor shaxs tomonidan tovlamachilik",
      registeredAt: "2026-06-23T09:00:00",
      deadline: "2026-07-03T09:00:00",
      status: "изучаемый",
      officerId: "off_akhmedova",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 4,
      materialType: "ariza",
      sourceFrom: "prezident_aparat",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-23T09:00:00" }
      ]
    },
    {
      id: "MAT-2026-0012",
      citizenName: "Хасанов Улугбек Мирзаевич",
      citizenPhone: "+998 99 111-00-99",
      titleRu: "Кража денежных средств с банковской карты путем фишинга",
      titleUz: "Fishing yo'li bilan bank kartasidan pul o'g'irlash",
      registeredAt: "2026-06-24T16:30:00",
      deadline: "2026-07-04T16:30:00",
      status: "изучаемый",
      officerId: "off_karimov",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "ariza",
      sourceFrom: "portal",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-24T16:30:00" }
      ]
    },
    {
      id: "MAT-2026-0013",
      citizenName: "Мирзаева Гулнора Алишеровна",
      citizenPhone: "+998 94 666-77-88",
      titleRu: "Незаконный выброс строительного мусора на придомовой территории",
      titleUz: "Uy atrofidagi hududga qurilish chiqindilarini noqonuniy tashlash",
      registeredAt: "2026-06-27T12:00:00",
      deadline: "2026-07-07T12:00:00",
      status: "изучаемый",
      officerId: "off_saidov",
      deptId: "ur",
      isAccepted: true, extensionCount: 0,
      difficulty: 1,
      materialType: "bildirgi",
      sourceFrom: "iio",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-27T12:00:00" }
      ]
    },
    {
      id: "MAT-2026-0014",
      citizenName: "Турсунов Бахтиёр Равшанович",
      citizenPhone: "+998 90 777-66-55",
      titleRu: "Кража ноутбука из офиса при неустановленных обстоятельствах",
      titleUz: "Noma'lum sharoitda ofisdan noutbuk o'g'irlash",
      registeredAt: "2026-06-12T08:30:00",
      deadline: "2026-06-22T08:30:00",
      closedAt: "2026-06-21T17:00:00",
      status: "закрыт_в_срок",
      officerId: "off_akhmedova",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "ariza",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-12T08:30:00" },
        { status: "Анализ и решение", time: "2026-06-21T16:00:00" },
        { status: "Оперативная отправка уведомления", time: "2026-06-21T16:05:00" },
        { status: "Прием гражданином уведомления", time: "2026-06-21T16:15:00" }
      ]
    },
    {
      id: "MAT-2026-0015",
      citizenName: "Рустамова Малика Шавкатовна",
      citizenPhone: "+998 91 333-44-55",
      titleRu: "Жалоба на незаконное увольнение и невыплату зарплаты",
      titleUz: "Noqonuniy ishdan bo'shatish va maoshni to'lamaslik ustidan shikoyat",
      registeredAt: "2026-06-29T10:00:00",
      deadline: "2026-07-09T10:00:00",
      status: "изучаемый",
      officerId: "off_makhmudov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 4,
      materialType: "ariza",
      sourceFrom: "portal",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-29T10:00:00" }
      ]
    },
    {
      id: "MAT-2026-0016",
      citizenName: "Исмоилов Шерзод Комилович",
      citizenPhone: "+998 95 555-66-77",
      titleRu: "Угон автотранспортного средства из охраняемой парковки",
      titleUz: "Qo'riqlanadigan to'xtash joyidan transport vositasini o'g'irlash",
      registeredAt: "2026-06-28T08:00:00",
      deadline: "2026-07-08T08:00:00",
      status: "изучаемый",
      officerId: "off_saidov",
      deptId: "ur",
      isAccepted: true, extensionCount: 0,
      difficulty: 5,
      materialType: "ariza",
      sourceFrom: "iio",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-28T08:00:00" }
      ]
    },
    {
      id: "MAT-2026-0017",
      citizenName: "Камолов Даврон Элмурзаевич",
      citizenPhone: "+998 97 444-33-22",
      titleRu: "Незаконная торговля в неустановленном месте, создание помех движению",
      titleUz: "Belgilanmagan joyda noqonuniy savdo, harakatga to'sqinlik",
      registeredAt: "2026-06-25T13:00:00",
      deadline: "2026-07-05T13:00:00",
      status: "изучаемый",
      officerId: "off_tokhirov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 1,
      materialType: "bildirgi",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-25T13:00:00" }
      ]
    },
    {
      id: "MAT-2026-0018",
      citizenName: "Эргашева Шахло Бахромовна",
      citizenPhone: "+998 90 222-11-00",
      titleRu: "Мошенничество: предоплата за несуществующий товар через Telegram",
      titleUz: "Telegram orqali mavjud bo'lmagan tovar uchun oldindan to'lov firibgarligi",
      registeredAt: "2026-06-01T11:00:00",
      deadline: "2026-06-11T11:00:00",
      status: "срок_нарушен",
      officerId: "off_akhmedova",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 3,
      materialType: "ariza",
      sourceFrom: "prakuratura",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-01T11:00:00" }
      ]
    },
    {
      id: "MAT-2026-0019",
      citizenName: "Тошматов Сирожиддин Хасанович",
      citizenPhone: "+998 93 888-77-55",
      titleRu: "Хулиганство с причинением ущерба: разбитое окно магазина",
      titleUz: "Zarar yetkazish bilan bezorilik: do'kon oynasini sindirib tashlash",
      registeredAt: "2026-06-27T20:00:00",
      deadline: "2026-07-07T20:00:00",
      status: "изучаемый",
      officerId: "off_makhmudov",
      deptId: "od",
      isAccepted: true, extensionCount: 0,
      difficulty: 2,
      materialType: "bildirgi",
      sourceFrom: "iio",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-27T20:00:00" }
      ]
    },
    {
      id: "MAT-2026-0020",
      citizenName: "Шамсиев Акбар Иброхимович",
      citizenPhone: "+998 99 000-11-22",
      titleRu: "Присвоение чужого имущества (найденная чужая карта)",
      titleUz: "Topilgan begona karta orqali mol-mulkni o'zlashtirish",
      registeredAt: "2026-06-08T14:00:00",
      deadline: "2026-06-18T14:00:00",
      closedAt: "2026-06-17T10:00:00",
      status: "закрыт_в_срок",
      officerId: "off_karimov",
      deptId: "so",
      isAccepted: true, extensionCount: 0,
      difficulty: 2,
      materialType: "ariza",
      sourceFrom: "tashrif",
      appeals: [
        { status: "Обращение гражданина", time: "2026-06-08T14:00:00" },
        { status: "Анализ и решение", time: "2026-06-17T09:00:00" },
        { status: "Оперативная отправка уведомления", time: "2026-06-17T09:05:00" },
        { status: "Прием гражданином уведомления", time: "2026-06-17T09:20:00" }
      ]
    }
  ],

  approvalRequests: [],

  activeVisits: [
    {
      id: "v_101",
      citizenName: "Махкамов Шавкат",
      citizenPhone: "+998 90 999-88-77",
      officerId: "off_karimov",
      startTime: "2026-06-30T17:45:00",
      purposeRu: "Подать дополнительное заявление",
      purposeUz: "Qo'shimcha ariza topshirish"
    },
    {
      id: "v_102",
      citizenName: "Муминова Феруза",
      citizenPhone: "+998 93 111-22-33",
      officerId: "off_makhmudov",
      startTime: "2026-06-30T17:55:00",
      purposeRu: "Узнать статус дела о заливе квартиры",
      purposeUz: "Kvartirani suv bosishi bo'yicha ish holatini bilish"
    }
  ],

  templates: [
    {
      id: "tpl_reject",
      type: "SMS / Telegram",
      triggerRu: "Отказ в возбуждении уголовного дела",
      triggerUz: "Jinoyat ishini qo'zg'atishni rad etish",
      contentRu: "Уважаемый(ая) {name}! Сообщаем, что по вашему обращению №{id} принято решение об отказе в возбуждении уголовного дела. Копия решения: {link}. С уважением, Олмазорский РУВД.",
      contentUz: "Hurmatli {name}! Sizning {id}-sonli murojaatingiz yuzasidan jinoyat ishini qo'zg'atishni rad etish to'g'risida qaror qabul qilindi. Qaror nusxasi: {link}. Hurmat bilan, Olmazor tumani IIO FMB."
    },
    {
      id: "tpl_initiate",
      type: "SMS / Telegram",
      triggerRu: "Возбуждение уголовного дела",
      triggerUz: "Jinoyat ishi qo'zg'atish",
      contentRu: "Уважаемый(ая) {name}! По вашему заявлению №{id} возбуждено уголовное дело №{case_num}. Следователь: {officer}, тел: {phone}. С уважением, Олмазорский РУВД.",
      contentUz: "Hurmatli {name}! Sizning {id}-sonli arizangiz yuzasidan {case_num}-sonli jinoyat ishi qo'zg'atildi. Tergovchi: {officer}, tel: {phone}. Hurmat bilan, Olmazor tumani IIO FMB."
    },
    {
      id: "tpl_transfer",
      type: "SMS / Telegram",
      triggerRu: "Направление по подследственности",
      triggerUz: "Tergovga tegishliligi bo'yicha yuborish",
      contentRu: "Уважаемый(ая) {name}! Ваше обращение №{id} направлено по территориальной подследственности в {org}. С уважением, Олмазорский РУВД.",
      contentUz: "Hurmatli {name}! Sizning {id}-sonli murojaatingiz hududiy tergovga tegishliligi bo'yicha {org}ga yuborildi. Hurmat bilan, Olmazor tumani IIO FMB."
    }
  ],

  auditLogs: [
    { time: "2026-06-30T16:15:00", user: "Махмудов Жасур (Начальник)", actionRu: "Перераспределение материала MAT-2026-0003", actionUz: "MAT-2026-0003 materialini qayta biriktirish" },
    { time: "2026-06-30T15:30:00", user: "Тохиров Темур", actionRu: "Закрытие дела MAT-2026-0010 в связи с примирением сторон", actionUz: "Tomonlar yarashganligi sababli MAT-2026-0010 ishini yopish" },
    { time: "2026-06-30T14:22:00", user: "Каримов Сардор", actionRu: "Запрос к AI-ассистенту по квалификации кражи", actionUz: "O'g'irlikni baholash bo'yicha AI-assistentga so'rov" },
    { time: "2026-06-30T13:10:00", user: "Администратор", actionRu: "Инициализация системы и запуск баз данных", actionUz: "Tizimni ishga tushirish va ma'lumotlar bazalarini yuklash" }
  ]
};
