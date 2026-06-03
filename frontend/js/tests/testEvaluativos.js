
// funcion okLogin

async function okLogin()
 {
    // 1. Login como productor (pepe) para obtener un token válido
     const response = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username: 'pepe', password: '12345' }) // Usamos pepe hardcodeado
     });
     const data = await response.json();
     // Guardamos el token para tests de samples
     localStorage.setItem('test_token', data.token);
 }

// "Test: Subida - Coherencia del BPM"

testUtils.createTestButton("Test subir sample con BPM erroneo", async (btn) => {

    await okLogin(); // se encuentra un error en el login, el token es invalido. 
    const token=localStorage.getItem('test_token');

    // crear formdata y blob para testear
    const formData = new FormData();
    formData.append('display_name', 'Test bpm ilogico');
    formData.append('category', 'Drums');
    formData.append('bpm', 'ciento veinte');

    const blob = new Blob(["Simulated Audio Content"], { type: 'audio/wav' });
    formData.append('audioFile', blob, 'BPM-ilogico.wav');

    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    // ubicar error y marcar como verde en caso de error 400
    const data = await response.json();
    testUtils.log(data);
    if (response.status == 400)
        testUtils.setSuccess(btn);

}); 

/**
 * Test: POST /api/samples/upload
 * Validación de límite de tamaño (413 Payload Too Large)
 */
testUtils.createTestButton("Test Archivo Mayor a 5MB", async (btn) => {

    // 1. Login para obtener token válido
    await okLogin();
    const token = localStorage.getItem('test_token');

    // 2. Crear archivo simulado de más de 5 MB
    const bigContent = new Uint8Array(6 * 1024 * 1024);

    const bigFile = new Blob(
        [bigContent],
        { type: 'audio/wav' }
    );

    // 3. Crear FormData
    const formData = new FormData();

    formData.append('display_name', 'Archivo Grande');
    formData.append('category', 'Drums');
    formData.append('bpm', '120');

    formData.append(
        'audioFile',
        bigFile,
        'archivoGrande.wav'
    );

    // 4. Enviar request
    const response = await fetch('/api/samples/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();

    testUtils.log(data);

    // 5. Verificar respuesta esperada
    if (
        response.status === 413 &&
        data.message === 'El archivo supera el límite de tamaño permitido'
    ) {
        testUtils.setSuccess(btn);
    }
    else {
        testUtils.setFailure(btn);
     }
});

// Test Registro - Contraseña demasiado corta

testUtils.createTestButton("Test Registro - Password Corta", async (btn) => {

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'usuarioTest',
            password: '123'
        })
    });

    const data = await response.json();
    testUtils.log(data);

    // valida HTTP 400
    if (
        response.status === 400 &&
        data.message === "La contraseña es demasiado corta"
    ) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Test Opción 9: Borrado Fantasma (HTTP 404)
 * Intenta borrar un sample con un ID que no existe en la base de datos.
 * El servidor debe responder con 404 si no encuentra el registro.
 */
testUtils.createTestButton("Test Borrado Fantasma (ID inexistente)", async (btn) => {
    const token = localStorage.getItem('test_token');

    const response = await fetch('/api/samples/99999', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    testUtils.log(data);

    if (response.status === 404) {
        document.getElementById('modal-message').textContent = data.message;
        document.getElementById('error-modal').style.display = 'block';
        testUtils.setSuccess(btn);
    }
});