from flask import Flask, request, Response, send_from_directory, session, redirect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import anthropic
import json
import os
import secrets
import sqlite3

# static_folder=None: this app's directory now holds lehrerbrief.db (password hashes) and
# app.py source, so we don't want Flask's catch-all static route serving every file in '.'.
# Instead each asset actually needed by the frontend gets its own explicit route below.
app = Flask(__name__, static_folder=None)

_secret_key = os.environ.get('SECRET_KEY')
if not _secret_key:
    # No hardcoded fallback: a fixed secret in source would let anyone forge session
    # cookies. A fresh random key per process just means sessions reset on restart —
    # fine for local/dev, but set SECRET_KEY in the environment for real deployments.
    _secret_key = secrets.token_hex(32)
    print('WARNUNG: SECRET_KEY nicht gesetzt — nutze zufälligen Schlüssel für diesen Prozess. '
          'Für Produktion SECRET_KEY als Env-Var setzen, sonst gehen Sessions bei jedem Neustart verloren.')
app.secret_key = _secret_key
# Render terminates TLS and sets X-Forwarded-For — trust one hop so rate-limit keys use the real client IP.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)


def rate_limit_key():
    user_id = session.get('user_id')
    return f"user:{user_id}" if user_id else get_remote_address()


limiter = Limiter(
    key_func=rate_limit_key,
    app=app,
    default_limits=['60 per hour'],
)

client = anthropic.Anthropic()

# Founder/demo backdoor: logs in with this exact email+password pair regardless of
# what's in the users table, so access never depends on the (non-persistent-on-Render)
# SQLite file surviving a redeploy. Unset in the environment -> feature is fully off.
MASTER_EMAIL    = (os.environ.get('MASTER_EMAIL') or '').strip().lower()
MASTER_PASSWORD = os.environ.get('MASTER_PASSWORD')
if bool(MASTER_EMAIL) != bool(MASTER_PASSWORD):
    print('WARNUNG: Nur MASTER_EMAIL oder nur MASTER_PASSWORD gesetzt — Master-Login bleibt '
          'deaktiviert, bis beide Env-Vars gesetzt sind.')


def get_db():
    # isolation_level=None -> autocommit for plain reads; register() opens an explicit
    # BEGIN IMMEDIATE transaction itself where it needs to avoid a race on invite codes.
    conn = sqlite3.connect('lehrerbrief.db', isolation_level=None)
    conn.row_factory = sqlite3.Row
    return conn


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            return {'error': 'Nicht angemeldet'}, 401
        return f(*args, **kwargs)
    return decorated

VORLAGEN = {
    'eltern': {
        'elternbrief':       'einen allgemeinen Elternbrief',
        'elterngespräch':    'eine Einladung zum Elterngespräch',
        'verhaltensauffälligkeit': 'ein Schreiben über Verhaltensauffälligkeiten',
        'leistungsrückgang': 'ein Schreiben über einen Leistungsrückgang',
        'klassenfahrt':      'einen Informationsbrief zur Klassenfahrt/zum Schulausflug',
        'fehlzeiten':        'ein Schreiben wegen unentschuldigter Fehlzeiten',
        'lob':               'einen Lobbrief für besondere Leistungen oder Verhalten',
    },
    'schulleitung': {
        'krankmeldung':      'eine Krankmeldung',
        'urlaubsantrag':     'einen Urlaubsantrag',
        'vorfallsbericht':   'einen Vorfallsbericht',
        'anschaffungsantrag':'einen Antrag zur Beschaffung von Unterrichtsmaterial',
        'bericht':           'einen allgemeinen Bericht / eine Rückmeldung',
    },
    'kollegen': {
        'vertretung':        'eine Vertretungsanfrage',
        'besprechung':       'eine Einladung zur Besprechung oder Teamsitzung',
        'info':              'eine allgemeine Information ans Kollegium',
        'aufgabenübergabe':  'eine Aufgabenübergabe bei Abwesenheit',
        'danke':             'eine Dankesnachricht an Kollegen',
    },
}

TON = {
    'formell':    'sehr formell und professionell',
    'freundlich': 'freundlich und wertschätzend, aber professionell',
    'sachlich':   'sachlich und klar, ohne Floskeln',
}

LAENGE = {
    'kurz':   'Halte den Brief bewusst kurz und knapp (ca. 80-120 Wörter).',
    'mittel': 'Schreibe den Brief in mittlerer Länge (ca. 150-220 Wörter).',
    'lang':   'Schreibe einen ausführlichen, sorgfältig begründeten Brief (ca. 250-350 Wörter).',
}

