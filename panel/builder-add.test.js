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

function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

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
  console.log('builder-add.test.js ok');
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
