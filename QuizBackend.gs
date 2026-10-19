/**
 * IBDP Computer Science — Quiz backend
 * Ambassador International Academy
 *
 * ONE SPREADSHEET FOR THE WHOLE COURSE.
 * Set this up once. Every topic's quiz — A1.1, A1.2, A2.1 and everything you
 * add later — posts to this same Web app URL and lands in the same three
 * sheets, separated by a Topic column.
 *
 *   Results    one row per attempt      (who, which topic, score, grade)
 *   Answers    one row per question     (what they answered, right or wrong)
 *   Summary    one row per topic+class  (rebuilt automatically after every submit)
 *
 * ---------------------------------------------------------------------------
 * SETUP — do this once
 * ---------------------------------------------------------------------------
 * 1. Create ONE Google Sheet. Name it something like "IBDP CS — Quiz Results".
 * 2. Extensions -> Apps Script. Delete everything in the editor.
 * 3. Paste this whole file in. Save (disk icon).
 * 4. Deploy -> New deployment -> gear icon -> Web app.
 *       Description:     IBDP CS quizzes
 *       Execute as:      Me
 *       Who has access:  Anyone        <-- must be "Anyone", NOT "Anyone with a Google account"
 *    Deploy -> Authorize access -> choose your account -> Advanced ->
 *    "Go to <project> (unsafe)" -> Allow.   (That warning is normal for your own scripts.)
 * 5. Copy the Web app URL. It ends in /exec, like:
 *       https://script.google.com/macros/s/AKfycb..../exec
 *    Paste it in a browser tab to check it — you should see a "backend is running" message.
 * 6. In EVERY quiz HTML file, paste that same URL into the SHEETS_URL line:
 *       const SHEETS_URL = 'https://script.google.com/macros/s/..../exec';
 *    and make sure the two lines under it name that quiz's topic:
 *       const QUIZ_TOPIC = 'A1.1';
 *       const QUIZ_TITLE = 'Computer hardware and operation';
 *
 * The three sheets are created automatically the first time a student submits.
 * You never need a second spreadsheet or a second deployment.
 *
 * IMPORTANT: after ANY edit to this script, do
 * Deploy -> Manage deployments -> pencil icon -> Version: New version -> Deploy,
 * or the change will not take effect. The URL stays the same.
 */

