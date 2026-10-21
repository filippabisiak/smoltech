var assert = require('assert');
var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var { JSDOM } = jsdom;

var root = path.join(__dirname, '..');
var HOST = 'постачальнику хостингу;';
var IT = 'постачальникам ІТ- та бухгалтерських послуг;';
var ACCESS = 'право доступу до своїх даних;';
var ERASE = 'право на видалення даних;';
var dict = {};
dict[HOST] = 'hosting provider;';
dict[IT] = 'IT and accounting service providers;';
dict[ACCESS] = 'access to your data;';
dict[ERASE] = 'erasure of your data;';

var page = '<!DOCTYPE html><html data-st-i18n="off" data-st-builder="1"><head></head><body><main id="main">' +
  '<section class="sec sec-paper"><div class="wrap"><div class="prose">' +
  '<h2>5. Recipients</h2>' +
  '<ul id="top"><li>' + HOST + '</li><li id="it">' + IT + '</li></ul>' +
  '<h2>7. Rights</h2>' +
  '<ul id="bottom"><li>' + ACCESS + '</li><li id="last">' + ERASE + '</li></ul>' +
  '</div></div></section></main>' +
  '<script>window.ST={lookup:function(uk){var k=String(uk).replace(/\\s+/g," ").trim();var d=' +
  JSON.stringify(dict) + ';return d[k]||uk;}};</script></body></html>';

var dom = new JSDOM('<!DOCTYPE html><html><body><div id="host"></div></body></html>', {
  url: 'http://127.0.0.1:43123/panel/panel.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true
});
var window = dom.window;
window.confirm = function () { return true; };
(function () {
  var proto = window.HTMLIFrameElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'srcdoc') || Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'srcdoc');
  Object.defineProperty(proto, 'srcdoc', {
    configurable: true,
    set: function (html) {
      if (desc && desc.set) { try { desc.set.call(this, html); } catch (err) { /* jsdom */ } }
      var self = this;
      setTimeout(function () {
        try {
          self.contentDocument.open();
          self.contentDocument.write(html);
          self.contentDocument.close();
        } catch (err2) { /* ignore */ }
        self.dispatchEvent(new window.Event('load'));
      }, 0);
    },
    get: function () { return desc && desc.get ? desc.get.call(this) : ''; }
  });
})();
['edytor-stan.js', 'kolor.js', 'builder.js'].forEach(function (name) {
  window.eval(fs.readFileSync(path.join(root, 'panel', name), 'utf8'));
});

