# EnglishPath C1 — temario de clase (lista para Render)

Proyecto web educativo con Flask, HTML, CSS y JavaScript. La aplicación incluye ejercicios y lecciones basados en los temas legibles del PDF compartido: profesiones eléctricas, cualidades personales, adverbios de frecuencia, gustos y preferencias, ofertas de empleo, oraciones de relativo y presentación laboral.

## Ejecutar en tu ordenador
Necesitas Python 3.10 o superior.

```bash
pip install -r requirements.txt
python app.py
```

Abre `http://127.0.0.1:5000`.

## Publicar en GitHub y desplegar en Render

### 1. Crear el repositorio en GitHub
1. Entra en https://github.com y accede a tu cuenta.
2. Pulsa **New repository**.
3. Ponle `englishpath-c1-temario`.
4. Para seguir esta guía, elige **Public** (o Private si prefieres mantenerlo privado; Render puede conectarse a ambos si autorizas el acceso).
5. Crea el repositorio vacío. Si vas a subir esta carpeta, no marques la opción para añadir README, para evitar conflictos.

### 2. Subir los archivos
La forma más sencilla, sin usar comandos Git:
1. Descomprime el ZIP.
2. En la página del repositorio pulsa **Add file → Upload files**.
3. Arrastra los archivos y carpetas del proyecto descomprimido (incluidos `app.py`, `requirements.txt`, `Procfile`, `render.yaml`, `templates`, `static` y `data`).
4. Pulsa **Commit changes**.

No subas el PDF del libro ni contraseñas/tokens al repositorio.

### 3. Desplegar en Render
1. Entra en https://render.com y crea/inicia sesión en tu cuenta.
2. Elige **New + → Web Service**.
3. Conecta GitHub y autoriza el repositorio `englishpath-c1-temario`.
4. Render detectará Python. Configura:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Health Check Path:** `/`
5. Si aparece la opción de plan, elige Free para empezar, si está disponible en tu cuenta.
6. Pulsa **Create Web Service** y espera a que termine el despliegue.
7. Abre la URL `https://...onrender.com` que Render muestre en el panel.

El archivo `render.yaml` contiene la configuración de despliegue para que Render pueda leerla como Blueprint, si eliges ese método.

## Si falla el despliegue
- Revisa la pestaña **Logs** en Render.
- Comprueba que `app.py`, `requirements.txt`, `templates/index.html`, `static/` y `data/questions.json` están en la raíz del repositorio con esa estructura.
- Si sale `ModuleNotFoundError: No module named 'gunicorn'`, confirma que `gunicorn` está en `requirements.txt` y vuelve a desplegar.
- Si sale `Application failed to respond`, confirma que el comando de inicio sea exactamente `gunicorn app:app`.

## Importante
No puedo publicar en tus cuentas de GitHub o Render desde este chat porque no tengo una conexión autorizada a esas cuentas. El ZIP está preparado para que tú lo subas y conectes. No compartas tu contraseña conmigo.

## Plan de estudio sugerido
Estudia 45 minutos al día: 10 min teoría, 10 min vocabulario, 10 min ejercicios, 10 min lectura/escucha en voz alta y 5 min de repaso. Usa el temario exacto que marque tu profesor; algunas páginas del PDF son escaneadas y no se pudo extraer todo su contenido.

## Cuentas de usuario

La aplicación incluye registro, inicio/cierre de sesión y progreso individual por cuenta mediante SQLite. Las contraseñas se guardan con hash seguro, no en texto plano.

**Importante para Render:** el disco local de un servicio gratuito puede ser efímero; la base SQLite puede perderse al reiniciar o desplegar. Para conservar las cuentas y el progreso de forma fiable, configura una base de datos persistente (por ejemplo PostgreSQL) o un disco persistente compatible con tu plan. Define también la variable de entorno `SECRET_KEY` con un valor largo y aleatorio en Render.


## Acceso con las dos cuentas solicitadas

Al iniciar la aplicación, se crean automáticamente estas cuentas si no existen:

- Usuario: `imad` · Contraseña: `1987`
- Usuario: `iman` · Contraseña: `1987`

Cada usuario tiene su propio progreso guardado en la base de datos SQLite del servidor. No se comparte entre cuentas. La contraseña se almacena como hash.

## Avisos por correo y SMS

El código envía un aviso cada vez que se inicia sesión correctamente, pero por seguridad no incluye credenciales de servicios. Para activar los avisos en producción, añade estas variables de entorno en Render (Dashboard → servicio → Environment):

**Correo (SMTP):**
- `SMTP_HOST` — servidor SMTP de tu proveedor
- `SMTP_PORT` — normalmente `587`
- `SMTP_USER` — cuenta de correo autenticada
- `SMTP_PASSWORD` — contraseña de aplicación/token SMTP, no tu contraseña normal
- `SMTP_FROM` — opcional; remitente autorizado
- `NOTIFY_EMAIL` — opcional; por defecto `boulghaitimad@gmail.com`

**SMS con Twilio:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM` — número de Twilio habilitado para enviar SMS
- `NOTIFY_PHONE` — opcional; por defecto `+34613936809`

Los avisos por correo/SMS solo se enviarán cuando el proveedor correspondiente esté configurado. Twilio puede cobrar por SMS y requiere verificar/configurar el destinatario según las reglas de la cuenta. No pongas estas claves en GitHub ni en archivos públicos.

**Importante:** antes de publicar, cambia `SECRET_KEY` por un valor largo y aleatorio. La contraseña `1987` es débil; cualquiera que la conozca puede entrar, así que usa el acceso solo con personas de confianza o cámbiala por una contraseña más fuerte cuando sea posible. Para que el progreso sobreviva a despliegues, usa una base de datos persistente.