var SUMMARY = 'Results';
var DETAIL  = 'Answers';
var ROLLUP  = 'Summary';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var when = new Date();

    var topic = data.topic || 'Unspecified';
    var quiz  = data.quiz  || '';

    // ---------- one row per attempt ----------
    var s = sheet_(ss, SUMMARY, [
      'Timestamp','Topic','Quiz','Name','Class','Level','Score (points)','Questions',
      'Marks earned','Percentage','Grade','Correct','Partly right','Incorrect',
      'Best streak','Time (s)'
    ]);

    var incorrect = data.total - data.correct - data.partial;
    s.appendRow([
      when, topic, quiz, data.name, data.cls, data.level, data.score, data.total,
      data.earned, data.pct / 100, data.grade, data.correct, data.partial, incorrect,
      data.streak, data.seconds
    ]);

    var r = s.getLastRow();
    s.getRange(r, 10).setNumberFormat('0%');
    s.getRange(r, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    gradeColour_(s.getRange(r, 11), data.pct);

    // ---------- one row per question ----------
    var d = sheet_(ss, DETAIL, [
      'Timestamp','Topic','Name','Class','Q#','Subtopic','Type','Question',
      'Student answer','Correct answer','Marks (0-1)','Points','Seconds','Hodder ref'
    ]);

    var rows = (data.detail || []).map(function (l) {
      return [when, topic, data.name, data.cls, l.n, l.sub, l.type, l.q,
              l.given, l.want, l.frac, l.pts, l.secs, l.ref];
    });

    if (rows.length) {
      var start = d.getLastRow() + 1;
      d.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
      d.getRange(start, 1, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm');
      d.getRange(start, 11, rows.length, 1).setNumberFormat('0.00');
      for (var i = 0; i < rows.length; i++) {
        var f = rows[i][10];
        d.getRange(start + i, 11).setBackground(
          f === 1 ? '#D9EAD3' : f > 0 ? '#FFF2CC' : '#F4CCCC');
      }
    }

    rebuildRollup_(ss);
    return json_({ ok: true, row: r, topic: topic });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Open the Web app URL in a browser to confirm the deployment is live. */
function doGet() {
  return ContentService
    .createTextOutput('IBDP CS quiz backend is running. All topics submit to this one URL.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ---------------- roll-up ---------------- */

/**
 * Rebuilds the Summary sheet from scratch: one row per topic + class, so you
 * can see at a glance how each class did on each topic without writing a pivot.
 */
function rebuildRollup_(ss) {
  var s = ss.getSheetByName(SUMMARY);
  if (!s || s.getLastRow() < 2) return;

  var head = ['Topic','Quiz','Class','Attempts','Students','Average %','Lowest %','Highest %','Average grade'];
  var r = sheet_(ss, ROLLUP, head);

  var vals = s.getRange(2, 1, s.getLastRow() - 1, 16).getValues();
  var groups = {};   // "topic||class" -> stats

  vals.forEach(function (v) {
    var topic = v[1], quiz = v[2], name = v[3], cls = v[4], pct = v[9] * 100, grade = Number(v[10]);
    var key = topic + '||' + cls;
    if (!groups[key]) {
      groups[key] = { topic: topic, quiz: quiz, cls: cls, n: 0, names: {},
                      sum: 0, min: 1e9, max: -1e9, gsum: 0 };
    }
    var g = groups[key];
    g.n++;
    g.names[name] = 1;
    g.sum += pct;
    g.gsum += isNaN(grade) ? 0 : grade;
    if (pct < g.min) g.min = pct;
    if (pct > g.max) g.max = pct;
  });

  var out = Object.keys(groups).sort().map(function (k) {
    var g = groups[k];
    return [g.topic, g.quiz, g.cls, g.n, Object.keys(g.names).length,
            g.sum / g.n / 100, g.min / 100, g.max / 100,
            Math.round(g.gsum / g.n * 10) / 10];
  });

  // clear old body, write the new one
  if (r.getLastRow() > 1) r.getRange(2, 1, r.getLastRow() - 1, head.length).clearContent();
  if (!out.length) return;

  r.getRange(2, 1, out.length, head.length).setValues(out);
  r.getRange(2, 6, out.length, 3).setNumberFormat('0%');
  for (var i = 0; i < out.length; i++) {
    gradeColour_(r.getRange(2 + i, 6), out[i][5] * 100);
  }
}

/* ---------------- helpers ---------------- */

function sheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    var h = sh.getRange(1, 1, 1, headers.length);
    h.setFontWeight('bold')
     .setBackground('#1B3A6B')
     .setFontColor('#FFFFFF')
     .setVerticalAlignment('middle');
    sh.setRowHeight(1, 34);
    sh.setFrozenRows(1);
    for (var c = 1; c <= headers.length; c++) {
      sh.setColumnWidth(c, width_(headers[c - 1]));
    }
  }
  return sh;
}

function width_(header) {
  if (header === 'Question' || header === 'Student answer' || header === 'Correct answer') return 320;
  if (header === 'Quiz') return 230;
  if (header === 'Timestamp') return 140;
  if (header === 'Name') return 150;
  if (header === 'Topic') return 80;
  return 100;
}

function gradeColour_(range, pct) {
  var bg = pct >= 80 ? '#B7E1CD'
         : pct >= 60 ? '#D9EAD3'
         : pct >= 40 ? '#FFF2CC'
         : '#F4CCCC';
  range.setBackground(bg).setFontWeight('bold').setHorizontalAlignment('center');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
