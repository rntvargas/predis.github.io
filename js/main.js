var canvas, ctx;
var mouseX, mouseY, mouseDown = 0;
var touchX, touchY;

// Función para interactuar con el lienzo

function init() {
    canvas = document.getElementById('sketchpad');
    // '2d' significa contexto de renderizado bidimensional en el lienzo
    ctx = canvas.getContext('2d');
    // Obtenemos el contexto del lienzo en la variable ctx
    // Rellenamos el fondo del ctx con color negro
    ctx.fillStyle = "black";
    // Dibuja un rectángulo relleno con inicio en x=0, y=0 
    // y el ancho y alto del lienzo
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (ctx) {
        // Si se hace clic con el mouse, llama a la función 
        // sketchPad_mouseDown. El false indica fase de burbuja
        canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
        canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
        window.addEventListener('mouseup', sketchpad_mouseUp, false);
        canvas.addEventListener('touchstart', sketchpad_touchStart, false);
        canvas.addEventListener('touchmove', sketchpad_touchMove, false);
    }
}

// Ahora, para habilitar el dibujo en el lienzo definimos la función draw
function draw(ctx, x, y, size, isDown) {
    if (isDown) {
        // Informar al lienzo que se va a dibujar
        ctx.beginPath();
        // Establecer el color de la línea
        ctx.strokeStyle = "white";
        // Establecer el ancho de la línea
        ctx.lineWidth = '15';
        // .lineJoin: establece la conexión entre dos líneas
        // lineCap: establece el final de la línea
        ctx.lineJoin = ctx.lineCap = 'round';
        // Indica dónde comenzar a dibujar la línea
        ctx.moveTo(lastX, lastY);
        // Dibuja la línea desde el inicio hasta la posición actual del puntero
        ctx.lineTo(x, y);
        // Completa el dibujo
        ctx.closePath();
        // Pinta la línea dibujada con algunos píxeles
        ctx.stroke();
    }
    // Si no se presiona el mouse, la posición inicial es la actual
    lastX = x;
    lastY = y;
}

// Manejadores de eventos

// Cuando el mouse está presionado, llama a la función draw
function sketchpad_mouseDown() {
    mouseDown = 1;
    draw(ctx, mouseX, mouseY, 12, false);
}

// Cuando se suelta el mouse, se restablece mouseDown a false
function sketchpad_mouseUp() {
    mouseDown = 0;
}

// Se activa cuando el mouse se mueve en cualquier dirección
// Obtiene la posición actual del mouse usando getMousePos(e)
// Si mouseDown es true, llama a la función draw
function sketchpad_mouseMove(e) {
    getMousePos(e);
    if (mouseDown == 1) {
        draw(ctx, mouseX, mouseY, 12, true);
    }
}

// Encuentra la posición actual del puntero
// cuando se dispara un evento del mouse
function getMousePos(e) {
    if (!e)
        var e = event;
    if (e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    } else if (e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
}

// Manejador de eventos táctiles

// Se activa cuando el usuario toca el lienzo
// Llama a la función draw con false para anotar posición sin dibujar
function sketchpad_touchStart() {
    getTouchPos();
    draw(ctx, touchX, touchY, 12, false);
    // Evita el desplazamiento de la pantalla al dibujar
    event.preventDefault();
}

// Se activa cuando el usuario arrastra en el lienzo
// Llama a draw con el flag true para habilitar el dibujo
function sketchpad_touchMove(e) {
    getTouchPos(e);
    draw(ctx, touchX, touchY, 12, true);
    event.preventDefault();
}

// Se utiliza para encontrar el punto en el lienzo donde el usuario tocó
function getTouchPos(e) {
    if (!e)
        var e = event;
    if (e.touches) {
        // La longitud se usa para determinar 
        // cuántos dedos tocaron
        if (e.touches.length == 1) {
            var touch = e.touches[0];
            touchX = touch.pageX - touch.target.offsetLeft;
            touchY = touch.pageY - touch.target.offsetTop;
        }
    }
}

// Limpia el lienzo
// Al hacer clic en el botón de limpiar, rellena el fondo con color negro
document.getElementById('clear_button').addEventListener("click",
    function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

// Integración del lienzo con el modelo de CNN

// Cargar el modelo

// La URL base del sitio web donde 
// nuestra aplicación web está desplegada se obtiene desde window.location.origin
// El archivo JSON se carga usando una función asíncrona
var base_url = window.location.origin;
let model;
(async function () {
    console.log("Cargando modelo...");
    model = await tf.loadLayersModel("https://maneprajakta.github.io/Digit_Recognition_Web_App/models/model.json")
    console.log("Modelo cargado.");
})();

// Preprocesamiento del modelo

/*
El dígito dibujado se pasa como imagen al modelo
para predecir el valor correspondiente
*/
function preprocessCanvas(image) {
    // Redimensionar la imagen de entrada al tamaño objetivo (1, 28, 28) 
    let tensor = tf.browser.fromPixels(image)
        .resizeNearestNeighbor([28, 28])
        .mean(2)
        .expandDims(2)
        .expandDims()
        .toFloat();
    console.log(tensor.shape);
    return tensor.div(255.0);
}

// Predicción
// canvas.toDataURL(): devuelve la imagen en el formato especificado (por defecto PNG)
// Luego se envía a la función preprocess
document.getElementById('predict_button').addEventListener("click", async function () {
    var imageData = canvas.toDataURL();
    let tensor = preprocessCanvas(canvas);
    console.log(tensor)
    let predictions = await model.predict(tensor).data();
    console.log(predictions)
    let results = Array.from(predictions);
    displayLabel(results);
    console.log(results);
});

// Mostrar resultados
function displayLabel(data) {
    var max = data[0];
    var maxIndex = 0;
    for (var i = 1; i < data.length; i++) {
        if (data[i] > max) {
            maxIndex = i;
            max = data[i];
        }
    }
    document.getElementById('result').innerHTML = maxIndex;
    document.getElementById('confidence').innerHTML = "Confianza: " + (max * 100).toFixed(2) + "%";
}

