const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let progress = {xp:0,correct:0,streak:0,lastDate:''};
fetch('/api/progress').then(r=>r.ok?r.json():null).then(data=>{if(data){progress=data;updateDashboard();}}).catch(()=>{});
let questions = [], current = 0, selected = null, checked = false, quizCorrect = 0;

function saveProgress() {
  updateDashboard();
  fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(progress)}).catch(()=>{});
}
function updateDashboard() {
  $('#xp').textContent = progress.xp;
  $('#correctCount').textContent = progress.correct;
  $('#streak').textContent = progress.streak;
  $('#xpBar').style.width = `${progress.xp % 100}%`;
}
function trackStudy() {
  const today = new Date().toISOString().slice(0,10);
  if (progress.lastDate !== today) {
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    progress.streak = progress.lastDate === yesterday ? progress.streak + 1 : 1;
    progress.lastDate = today;
  }
}
function showView(id) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === id));
  $('#nav').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  if (id === 'practice' && !questions.length) loadQuestions();
}
$$('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
$$('[data-go]').forEach(b => b.addEventListener('click', () => showView(b.dataset.go)));
$('#menuToggle').addEventListener('click', () => $('#nav').classList.toggle('open'));

const lessons = {
 grammar: `<div class="eyebrow">UNIT 01 · JOBS</div><h2>Profesiones relacionadas con la electricidad</h2><p>Aprende primero el nombre del trabajo y después úsalo en una frase completa.</p><div class="lesson-example"><strong>electrician</strong> — electricista<br><strong>electrical engineer</strong> — ingeniero/a eléctrico/a<br><strong>electrical installer</strong> — instalador/a eléctrico/a<br><strong>industrial programmer</strong> — programador/a industrial<br><strong>solar panel installer</strong> — instalador/a de paneles solares<br><strong>line worker</strong> — trabajador/a de líneas eléctricas<br><strong>power plant operator</strong> — operario/a de central eléctrica</div><h3>Describe lo que hace una persona</h3><p><b>An electrical engineer is someone who designs electrical systems.</b><br>Un ingeniero eléctrico es alguien que diseña sistemas eléctricos.</p><p><b>A line worker installs and maintains cables.</b><br>Un trabajador de líneas instala y mantiene cables.</p><p>Reto: elige tres profesiones y crea una frase sobre cada una.</p>`,
 tobe: `<div class="eyebrow">UNIT 02 · PERSONAL QUALITIES</div><h2>Cualidades y sus contrarios</h2><p>En el temario aparecen adjetivos para describir cómo debe ser una persona en el trabajo.</p><div class="lesson-example"><strong>responsible</strong> — responsable ↔ <strong>irresponsible</strong> — irresponsable<br><strong>reliable</strong> — fiable ↔ <strong>unreliable</strong> — poco fiable<br><strong>careful</strong> — cuidadoso ↔ <strong>careless</strong> — descuidado<br><strong>skilled</strong> — cualificado ↔ <strong>unskilled</strong> — sin cualificación<br><strong>polite</strong> — educado ↔ <strong>impolite / rude</strong> — maleducado<br><strong>patient</strong> — paciente ↔ <strong>impatient</strong> — impaciente<br><strong>tidy</strong> — ordenado ↔ <strong>untidy</strong> — desordenado<br><strong>honest</strong> — honesto ↔ <strong>dishonest</strong> — deshonesto</div><h3>Úsalos en contexto</h3><p><b>Electricians have to be careful and responsible.</b><br>Los electricistas tienen que ser cuidadosos y responsables.</p><p><b>A good employee is reliable and hard-working.</b><br>Un buen empleado es fiable y trabajador.</p><p>Consejo: memoriza los adjetivos en parejas y después úsalos en frases.</p>`,
 present: `<div class="eyebrow">UNIT 03 · FREQUENCY</div><h2>Adverbios de frecuencia</h2><p>Sirven para decir con qué frecuencia haces algo. Aprende el orden de más frecuente a menos frecuente.</p><div class="lesson-example"><strong>always</strong> — siempre<br><strong>usually / generally</strong> — normalmente / generalmente<br><strong>often</strong> — a menudo<br><strong>sometimes</strong> — a veces<br><strong>rarely / seldom</strong> — rara vez<br><strong>hardly ever</strong> — casi nunca<br><strong>never</strong> — nunca</div><h3>Posición en la frase</h3><p>Normalmente van antes del verbo principal: <b>I often ride a bike.</b> — A menudo voy en bicicleta.</p><p>Con el verbo <i>to be</i>, normalmente van después: <b>I am usually careful.</b> — Normalmente soy cuidadoso.</p><p>Otros ejemplos del temario: “I sometimes go to the cinema” y “I never play computer games”.</p>`,
 questions: `<div class="eyebrow">UNIT 04 · LIKES & PREFERENCES</div><h2>Expresar gustos y preferencias</h2><div class="lesson-example"><strong>I like…</strong> — Me gusta…<br><strong>I love…</strong> — Me encanta…<br><strong>I don't like…</strong> — No me gusta…<br><strong>I prefer…</strong> — Prefiero…</div><h3>Hablar de una oferta de empleo</h3><p><b>I prefer advert A because it offers a secure job.</b><br>Prefiero el anuncio A porque ofrece un trabajo seguro.</p><p><b>I like working with electrical installations.</b><br>Me gusta trabajar con instalaciones eléctricas.</p><p>Después de <i>like / love / prefer</i>, puedes usar un sustantivo o un verbo terminado en <b>-ing</b>: “I like repairing appliances”.</p>`,
 vocabulary: `<div class="eyebrow">UNIT 05 · RELATIVE CLAUSES</div><h2>Oraciones de relativo: who, which, that, whose, where, when</h2><p>Estas palabras añaden información sobre una persona, cosa, lugar o momento.</p><div class="lesson-example"><strong>who</strong> — personas: “An electrician is a person <b>who</b> repairs appliances.”<br><strong>which</strong> — cosas: “Sony makes TVs <b>which</b> are good quality.”<br><strong>that</strong> — personas o cosas en muchas relativas especificativas.<br><strong>whose</strong> — posesión: “I know a girl <b>whose</b> brother works for Google.”<br><strong>where</strong> — lugares: “Madrid is the city <b>where</b> I live.”<br><strong>when</strong> — tiempo: “2011 was the year <b>when</b> we left school.”</div><h3>Truco para elegir</h3><ul><li>¿Hablas de una persona? Normalmente <b>who</b>.</li><li>¿Hablas de una cosa? <b>which</b> o <b>that</b>.</li><li>¿Indicas de quién es algo? <b>whose</b>.</li><li>¿Lugar? <b>where</b>. ¿Momento? <b>when</b>.</li></ul><p>Fíjate en la frase completa y en la palabra a la que se refiere el hueco.</p>`,
 c1: `<div class="eyebrow">UNIT 06 · JOB APPLICATION</div><h2>Presentarte y hablar de tu experiencia</h2><p>El PDF incluye frases para explicar quién eres, por qué quieres trabajar en una empresa y qué experiencia tienes.</p><div class="lesson-example"><strong>My name is Imad and I am 21 years old.</strong><br>Me llamo Imad y tengo 21 años.<br><strong>I want to work here because your company is an industry leader.</strong><br>Quiero trabajar aquí porque su empresa es líder del sector.<br><strong>I worked as an assistant for one year in a local store.</strong><br>Trabajé como ayudante durante un año en una tienda local.</strong></div><h3>Plantilla para practicar</h3><p>1. My name is…<br>2. I am from…<br>3. I have experience in…<br>4. I want to work here because…<br>5. I am responsible, careful and hard-working.</p><p>Adapta las frases a tu información real. Practica decirlas en voz alta y escribirlas sin mirar.</p>`
};
function showLesson(id) {
  $('#lessonContent').innerHTML = lessons[id] || lessons.grammar;
  $$('.lesson-choice').forEach(b => b.classList.toggle('selected', b.dataset.lesson === id));
}
$$('[data-lesson]').forEach(b => b.addEventListener('click', () => showLesson(b.dataset.lesson)));
$$('[data-topic]').forEach(b => b.addEventListener('click', () => {
  showView('learn');
  showLesson(b.dataset.topic === 'vocabulary' ? 'tobe' : b.dataset.topic === 'exam' ? 'c1' : 'grammar');
}));

async function loadQuestions() {
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    current = 0; quizCorrect = 0; renderQuestion();
  } catch (e) {
    $('#questionText').textContent = 'No se han podido cargar las preguntas. Comprueba que el servidor Python esté iniciado.';
  }
}
function renderQuestion() {
  if (!questions.length) return;
  if (current >= questions.length) {
    $('#questionText').textContent = `¡Bloque terminado! Has acertado ${quizCorrect} de ${questions.length}.`;
    $('#questionHint').textContent = 'Repite la práctica para afianzar lo aprendido.';
    $('#options').innerHTML = '';
    $('#feedback').hidden = true;
    $('#checkBtn').textContent = 'Repetir práctica';
    $('#checkBtn').onclick = () => {current=0;quizCorrect=0;renderQuestion();};
    $('#skipBtn').textContent = 'Volver al inicio';
    $('#skipBtn').onclick = () => showView('dashboard');
    $('#questionCounter').textContent = 'Completado';
    $('#quizBar').style.width = '100%';
    return;
  }
  const q = questions[current];
  selected = null; checked = false;
  $('#quizCategory').textContent = q.category.toUpperCase();
  $('#questionCounter').textContent = `Pregunta ${current+1} de ${questions.length}`;
  $('#quizBar').style.width = `${current/questions.length*100}%`;
  $('#questionText').textContent = q.question;
  $('#questionHint').textContent = q.hint;
  $('#feedback').hidden = true; $('#feedback').className = 'feedback';
  $('#checkBtn').textContent = 'Comprobar respuesta →';
  $('#checkBtn').onclick = checkAnswer;
  $('#skipBtn').textContent = 'Saltar';
  $('#skipBtn').onclick = () => {current++;renderQuestion();};
  $('#options').innerHTML = '';
  q.options.forEach((option,i) => {
    const button = document.createElement('button');
    button.className = 'option';
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65+i)}</span><span></span>`;
    button.querySelector('span:last-child').textContent = option;
    button.addEventListener('click', () => {
      if (checked) return;
      selected = i;
      $$('.option').forEach(x => x.classList.remove('selected'));
      button.classList.add('selected');
    });
    $('#options').appendChild(button);
  });
}
async function checkAnswer() {
  if (current >= questions.length) return;
  if (checked) {current++;renderQuestion();return;}
  if (selected === null) {
    $('#feedback').textContent = 'Elige una respuesta antes de comprobar.';
    $('#feedback').hidden = false; return;
  }
  const q = questions[current];
  try {
    const res = await fetch('/api/check', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.id,answer:selected})});
    const result = await res.json();
    checked = true;
    $$('.option').forEach((b,i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      if (i === selected && !result.correct) b.classList.add('wrong');
    });
    $('#feedback').textContent = `${result.correct ? '¡Correcto! +10 XP. ' : 'Casi. La respuesta correcta es: ' + result.correctAnswer + '. '}${result.explanation}`;
    $('#feedback').classList.toggle('bad', !result.correct);
    $('#feedback').hidden = false;
    if (result.correct) {
      quizCorrect++; progress.xp += 10; progress.correct += 1; trackStudy(); saveProgress();
    }
    $('#checkBtn').textContent = current === questions.length-1 ? 'Ver resultado →' : 'Siguiente pregunta →';
  } catch (e) {
    $('#feedback').textContent = 'No se ha podido comprobar. Asegúrate de iniciar el servidor con python app.py.';
    $('#feedback').hidden = false;
  }
}

const translations = {
  "I|am|happy": "Yo estoy feliz.",
  "I|am|English": "Yo soy inglés / inglesa. (Para decir que estudio inglés: I study English.)",
  "I|am|at home": "Estoy en casa.",
  "I|am|a student": "Soy estudiante.",
  "I|am|every day": "Esta combinación no es natural; prueba “I study every day”.",
  "You|like|happy": "Te gusta estar feliz. (Más natural: You are happy.)",
  "You|like|English": "Te gusta el inglés.",
  "You|like|at home": "Te gusta estar en casa. (Más natural: You like being at home.)",
  "You|like|a student": "Esta combinación no es natural.",
  "You|like|every day": "Te gusta hacerlo todos los días; falta decir qué cosa.",
  "He|like|English": "A él le gusta el inglés. La forma correcta es “He likes English”.",
  "She|like|English": "A ella le gusta el inglés. La forma correcta es “She likes English”.",
};
function updateBuilder() {
  const subject = $('#builderSubject')?.value || 'I';
  const verb = $('#builderVerb')?.value || 'am';
  const object = $('#builderObject')?.value || 'happy';
  let actualVerb = verb;
  if (['He','She'].includes(subject) && ['like','work','study'].includes(verb)) {
    actualVerb = verb === 'study' ? 'studies' : verb + 's';
  }
  if (['He','She'].includes(subject) && verb === 'have') actualVerb = 'has';
  let sentence = `${subject} ${actualVerb} ${object}.`;
  if (verb === 'am' && subject !== 'I') {
    actualVerb = ['He','She'].includes(subject) ? 'is' : 'are';
    sentence = `${subject} ${actualVerb} ${object}.`;
  }
  if (verb === 'am' && ['English','every day'].includes(object)) {
    sentence = object === 'English' ? `${subject} study English.` : `${subject} study every day.`;
    if (['He','She'].includes(subject)) sentence = object === 'English' ? `${subject} studies English.` : `${subject} studies every day.`;
    if (['You','We','They'].includes(subject)) sentence = `${subject} study ${object === 'English' ? 'English' : 'every day'}.`;
  }
  if (verb === 'like' && object === 'happy') sentence = `${subject} ${actualVerb} being happy.`;
  if (verb === 'like' && object === 'at home') sentence = `${subject} ${actualVerb} being at home.`;
  if (verb === 'work' && ['happy','English','a student'].includes(object)) sentence = `${subject} ${actualVerb} ${object}.`;
  if (verb === 'study' && object === 'happy') sentence = `${subject} ${actualVerb} hard.`;
  if (verb === 'have' && object === 'happy') sentence = `${subject} ${actualVerb} a good day.`;
  if (verb === 'have' && object === 'English') sentence = `${subject} ${actualVerb} an English lesson.`;
  if (verb === 'have' && object === 'at home') sentence = `${subject} ${actualVerb} time at home.`;
  if (verb === 'have' && object === 'every day') sentence = `${subject} ${actualVerb} lessons every day.`;
  $('#builderSentence').textContent = sentence;
  let translation = translations[`${subject}|${verb}|${object}`];
  if (!translation) {
    const map = {am:'ser/estar',like:'gustar',work:'trabajar',study:'estudiar',have:'tener'};
    translation = `Pista: “${subject}” + “${actualVerb}” (${map[verb]}) + complemento. Di la frase en voz alta y comprueba su sentido.`;
  }
  $('#builderTranslation').textContent = translation;
}
['builderSubject','builderVerb','builderObject'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateBuilder);
});

showLesson('grammar');
updateBuilder();
updateDashboard();
