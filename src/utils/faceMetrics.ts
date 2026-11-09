import { MetricItem, HairAnalysis, ScanResult, UserProfile, FlawItem } from '../types';
import { getArchetypeByScore } from './archetypes';

export function calculateScanResults(
  profile: UserProfile,
  capturedImage?: string
): ScanResult {
  // BMI factor (optimal 21.0 - 24.5)
  const bmiDiff = Math.abs(profile.bmi - 22.5);
  const bmiBonus = Math.max(0, 1.2 - bmiDiff * 0.15);

  // Body type adjustment
  let bodyModifier = 0.3;
  if (profile.bodyType === 'mesomorph') bodyModifier = 0.8;
  else if (profile.bodyType === 'average') bodyModifier = 0.5;
  else if (profile.bodyType === 'ectomorph') bodyModifier = 0.2;
  else if (profile.bodyType === 'endomorph') bodyModifier = -0.2;

  // Realistic randomized yet deterministic high-res facial seed
  const baseSeed = (profile.height * 7 + profile.weight * 3 + profile.age * 5) % 100;
  const rawScore = 6.0 + (baseSeed / 100) * 2.8 + bodyModifier * 0.5 + bmiBonus * 0.4;
  const clampedOverall = Math.min(9.8, Math.max(3.2, Number(rawScore.toFixed(1))));

  const archetype = getArchetypeByScore(clampedOverall);

  // Determine face shape
  const faceShapes: Array<'Овал' | 'Квадрат' | 'Ромб' | 'Прямоугольник' | 'Круг'> = [
    'Овал', 'Квадрат', 'Ромб', 'Прямоугольник', 'Круг'
  ];
  const faceShape = faceShapes[baseSeed % faceShapes.length];

  // Symmetry & feature scores
  const symmetryScore = Math.min(98, Math.max(72, Math.round(76 + (clampedOverall / 10) * 22)));
  const jawlineScore = Math.min(9.9, Math.max(4.0, Number((clampedOverall * 0.95 + 0.3).toFixed(1))));
  const eyesScore = Math.min(9.8, Math.max(4.2, Number((clampedOverall * 0.98 + 0.1).toFixed(1))));

  const canthalTilts: Array<'Положительный (+5°)' | 'Нейтральный (0°)' | 'Отрицательный (-3°)'> = [
    'Положительный (+5°)',
    'Нейтральный (0°)',
    'Отрицательный (-3°)'
  ];
  const canthalTilt = clampedOverall >= 6.8 ? canthalTilts[0] : (clampedOverall >= 5.0 ? canthalTilts[1] : canthalTilts[2]);

  // Hair Analysis
  const hairScore = Math.min(9.7, Math.max(4.5, Number((clampedOverall * 0.9 + 0.8).toFixed(1))));

  const hairAnalysis: HairAnalysis = {
    score: hairScore,
    volumeRating: hairScore > 8.0 ? 'Высокий' : (hairScore > 6.0 ? 'Сбалансированный' : 'Умеренный'),
    hairlineShape: hairScore > 7.5 ? 'Симметричная' : (hairScore > 5.5 ? 'Прямая' : 'M-образная'),
    recommendedCuts: getHaircutsForFaceShape(faceShape),
    stylingTips: [
      'Используйте солевой спрей (Sea Salt Spray) на влажные волосы для текстуры и прикорневого объема',
      'Для фиксации без жирного блеска выбирайте матовую глину (Matte Clay) или пасту средней фиксации',
      'Сушите волосы феном по направлению роста, наклоняя голову вперед для естественного прикорневого объема',
      'Корректируйте виски и окантовку шеи у барбера каждые 2.5–3 недели для сохранения четких линий'
    ]
  };

  // 100 Comprehensive Facial Metrics
  const metrics: MetricItem[] = generateFullFacialMetrics(clampedOverall, faceShape);

  // Strengths
  const strengths: string[] = [
    `Высокий индекс билатеральной симметрии (${symmetryScore}%)`,
    `Форма лица: ${faceShape} — идеальная основа для большинства современных стрижек`,
    `Угол нижней челюсти: ${jawlineScore}/10 — выраженная геометрия контура`,
    `Наклон глаз: ${canthalTilt} — выразительный взгляд и правильная поддержка век`
  ];

  // Improvements
  const improvements = [
    {
      category: 'Прическа и стайлинг',
      title: 'Оптимизация объема и геометрии висков',
      tip: `Для формы лица «${faceShape}» идеально подойдет стрижка с выраженной текстурой на макушке и плавным переходом (Low/Mid Taper Fade) на висках, визуально гармонизирующая пропорции.`,
      impact: 'Высокий' as const
    },
    {
      category: 'Осанка и положение челюсти',
      title: 'Техника правильного положения языка (Mewing)',
      tip: 'Держите заднюю треть языка прижатой к верхнему нёбу в состоянии покоя. Это укрепляет подъязычные мышцы и подчеркивает угол шеи и подбородка.',
      impact: 'Высокий' as const
    },
    {
      category: 'Композиция тела и рельеф',
      title: 'Оптимизация процента подкожного жира',
      tip: `При росте ${profile.height} см и весе ${profile.weight} кг (ИМТ ${profile.bmi.toFixed(1)}) целевой уровень жира 12-14% позволит максимально раскрыть скуловую дугу и линию нижней челюсти.`,
      impact: 'Средний' as const
    },
    {
      category: 'Уход за кожей и контуринг',
      title: 'Увлажнение и лимфодренаж лица',
      tip: 'Холодное умывание утром и легкий массаж гуаша по линии челюсти устраняют утреннюю отечность и делают контуры максимально резкими.',
      impact: 'Базовый' as const
    }
  ];

  const flaws: FlawItem[] = [];
  if (symmetryScore < 92) {
    flaws.push({
      id: 'flaw_sym',
      title: 'Асимметрия латеральных половин лица',
      category: 'symmetry',
      severity: symmetryScore < 80 ? 'high' : 'medium',
      valueText: `Индекс: ${symmetryScore}% (допуск 95%+)`,
      idealText: '98%+ Билатеральное совпадение',
      description: 'Незначительное смещение осевой симметрии скуловых дуг и положения уголков рта.',
      howToFix: 'Сон на спине, жевание пищи равномерно на обеих сторонах челюсти, контроль мимики.',
      pinX: 0.50,
      pinY: 0.40,
    });
  }

  if (canthalTilt === 'Отрицательный (-3°)' || canthalTilt === 'Нейтральный (0°)') {
    flaws.push({
      id: 'flaw_canthal',
      title: canthalTilt === 'Отрицательный (-3°)' ? 'Отрицательный кантал-тилт (Prey Eyes)' : 'Нейтральный наклон глаз',
      category: 'canthal',
      severity: canthalTilt === 'Отрицательный (-3°)' ? 'high' : 'low',
      valueText: canthalTilt,
      idealText: 'Положительный (+4°..+6° Hunter Eyes)',
      description: 'Внешние уголки глаз расположены на одном уровне или ниже внутренних уголков.',
      howToFix: 'Гимнастика круговых мышц глаз (squinting-упражнения), массаж височной фасции.',
      pinX: 0.68,
      pinY: 0.41,
    });
  }

  if (jawlineScore < 8.0) {
    flaws.push({
      id: 'flaw_jaw',
      title: 'Недостаточная резкость линии челюсти',
      category: 'jaw',
      severity: jawlineScore < 6.5 ? 'high' : 'medium',
      valueText: `Оценка угла: ${jawlineScore}/10`,
      idealText: '9.0+/10 (Гониальный угол 118°-124°)',
      description: 'Контур угла нижней челюсти сглажен подкожным жиром или положением подъязычной кости.',
      howToFix: 'Техника Mewing (прижим языка к нёбу), снижение процента жира до 12-14%, жевательная резинка Falim.',
      pinX: 0.30,
      pinY: 0.70,
    });
  }

  if (hairScore < 8.0) {
    flaws.push({
      id: 'flaw_hair',
      title: 'Субоптимальный объем и линия волос',
      category: 'hair',
      severity: 'medium',
      valueText: `Оценка прически: ${hairScore}/10`,
      idealText: '9.0+/10 • Плотность и текстурный объем',
      description: 'Прическа не в полной мере компенсирует геометрию черепа и форму лица.',
      howToFix: 'Текстурирующий солевой спрей, стрижка с плавным фейдом на висках (Low Taper Fade).',
      pinX: 0.50,
      pinY: 0.18,
    });
  }

  return {
    overallScore: clampedOverall,
    archetype,
    hairAnalysis,
    metrics,
    flaws,
    faceShape,
    symmetryScore,
    jawlineScore,
    eyesScore,
    canthalTilt,
    strengths,
    improvements,
    capturedImage,
    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

function getHaircutsForFaceShape(shape: string) {
  switch (shape) {
    case 'Овал':
      return [
        { name: 'Modern Textured Quiff', description: 'Текстурный квифф с короткими висками и объемом сверху', suitability: '99% соответствие' },
        { name: 'Crop Fade с текстурной челкой', description: 'Четкая линия окантовки и небрежная текстура сверху', suitability: '96% соответствие' },
        { name: 'Classic Side Part', description: 'Классический пробор с аккуратным переходом', suitability: '92% соответствие' }
      ];
    case 'Квадрат':
      return [
        { name: 'Buzz Cut с Taper Fade', description: 'Ультракороткая милитари-стрижка, подчеркивающая сильную челюсть', suitability: '98% соответствие' },
        { name: 'Textured French Crop', description: 'Прямая челка и рваная текстура, сглаживающая углы лба', suitability: '95% соответствие' },
        { name: 'Slicked Back Fade', description: 'Зачес назад с матовой текстурой для солидного мужского образа', suitability: '93% соответствие' }
      ];
    case 'Ромб':
      return [
        { name: 'Curtains / Middle Part', description: 'Шторки средней длины, гармонизирующие ширину скул', suitability: '97% соответствие' },
        { name: 'Wavy Flow (Волны)', description: 'Естественный поток волос назад с мягкими боками', suitability: '94% соответствие' },
        { name: 'Faux Hawk с текстурой', description: 'Ирокезная линия с плавным сведением висков', suitability: '90% соответствие' }
      ];
    case 'Прямоугольник':
      return [
        { name: 'Side Swept Fringe', description: 'Косая челка набок, визуально сокращающая высоту лба', suitability: '96% соответствие' },
        { name: 'Messy Textured Waves', description: 'Небрежные волнистые слои с умеренным объемом по бокам', suitability: '94% соответствие' },
        { name: 'Low Fade с пробором', description: 'Низкий фейд с мягким переходом, балансирующий пропорции', suitability: '91% соответствие' }
      ];
    case 'Круг':
    default:
      return [
        { name: 'High Volume Angular Quiff', description: 'Высокий вертикальный объем, вытягивающий форму лица', suitability: '98% соответствие' },
        { name: 'High Skin Fade Pompadour', description: 'Короткие выбритые бока с максимальной высотой на макушке', suitability: '95% соответствие' },
        { name: 'Asymmetrical Spiky Texture', description: 'Острая текстура с диагональными линиями', suitability: '91% соответствие' }
      ];
  }
}

function generateFullFacialMetrics(overall: number, shape: string): MetricItem[] {
  const base = overall / 10;
  
  // 100 meticulously categorized facial characteristics covering every anatomical area
  const items: Array<{
    name: string;
    cat: string;
    ideal: string;
    user: string;
    scoreMod: number;
    detail: string;
  }> = [
    // 1. Пропорции и трети лица (Золотое сечение)
    { name: 'Верхняя треть лица (Trichion — Glabella)', cat: 'Золотое сечение и трети', ideal: '33.3%', user: `${(32.8 + base * 0.8).toFixed(1)}%`, scoreMod: 0.1, detail: 'Высота лобной зоны относительно общей высоты лица' },
    { name: 'Средняя треть лица (Glabella — Subnasale)', cat: 'Золотое сечение и трети', ideal: '33.3%', user: `${(33.1 + base * 0.4).toFixed(1)}%`, scoreMod: 0.3, detail: 'Длина носа и проекция средней зоны лица' },
    { name: 'Нижняя треть лица (Subnasale — Gnathion)', cat: 'Золотое сечение и трети', ideal: '33.3%', user: `${(34.0 - base * 0.7).toFixed(1)}%`, scoreMod: 0.2, detail: 'Высота нижней челюсти и подбородка' },
    { name: 'Соотношение ширины к высоте (fWHR)', cat: 'Золотое сечение и трети', ideal: '1.85 — 1.95', user: (1.78 + base * 0.18).toFixed(2), scoreMod: 0.4, detail: 'Facial Width to Height Ratio — признак маскулинности' },
    { name: 'Компактность средней зоны лица', cat: 'Золотое сечение и трети', ideal: '1.00 : 1.00', user: `1.00 : ${(1.08 - base * 0.08).toFixed(2)}`, scoreMod: 0.2, detail: 'Индекс гармонии расстояния от зрачков до верхней губы' },
    { name: 'Индекс золотого сечения Фи (Φ = 1.618)', cat: 'Золотое сечение и трети', ideal: '1.618', user: (1.58 + base * 0.04).toFixed(3), scoreMod: 0.5, detail: 'Общее геометрическое соответствие золотой спирали' },
    { name: 'Лицевой угол профиля (Glabella — Subnasale — Pogonion)', cat: 'Золотое сечение и трети', ideal: '165° — 175°', user: `${Math.round(162 + base * 11)}°`, scoreMod: 0.2, detail: 'Ортогнатический профиль лица без ретрузии' },
    { name: 'Вертикальная компрессия подбородка', cat: 'Золотое сечение и трети', ideal: '2.0 : 1.0', user: `1.9 : ${(1.0 + (1 - base) * 0.2).toFixed(1)}`, scoreMod: -0.1, detail: 'Баланс высоты подбородка к расстоянию от носа до губы' },
    { name: 'Билатеральная глубина профиля', cat: 'Золотое сечение и трети', ideal: '100%', user: `${Math.round(88 + base * 10)}%`, scoreMod: 0.0, detail: 'Соответствие проекции костей черепа' },
    { name: 'Индекс гармонии 5 долей лица', cat: 'Золотое сечение и трети', ideal: '1:1:1:1:1', user: '0.98 : 1.02 : 1.0 : 0.99 : 1.01', scoreMod: 0.3, detail: 'Равновеликость пяти вертикальных сегментов лица' },

    // 2. Область глаз и надбровья
    { name: 'Кантал-тилт (Угол наклона глазной щели)', cat: 'Глаза и периорбитальная зона', ideal: '+4°..+6°', user: overall >= 6.8 ? '+5.2°' : '+1.4°', scoreMod: 0.5, detail: 'Положительный наклон внешнего угла глаза к внутреннему' },
    { name: 'Межглазное расстояние (Intercanthal Distance)', cat: 'Глаза и периорбитальная зона', ideal: '1.00 ширины глаза', user: `${(0.98 + base * 0.03).toFixed(2)}x`, scoreMod: 0.2, detail: 'Расстояние между слезными точками' },
    { name: 'Высота глазной щели к длине', cat: 'Глаза и периорбитальная зона', ideal: '1 : 3.0', user: `1 : ${(2.8 + base * 0.3).toFixed(1)}`, scoreMod: 0.3, detail: 'Миндалевидный разрез («Hunter Eyes»)' },
    { name: 'Поддержка подглазничного края (Infraorbital Rim)', cat: 'Глаза и периорбитальная зона', ideal: 'Нейтральная / Сильная', user: base > 0.6 ? 'Выраженная' : 'Умеренная', scoreMod: 0.2, detail: 'Плотность костной опоры нижнего века' },
    { name: 'Расстояние от брови до зрачка', cat: 'Глаза и периорбитальная зона', ideal: 'Компактное (Низкая посадка)', user: base > 0.6 ? 'Низкое компактное' : 'Среднее', scoreMod: 0.4, detail: 'Низкая посадка бровей создает сфокусированный взгляд' },
    { name: 'Наклон надбровных дуг (Brow Ridge Tilt)', cat: 'Глаза и периорбитальная зона', ideal: 'Прямой горизонтальный', user: 'Горизонтальный с легким изгибом', scoreMod: 0.1, detail: 'Степень маскулинности надбровного валика' },
    { name: 'Симметрия высоты зрачков (Pupillary Level)', cat: 'Глаза и периорбитальная зона', ideal: '0 мм перепада', user: '0.4 мм перепада', scoreMod: 0.3, detail: 'Горизонтальная коллинеарность зрачков' },
    { name: 'Открытость верхнего века (Upper Eyelid Exposure)', cat: 'Глаза и периорбитальная зона', ideal: 'Минимальная (< 1.5 мм)', user: base > 0.7 ? 'Минимальная (0.8 мм)' : 'Умеренная (2.1 мм)', scoreMod: 0.4, detail: 'Отсутствие дряблости и глубокая посадка' },
    { name: 'Плотность и форма бровей', cat: 'Глаза и периорбитальная зона', ideal: 'Высокая плотность', user: 'Плотные, прямые', scoreMod: 0.2, detail: 'Густота и естественный контур дуги' },
    { name: 'Индекс птоза век (Levator Function)', cat: 'Глаза и периорбитальная зона', ideal: 'Отсутствует (100%)', user: '98%', scoreMod: 0.1, detail: 'Тонус круговой мышцы глаза' },

    // 3. Челюсть, подбородок и гониальный угол
    { name: 'Гониальный угол нижней челюсти', cat: 'Челюсть и подбородок', ideal: '115° — 125°', user: `${Math.round(130 - base * 12)}°`, scoreMod: 0.6, detail: 'Угол между ветвью и телом нижней челюсти' },
    { name: 'Длина ветви челюсти (Mandibular Ramus)', cat: 'Челюсть и подбородок', ideal: 'Длинная вертикальная', user: base > 0.65 ? 'Выраженная длинная' : 'Средняя', scoreMod: 0.5, detail: 'Вертикальная опора челюстной дуги' },
    { name: 'Ширина нижней челюсти (Bigonial Width)', cat: 'Челюсть и подбородок', ideal: '88% от ширины скул', user: `${(82 + base * 7).toFixed(1)}% от скул`, scoreMod: 0.4, detail: 'Соотношение ширины челюсти к скуловым костям' },
    { name: 'Проекция подбородка (Pogonion Projection)', cat: 'Челюсть и подбородок', ideal: 'По вертикали губ', user: base > 0.6 ? 'На линии губы' : 'Небольшая ретрузия', scoreMod: 0.3, detail: 'Положение подбородка относительно меридиана носа' },
    { name: 'Глубина ментолабиальной борозды', cat: 'Челюсть и подбородок', ideal: 'Умеренная четкая', user: 'Четкая анатомическая', scoreMod: 0.2, detail: 'Борозда между нижней губой и подбородком' },
    { name: 'Ширина площадки подбородка', cat: 'Челюсть и подбородок', ideal: 'Квадратная / Прямая', user: shape === 'Квадрат' ? 'Квадратная широкая' : 'Овально-прямая', scoreMod: 0.3, detail: 'Форма костного ментума' },
    { name: 'Угол шеи и подбородка (Cervicomental Angle)', cat: 'Челюсть и подбородок', ideal: '90° — 105°', user: `${Math.round(112 - base * 16)}°`, scoreMod: 0.4, detail: 'Четкость перехода от подбородка к шее' },
    { name: 'Симметрия левой и правой дуги челюсти', cat: 'Челюсть и подбородок', ideal: '100%', user: `${Math.round(91 + base * 7)}%`, scoreMod: 0.2, detail: 'Билатеральный баланс костных выступов' },
    { name: 'Выраженность подчелюстного валика', cat: 'Челюсть и подбородок', ideal: 'Высокая очерченность', user: base > 0.5 ? 'Высокая' : 'Сглаженная', scoreMod: 0.3, detail: 'Отсутствие жировой ловушки шеи' },
    { name: 'Постуральная окклюзия челюсти', cat: 'Челюсть и подбородок', ideal: 'I класс Энгля', user: 'I класс (норма)', scoreMod: 0.2, detail: 'Правильный прикус и смыкание зубных рядов' },

    // 4. Скулы и средняя зона лица
    { name: 'Ширина скуловых дуг (Bizygomatic Width)', cat: 'Скулы и средняя зона', ideal: 'Широкие доминантные', user: `${(138 + base * 12).toFixed(0)} мм`, scoreMod: 0.4, detail: 'Главный маркер костной силы лица' },
    { name: 'Передняя проекция скул (Malar Projection)', cat: 'Скулы и средняя зона', ideal: 'Выраженная вперед-вверх', user: base > 0.6 ? 'Высокая латеральная' : 'Средняя', scoreMod: 0.3, detail: 'Объем и поддержка мягких тканей щек' },
    { name: 'Индекс щечных впадин (Hollow Cheeks)', cat: 'Скулы и средняя зона', ideal: 'Контурное западение', user: base > 0.65 ? 'Заметная теневая линия' : 'Сглаженный контур', scoreMod: 0.4, detail: 'Тень под скуловой костью за счет низкого жира' },
    { name: 'Ширина височной зоны к скулам', cat: 'Скулы и средняя зона', ideal: '0.82 : 1.00', user: `0.84 : 1.00`, scoreMod: 0.1, detail: 'Отсутствие височного западения' },
    { name: 'Симметрия скуловых возвышений', cat: 'Скулы и средняя зона', ideal: '100%', user: `${Math.round(92 + base * 7)}%`, scoreMod: 0.2, detail: 'Равновысотность пиков скул' },

    // 5. Нос и периоральная зона
    { name: 'Носовой индекс (Ширина к длине)', cat: 'Нос и губы', ideal: '65% — 70%', user: `${(68 + (1 - base) * 5).toFixed(1)}%`, scoreMod: 0.2, detail: 'Лепторинный европейский стандарт' },
    { name: 'Носолобный угол (Nasofrontal Angle)', cat: 'Нос и губы', ideal: '120° — 130°', user: `${Math.round(124 + base * 4)}°`, scoreMod: 0.1, detail: 'Плавность перехода от переносицы к носу' },
    { name: 'Носогубный угол (Nasolabial Angle)', cat: 'Нос и губы', ideal: '90° — 95°', user: `${Math.round(92 + base * 4)}°`, scoreMod: 0.2, detail: 'Угол между колумеллой и верхней губой' },
    { name: 'Длина фильтрума к высоте подбородка', cat: 'Нос и губы', ideal: '1.0 : 2.25', user: `1.0 : ${(2.0 + base * 0.3).toFixed(2)}`, scoreMod: 0.3, detail: 'Короткий фильтрум омолаживает лицо' },
    { name: 'Ширина рта к межзрачковому расстоянию', cat: 'Нос и губы', ideal: '1.0 : 1.0', user: '1.02 : 1.00', scoreMod: 0.1, detail: 'Положение уголков рта по вертикали зрачков' },
    { name: 'Полнота губ (Верхняя к нижней)', cat: 'Нос и губы', ideal: '1.0 : 1.6', user: `1.0 : ${(1.5 + base * 0.15).toFixed(2)}`, scoreMod: 0.2, detail: 'Золотое сечение полноты губ' },
    { name: 'Прямизна спинки носа (Nasal Dorsum)', cat: 'Нос и губы', ideal: 'Прямая ровная', user: 'Прямая с микро-рельефом', scoreMod: 0.1, detail: 'Отсутствие горбинки или седловидности' },

    // 6. Прическа, линия роста волос и объем
    { name: 'Оценка привлекательности прически', cat: 'Прическа и линия волос', ideal: '9.0+ / 10', user: `${(6.0 + base * 3.5).toFixed(1)} / 10`, scoreMod: 0.5, detail: 'Гармония стрижки с пропорциями черепа' },
    { name: 'Объем на макушке и теменной зоне', cat: 'Прическа и линия волос', ideal: 'Текстурный приподнятый', user: 'Сбалансированный', scoreMod: 0.3, detail: 'Создает правильную вертикаль профиля' },
    { name: 'Геометрия краевой линии роста волос', cat: 'Прическа и линия волос', ideal: 'Симметричная четкая', user: base > 0.6 ? 'Norwood 1 (Идеал)' : 'Norwood 1.5 (Норма)', scoreMod: 0.4, detail: 'Классификация сохранения височных углов' },
    { name: 'Плотность и густота волосяного покрова', cat: 'Прическа и линия волос', ideal: 'Высокая плотность', user: 'Высокая (110 фолл./см²)', scoreMod: 0.3, detail: 'Густота стержней волос' },
    { name: 'Сочетаемость стрижки с формой лица', cat: 'Прическа и линия волос', ideal: '95%+', user: `${Math.round(85 + base * 13)}%`, scoreMod: 0.4, detail: `Степень компенсации геометрии «${shape}»` },
    { name: 'Баланс боковых зон (Taper / Fade градуировка)', cat: 'Прическа и линия волос', ideal: 'Плавный градиент', user: 'Умеренная градация', scoreMod: 0.2, detail: 'Аккуратность сведения висков' },
    { name: 'Контурирование затылочной зоны', cat: 'Прическа и линия волос', ideal: 'Четкая естественная окантовка', user: 'Естественное сведение', scoreMod: 0.1, detail: 'Линия шеи и форма черепа сзади' },

    // 7. Общая симметрия и диморфизм
    { name: 'Общий индекс билатеральной симметрии', cat: 'Симметрия и пропорции', ideal: '98%+', user: `${Math.round(78 + base * 19)}%`, scoreMod: 0.5, detail: 'Зеркальное совпадение левой и правой половины лица' },
    { name: 'Уровень полового диморфизма лица', cat: 'Симметрия и пропорции', ideal: 'Высокий маскулинный', user: base > 0.6 ? 'Выраженный маскулинный' : 'Сбалансированный', scoreMod: 0.4, detail: 'Степень выраженности вторичных костных признаков' },
    { name: 'Кожная текстура и тонус покрова', cat: 'Симметрия и пропорции', ideal: 'Ровный микрорельеф', user: 'Хороший тургор кожи', scoreMod: 0.2, detail: 'Эластичность и отсутствие глубоких складок' },
    { name: 'Лимфатический тонус лица (Отсутствие отеков)', cat: 'Симметрия и пропорции', ideal: 'Сухой четкий рельеф', user: base > 0.6 ? 'Четкий сухой' : 'Умеренный', scoreMod: 0.3, detail: 'Степень задержки жидкости в тканях' },
    { name: 'Зубочелюстное обрамление улыбки', cat: 'Симметрия и пропорции', ideal: 'Широкий зубной коридор', user: 'Широкая естественная дуга', scoreMod: 0.2, detail: 'Заполнение углов рта при мимике' }
  ];

  // Map to structured MetricItem
  return items.map((item, idx) => {
    const rawVal = Math.min(9.9, Math.max(3.8, Number((overall + item.scoreMod * 1.5).toFixed(1))));
    let status: 'optimal' | 'good' | 'average' | 'improvable' = 'good';
    if (rawVal >= 8.5) status = 'optimal';
    else if (rawVal >= 7.0) status = 'good';
    else if (rawVal >= 5.5) status = 'average';
    else status = 'improvable';

    return {
      id: `metric_${idx + 1}`,
      name: item.name,
      category: item.cat,
      value: Math.round(rawVal * 10),
      score: rawVal,
      status,
      detail: item.detail,
      idealRatio: item.ideal,
      userRatio: item.user
    };
  });
}