function textOf(el) {
  if (!el) return '';
  var clone = el.cloneNode(true);
  if (clone.querySelectorAll) clone.querySelectorAll('.stb-drag, .stb-addone, .stb-slotlabel').forEach(function (n) { n.remove(); });
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

window.STBuilder.open('70-polityka', window.document.getElementById('host'), {
  api: function (payload) {
    if (payload.action === 'cms.page.builder') {
      return Promise.resolve({
        ok: true, html: page, name: 'Privacy', id: '70-polityka',
        title: 'T', desc: 'D', ogtitle: 'O', pages: [], canDelete: false, url: '/polityka-konfidentsiynosti/'
      });
    }
    return Promise.resolve({ ok: true });
  },
  flash: function () {},
  uploadFile: function () {},
  back: function () {},
  i18nSwept: '70-polityka'
});

function frameDoc() {
  var frame = window.document.getElementById('stb-frame');
  return frame && frame.contentDocument;
}

function waitForItem() {
  return new Promise(function (resolve, reject) {
    var n = 0;
    var t = setInterval(function () {
      n++;
      var doc = frameDoc();
      var it = doc && doc.getElementById('it');
      if (it && textOf(it) === dict[IT]) {
        clearInterval(t);
        resolve(it);
      } else if (n > 50) {
        clearInterval(t);
        reject(new Error('list item not ready: ' + (it ? textOf(it) : 'missing')));
      }
    }, 20);
  });
}

waitForItem().then(function (it) {
  var doc = frameDoc();
  it.click();
  var btn = doc.querySelector('.stb-addone');
  assert.ok(btn, 'selecting a bullet shows Add another');
  assert.strictEqual(btn.previousElementSibling, it, 'the button sits directly after the selected bullet');
  btn.click();
  var top = doc.getElementById('top');
  var bottom = doc.getElementById('bottom');
  var items = top.querySelectorAll(':scope > li');
  assert.strictEqual(items.length, 3, 'the new point is in the same list');
  assert.strictEqual(bottom.querySelectorAll(':scope > li').length, 2, 'the last list on the page is unchanged');
  assert.strictEqual(items[1], it, 'the selected bullet stays in place');
  assert.strictEqual(textOf(items[2]), 'Item', 'the new point is a blank item, not a copy of the last bullet');
  assert.notStrictEqual(textOf(items[2]), textOf(doc.getElementById('last')), 'the new point is not the last bullet on the page');
  var again = doc.querySelector('.stb-addone');
  assert.ok(again, 'Add another stays beside the new point');
  assert.strictEqual(again.previousElementSibling, items[2], 'the button follows the point it just added');
  window.document.getElementById('host').querySelector('#stb-add-one').click();
  items = doc.getElementById('top').querySelectorAll(':scope > li');
  assert.strictEqual(items.length, 4, 'the toolbar Add another also inserts in this list');
  assert.strictEqual(doc.getElementById('bottom').querySelectorAll(':scope > li').length, 2);
  assert.strictEqual(textOf(items[3]), 'Item');
  var size = window.document.getElementById('host').querySelector('#stb-size');
  var labels = Array.prototype.map.call(size.options, function (opt) { return opt.textContent; });
  assert.deepStrictEqual(labels, ['Size', 'Caption', 'Body text', 'Subtitle', 'Title']);
  assert.deepStrictEqual(Array.prototype.map.call(size.options, function (opt) { return opt.value; }), ['', '0.8125rem', '1.125rem', '1.28rem', '2.35rem']);

  var shell = window.document.getElementById('host');
  var left = shell.querySelector('[data-act="outdent"]');
  var right = shell.querySelector('[data-act="indent"]');
  assert.strictEqual(left.parentElement, right.parentElement, 'move left and move right share a row');
  assert.ok(left.parentElement.classList.contains('stb__row'));
  var listGrp = shell.querySelector('[data-grp="list"]');
  assert.ok(/bullet/i.test(listGrp.textContent), 'the list section explains the bullet button');
  assert.strictEqual(shell.querySelector('[data-act="item"]').textContent, 'Bullet list');
  assert.ok(shell.querySelector('#stb-live').closest('.stb__foot'), 'preview sits in the footer');
  assert.ok(shell.querySelector('#stb-save').closest('.stb__foot'), 'save sits in the footer');
  assert.ok(shell.querySelector('[data-grp="layout"]').compareDocumentPosition(shell.querySelector('#stb-color')) & window.Node.DOCUMENT_POSITION_PRECEDING);

  var h2 = doc.querySelector('h2');
  h2.click();
  var swatch = shell.querySelector('.stb__swatch[data-color="#d10a11"]');
  swatch.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  swatch.click();
  var painted = h2.querySelector('[style*="color"]');
  assert.ok(painted, 'a colour swatch colours the title without a word selection');
  assert.ok(/d10a11/i.test(painted.getAttribute('style') || ''), 'the title uses the swatch colour');
  assert.ok(shell.querySelector('.stb__swatch[data-color="#ffffff"]'), 'white is one of the colours');
  swatch.click();
  assert.ok(!/d10a11/i.test(h2.innerHTML), 'clicking the same colour again clears it');
  shell.querySelector('[data-act="bold"]').click();
  assert.ok(h2.querySelector('strong'), 'bold applies to the clicked title');
  assert.ok(shell.querySelector('[data-act="bold"]').classList.contains('is-on'), 'bold stays selected');
  shell.querySelector('[data-act="bold"]').click();
  assert.ok(!h2.querySelector('strong'), 'clicking bold again removes it');
  assert.ok(!shell.querySelector('[data-act="bold"]').classList.contains('is-on'), 'bold turns off');

  var bullet = doc.getElementById('top').querySelectorAll(':scope > li');
  var last = bullet[bullet.length - 1];
  last.click();
  var handle = last.previousElementSibling;
  assert.ok(handle && handle.classList.contains('stb-drag'), 'a selected bullet has a drag handle');
  assert.strictEqual(handle.textContent, 'Drag bullet');
  var view = doc.defaultView;
  view.HTMLElement.prototype.getBoundingClientRect = function () {
    var parent = this.parentElement;
    var kids = parent ? Array.prototype.filter.call(parent.children, function (el) {
      return el.matches && el.matches('li');
    }) : [];
    var i = kids.indexOf(this);
    if (i < 0) i = 0;
    return { top: i * 40, bottom: i * 40 + 30, left: 0, right: 200, width: 200, height: 30, x: 0, y: i * 40, toJSON: function () { return {}; } };
  };
  function point(type, y) {
    handle.dispatchEvent(new view.MouseEvent(type, { bubbles: true, cancelable: true, clientY: y, button: 0 }));
  }
  point('pointerdown', 140);
  point('pointermove', 8);
  point('pointerup', 8);
  var moved = doc.getElementById('top').querySelectorAll(':scope > li');
  assert.strictEqual(moved[0], last, 'dragging the handle moves the bullet to the top of its list');
  assert.ok(!doc.querySelector('.stb-drag') || doc.querySelector('.stb-drag').textContent.indexOf('Drag') === 0, 'the handle stays an editor control');
  console.log('builder-add.test.js ok');
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
