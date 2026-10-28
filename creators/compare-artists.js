(function () {
  'use strict';
  var select = document.getElementById('audience'), cards = Array.from(document.querySelectorAll('[data-audiences]'));
  select.addEventListener('change', function () {
    var count = 0;
    cards.forEach(function (card) { var show = select.value === 'all' || card.dataset.audiences.split(' ').includes(select.value); card.hidden = !show; if (show) count++; });
    document.getElementById('matchCount').textContent = count + ' artist guides. Suggested fit only; confirm the brief with the artist.';
  });
})();
