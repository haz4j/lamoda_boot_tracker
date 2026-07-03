// config.js — все настройки в одном месте
const CONFIG = {
  // URL страницы для мониторинга
  targetUrl: "https://www.lamoda.ru/p/mp002xm00b1y/shoes-harryhatchet-botinki/",

  // «Неинтересные» размеры — если есть только они, молчим
  // Если появился ЛЮБОЙ другой размер — позеленеем
  uninterestingSizes: [44, 45, 46],

  // Интервал проверки в минутах
  checkIntervalMinutes: 10,

  // Имя аларма (для chrome.alarms API)
  alarmName: "lamodaCheck",

  // Бейдж — что показывать на иконке
  badges: {
    checking: "⏳",   // проверяем
    available: "✓",   // появились новые размеры
    none: ""           // только неинтересные размеры
  }
};
