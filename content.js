// content.js — «глаза» расширения
// Читает размеры со страницы Lamoda и отправляет в background

(function () {
  "use strict";

  /**
   * Найти размеры — возвращает { available: [...], all: [...] }
   * или null если ещё не загружены
   */
  function findSizes() {
    var items = document.querySelectorAll('.ui-product-page-sizes-chooser-item');
    if (items.length === 0) return null;

    var available = [];
    var all = [];

    items.forEach(function (el) {
      var text = el.textContent.trim();
      // Формат: "38 RUS 39 EUR" → берём первое число (RUS размер)
      var match = text.match(/^(\d{2})\s*RUS/);
      if (match) {
        var size = parseInt(match[1], 10);
        all.push(size);

        // Доступный = НЕ имеет класс _colspanDisabled
        var cls = el.className || '';
        if (cls.indexOf('Disabled') === -1 && cls.indexOf('disabled') === -1) {
          available.push(size);
        }
      }
    });

    all.sort(function (a, b) { return a - b; });
    available.sort(function (a, b) { return a - b; });

    return { all: all, available: available };
  }

  // Ответ на прямой запрос от background
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getSizes') {
      var result = findSizes();
      if (result) {
        sendResponse({ sizes: result.available, allSizes: result.all });
      } else {
        sendResponse({ sizes: null });
      }
    }
  });
})();
