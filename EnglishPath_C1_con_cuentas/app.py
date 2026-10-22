from flask import Flask, render_template, jsonify, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import json, os, sqlite3, smtplib, urllib.parse, urllib.request
from pathlib import Path
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'change-this-secret-key-in-render')
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax', SESSION_COOKIE_SECURE=os.environ.get('RENDER') is not None)
BASE = Path(__file__).parent
DATA = BASE / 'data' / 'questions.json'
DB = Path(os.environ.get('DATABASE_PATH', str(BASE / 'englishpath.db')))

def connect_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect_db() as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
        conn.execute('CREATE TABLE IF NOT EXISTS progress (user_id INTEGER PRIMARY KEY, progress_json TEXT NOT NULL DEFAULT \'{"xp":0,"correct":0,"streak":0,"lastDate":""}\', FOREIGN KEY(user_id) REFERENCES users(id))')
        # Crear las dos cuentas solicitadas solo si todavía no existen.
        for username, email, password in [
            ('imad', 'imad@englishpath.local', '1987'),
            ('iman', 'iman@englishpath.local', '1987'),
        ]:
            existing = conn.execute('SELECT id FROM users WHERE username=?', (username,)).fetchone()
            if not existing:
                cur = conn.execute(
                    'INSERT INTO users(username,email,password_hash) VALUES(?,?,?)',
                    (username, email, generate_password_hash(password))
                )
                conn.execute(
                    'INSERT OR IGNORE INTO progress(user_id,progress_json) VALUES(?,?)',
                    (cur.lastrowid, json.dumps({'xp':0,'correct':0,'streak':0,'lastDate':''}))
                )
init_db()

def login_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error':'Inicia sesión para continuar'}), 401
            return redirect(url_for('login'))
        return fn(*args, **kwargs)
    return wrapped

def notify_owner_login(username):
    """Envía avisos si están configurados SMTP y/o Twilio; nunca bloquea el inicio de sesión."""
    message = f'Nuevo inicio de sesión en EnglishPath C1. Usuario: {username}.'
    # Email: configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, NOTIFY_EMAIL.
    try:
        host = os.environ.get('SMTP_HOST')
        notify_email = os.environ.get('NOTIFY_EMAIL', 'boulghaitimad@gmail.com')
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        if host and smtp_user and smtp_password:
            from email.message import EmailMessage
            msg = EmailMessage()
            msg['Subject'] = 'Inicio de sesión en EnglishPath C1'
            msg['From'] = os.environ.get('SMTP_FROM', smtp_user)
            msg['To'] = notify_email
            msg.set_content(message)
            with smtplib.SMTP(host, int(os.environ.get('SMTP_PORT', '587')), timeout=8) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
    except Exception as exc:
        app.logger.warning('No se pudo enviar aviso por correo: %s', exc)
    # SMS: configurar TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
    try:
        sid = os.environ.get('TWILIO_ACCOUNT_SID')
        token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM')
        to_number = os.environ.get('NOTIFY_PHONE', '+34613936809')
        if sid and token and from_number:
            data = urllib.parse.urlencode({'To': to_number, 'From': from_number, 'Body': message}).encode()
            req = urllib.request.Request(
                f'https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json',
                data=data,
                headers={'Authorization': 'Basic ' + __import__('base64').b64encode(f'{sid}:{token}'.encode()).decode()}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                response.read()
    except Exception as exc:
        app.logger.warning('No se pudo enviar aviso SMS: %s', exc)

@app.get('/login')
def login():
    if session.get('user_id'): return redirect(url_for('home'))
    return render_template('auth.html', mode='login')

@app.post('/login')
def login_post():
    identity = request.form.get('identity','').strip().lower()
    password = request.form.get('password','')
    with connect_db() as conn:
        user = conn.execute('SELECT * FROM users WHERE email=? OR username=?', (identity, identity)).fetchone()
    if not user or not check_password_hash(user['password_hash'], password):
        flash('Usuario/correo o contraseña incorrectos.')
        return redirect(url_for('login'))
    session.clear(); session['user_id'] = user['id']; session['username'] = user['username']
    notify_owner_login(user['username'])
    return redirect(url_for('home'))

@app.get('/register')
def register():
    # El acceso está limitado a las dos cuentas preconfiguradas.
    return redirect(url_for('login'))

@app.post('/register')
def register_post():
    return redirect(url_for('login'))

@app.post('/logout')
def logout():
    session.clear(); return redirect(url_for('login'))

@app.get('/')
@login_required
def home():
    return render_template('index.html', username=session.get('username'))

@app.get('/api/progress')
@login_required
def get_progress():
    with connect_db() as conn:
        row = conn.execute('SELECT progress_json FROM progress WHERE user_id=?', (session['user_id'],)).fetchone()
    return jsonify(json.loads(row['progress_json']) if row else {'xp':0,'correct':0,'streak':0,'lastDate':''})

@app.post('/api/progress')
@login_required
def save_progress():
    payload = request.get_json(silent=True) or {}
    safe = {k: payload.get(k) for k in ('xp','correct','streak','lastDate')}
    if not all(isinstance(safe[k], int) and safe[k] >= 0 for k in ('xp','correct','streak')) or not isinstance(safe['lastDate'], str):
        return jsonify({'error':'Progreso no válido'}), 400
    with connect_db() as conn:
        conn.execute('INSERT INTO progress(user_id,progress_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET progress_json=excluded.progress_json', (session['user_id'], json.dumps(safe)))
    return jsonify({'ok':True})

@app.get('/api/questions')
@login_required
def questions():
    return jsonify(json.loads(DATA.read_text(encoding='utf-8')))

@app.post('/api/check')
@login_required
def check():
    payload = request.get_json(silent=True) or {}
    question_id, answer = payload.get('id'), payload.get('answer')
    bank = json.loads(DATA.read_text(encoding='utf-8'))
    item = next((q for q in bank if q['id'] == question_id), None)
    if item is None: return jsonify({'error':'Pregunta no encontrada'}), 404
    correct = answer == item['answer']
    return jsonify({'correct':correct,'explanation':item['explanation'],'correctAnswer':item['options'][item['answer']]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT','10000')), debug=False)
