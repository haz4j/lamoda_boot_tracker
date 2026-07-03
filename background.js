// background.js — «мозг» расширения
// Управляет таймером, открывает страницу Lamoda,
// получает данные о размерах от content script,
// решает, нужно ли обновить иконку

// ========================
// Конфиг
// ========================

var CONFIG = {
  targetUrl: 'https://www.lamoda.ru/p/mp002xm00b1y/shoes-harryhatchet-botinki/',
  uninterestingSizes: [37, 38],
  checkIntervalMinutes: 10,
  alarmName: 'lamodaCheck',
};

// ========================
// Логика
// ========================

function hasInterestingSizes(availableSizes) {
  for (var i = 0; i < availableSizes.length; i++) {
    if (CONFIG.uninterestingSizes.indexOf(availableSizes[i]) === -1) {
      return true;
    }
  }
  return false;
}

// ========================
// Иконка (бейдж)
// ========================

function setBadgeGreen() {
  chrome.action.setBadgeText({ text: '✔' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  chrome.action.setTitle({ title: 'Новые размеры доступны!' });
}

function setBadgeChecking() {
  chrome.action.setBadgeText({ text: '⏳' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
  chrome.action.setTitle({ title: 'Проверяю...' });
}

function setBadgeNone() {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'Только обычные размеры (37, 38)' });
}

// ========================
// Основная проверка
// ========================

function checkSizes() {
  console.log('[BG] Начинаю проверку...');
  setBadgeChecking();

  chrome.tabs.create({ url: CONFIG.targetUrl, active: false }, function (tab) {
    var tabId = tab.id;
    console.log('[BG] Вкладка открыта:', tabId);

    var onTabUpdated = function (id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onTabUpdated);
        console.log('[BG] Страница загружена, жду рендер...');

        // Ждём 5 секунд — SPA подгружает размеры асинхронно
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: 'getSizes' }, function (response) {
            if (chrome.runtime.lastError) {
              console.error('[BG] Ошибка:', chrome.runtime.lastError.message);
              setBadgeNone();
              closeTab(tabId);
              return;
            }

            var sizes = response && response.sizes;
            if (!sizes) {
              console.warn('[BG] Размеры не получены');
              setBadgeNone();
              closeTab(tabId);
              return;
            }

            console.log('[BG] Размеры:', sizes);

            if (hasInterestingSizes(sizes)) {
              console.log('[BG] *** ИНТЕРЕСНЫЕ РАЗМЕРЫ ***');
              setBadgeGreen();
            } else {
              setBadgeNone();
            }

            closeTab(tabId);
          });
        }, 5000);
      }
    };

    chrome.tabs.onUpdated.addListener(onTabUpdated);
  });
}

function closeTab(tabId) {
  if (!tabId) return;
  try {
    chrome.tabs.remove(tabId, function () {
      // игнорируем ошибки — вкладка может быть уже закрыта
    });
  } catch (e) {
    // игнорируем
  }
}

// ========================
// Инициализация
// ========================

chrome.runtime.onStartup.addListener(function () {
  console.log('[BG] Расширение запущено');
  chrome.alarms.create(CONFIG.alarmName, {
    periodInMinutes: CONFIG.checkIntervalMinutes,
  });
});

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('[BG] Расширение установлено/обновлено:', details.reason);
  chrome.alarms.create(CONFIG.alarmName, {
    periodInMinutes: CONFIG.checkIntervalMinutes,
  });
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === CONFIG.alarmName) {
    checkSizes();
  }
});

// Клик по иконке — ручная проверка
chrome.action.onClicked.addListener(function () {
  console.log('[BG] Ручная проверка по клику');
  checkSizes();
});