EMPFAENGER_ANREDE = {
    'eltern':       'Sehr geehrte Damen und Herren / Sehr geehrte Erziehungsberechtigte',
    'schulleitung': 'Sehr geehrte Schulleitung',
    'kollegen':     'Liebe Kolleginnen und Kollegen',
}

@app.route('/')
def index():
    if not session.get('user_id'):
        return redirect('/login')
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/style.css')
def style_css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def script_js():
    return send_from_directory('.', 'script.js')

@app.route('/api/register', methods=['POST'])
def register():
    data         = request.get_json()
    email        = (data.get('email') or '').strip().lower()
    password     = data.get('password') or ''
    invite_code  = (data.get('invite_code') or '').strip()

    if not email or not password or not invite_code:
        return {'error': 'E-Mail, Passwort und Einladungscode sind erforderlich'}, 400
    if len(password) < 8:
        return {'error': 'Passwort muss mindestens 8 Zeichen lang sein'}, 400

    password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    db = get_db()
    try:
        # BEGIN IMMEDIATE takes the write lock up front, so a second concurrent
        # registration with the same invite code blocks here instead of racing the
        # SELECT-then-UPDATE below and slipping two accounts through on one code.
        db.execute('BEGIN IMMEDIATE')

        code_row = db.execute('SELECT used_by FROM invite_codes WHERE code = ?', (invite_code,)).fetchone()
        if not code_row:
            db.execute('ROLLBACK')
            return {'error': 'Ungültiger Einladungscode'}, 400
        if code_row['used_by'] is not None:
            db.execute('ROLLBACK')
            return {'error': 'Dieser Einladungscode wurde bereits verwendet'}, 400

        existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            db.execute('ROLLBACK')
            return {'error': 'Diese E-Mail ist bereits registriert'}, 400

        cursor = db.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            (email, password_hash),
        )
        user_id = cursor.lastrowid
        db.execute(
            "UPDATE invite_codes SET used_by = ?, used_at = datetime('now') WHERE code = ?",
            (user_id, invite_code),
        )
        db.execute('COMMIT')
    finally:
        db.close()

    session['user_id'] = user_id
    session['email']   = email
    return {'email': email}

@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if (MASTER_EMAIL and MASTER_PASSWORD and email == MASTER_EMAIL
            and secrets.compare_digest(password, MASTER_PASSWORD)):
        session['user_id'] = 'master'
        session['email']   = email
        return {'email': email}

    db   = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    db.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return {'error': 'E-Mail oder Passwort ist falsch'}, 401

    session['user_id'] = user['id']
    session['email']   = user['email']
    return {'email': user['email']}

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return {'ok': True}

@app.route('/me')
def me():
    if not session.get('user_id'):
        return {'error': 'Nicht angemeldet'}, 401
    return {'email': session.get('email')}

@app.route('/generieren', methods=['POST'])
@login_required
@limiter.limit('5 per hour; 20 per day')
def generieren():
    data        = request.get_json()
    empfänger   = data.get('empfänger', 'eltern')
    texttyp     = data.get('texttyp', '')
    details     = data.get('details', '')
    ton         = data.get('ton', 'freundlich')
    absender    = data.get('absender', '')
    klasse      = data.get('klasse', '')
    laenge      = data.get('laenge', 'mittel')
    schule      = data.get('schule', '')

    if not details:
        return {'error': 'Keine Details angegeben'}, 400

    vorlagen    = VORLAGEN.get(empfänger, VORLAGEN['eltern'])
    typ_text    = vorlagen.get(texttyp, list(vorlagen.values())[0])
    ton_text    = TON.get(ton, TON['freundlich'])
    anrede      = EMPFAENGER_ANREDE.get(empfänger, '')
    laenge_text = LAENGE.get(laenge, LAENGE['mittel'])

    prompt = f"""Du bist Lehrer/in an einer deutschen Schule und schreibst {typ_text} an: {empfänger}.

Ton: {ton_text}
Länge: {laenge_text}
Anrede: {anrede}
{"Klasse/Schüler: " + klasse if klasse else ""}
{"Schule: " + schule if schule else ""}
{"Absender (Unterschrift): " + absender if absender else "Absender: [Lehrername]"}

Inhalt und Anlass:
{details}

Schreibe einen vollständigen, professionellen Brief auf Deutsch.
Beginne direkt mit der Anrede — kein einleitender Kommentar.
Nutze einen passenden Betreff (beginne diese Zeile mit "Betreff: ").
Achte auf korrekte Grußformel und Unterschrift."""

    def stream():
        with client.messages.stream(
            model='claude-sonnet-5',
            max_tokens=1200,
            messages=[{'role': 'user', 'content': prompt}],
        ) as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


if __name__ == '__main__':
    app.run(debug=True, port=5001, threaded=True)
