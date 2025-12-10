import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// db ya existe porque viene desde index.html
const db = window.db;

// Obtengo los elementos del HTML donde voy a poner los modos recientes
const modoRec1El = document.getElementById("modoReciente1");
const modoRec2El = document.getElementById("modoReciente2");

// Escuchar los modos recientes guardados por la ESP32
onValue(ref(db, "lumo/modosRecientes"), (snapshot) => {
    const data = snapshot.val();

    if (!data) return;

    const modo1 = data["1"] || "—";
    const modo2 = data["2"] || "—";

    modoRec1El.textContent = modo1;
    modoRec2El.textContent = modo2;
});


function safeSet(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}


//MOSTRAR ALERTA
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");

    toastText.textContent = mensaje;
    toast.classList.add("mostrar");

    setTimeout(() => {
        toast.classList.remove("mostrar");
    }, 2400);
}
//---------------------------------

const estadoModoRef = ref(db, "lumo/modoActivo");


onValue(estadoModoRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.val();

    const estado = data.estado || "—";
    const ritmo = data.ritmo || "—";
    const intensidad = data.intensidad || "—";
    const tipo = data.tipo || "—";
    const luz = data.luz || "—";
    const motor = data.motor || "—";

    // --------------------
    // PERSONA
    // --------------------
    if (modosPersona[modoActivo]) {
safeSet("p_estado", estado);
safeSet("p_ritmo", ritmo);
safeSet("p_intensidad", intensidad);
safeSet("p_tipo", tipo);

    }

    // --------------------
    // MASCOTA
    // --------------------
    if (modosMascota[modoActivo]) {
safeSet("m_ladrido", data.llanto || "—");
safeSet("m_mov", data.movimiento || "—");
safeSet("m_motor", motor);
safeSet("m_luz", luz);

    }

    // --------------------
    // BEBÉ
    // --------------------
    if (modosBebe[modoActivo]) {
safeSet("b_mov", data.movimiento || "—");
safeSet("b_llanto", data.llanto || "—");
safeSet("b_motor", motor);
safeSet("b_luz", luz);

    }

    // ============================
// NOTIFICACIONES MASCOTA
// ============================
if (modosMascota[modoActivo]) {

    const ladrido = data.llanto === "SI";
    const movimiento = data.movimiento === "SI";
    const vibrando = data.motor === "ON";

    // Condición de evento importante
    if (ladrido || movimiento || vibrando) {
        if (Date.now() - ultimaNotif > cooldownNotif) {

            let titulo = "Mascota en alerta";
            let descripcion = "";

            if (ladrido) descripcion = "Se detectó un ladrido.";
            else if (movimiento) descripcion = "Se detectó movimiento.";
            else if (vibrando) descripcion = "El dispositivo activó vibración por alerta.";

            mostrarNotificacion(titulo, descripcion, "imgs/mascota.svg");

            ultimaNotif = Date.now();
        }
    }
}

// ============================
// NOTIFICACIONES BEBÉ
// ============================
if (modosBebe[modoActivo]) {

    const llanto = data.llanto === "SI";
    const movimiento = data.movimiento === "SI";
    const vibrando = data.motor === "ON";

    if (llanto || movimiento || vibrando) {
        if (Date.now() - ultimaNotif > cooldownNotif) {

            let titulo = "Bebé activo";
            let descripcion = "";

            if (llanto) descripcion = "El bebé está llorando.";
            else if (movimiento) descripcion = "Se detectó movimiento.";
            else if (vibrando) descripcion = "Vibración activada para calmar.";

            mostrarNotificacion(titulo, descripcion, "imgs/bebe.svg");

            ultimaNotif = Date.now();
        }
    }
}

});


function mostrarNotificacion(titulo, descripcion, icono = "imgs/mascota.svg") {

    ocultarTodasLasPantallas(); // ya lo tenías

    document.querySelector(".notificacion").style.display = "block";

    // Ocultar nav
    document.getElementById("bottom-nav").style.display = "none";

    document.querySelector(".notif-icon").src = icono;
    document.querySelector(".notif-estado").textContent = titulo;
    document.querySelector(".notif-descripcion").textContent = descripcion;

    activarIconoModos();
}

document.getElementById("btnDetenerNotif").addEventListener("click", async () => {
    await set(ref(db, "lumo/modoActivo"), null);
    modoActivo = null;
    inicioModo = null;
    irAHome();
    document.getElementById("bottom-nav").style.display = "flex";
});

document.getElementById("volverNotificaciones").addEventListener("click", () => {

    // ocultar notificación
    document.querySelector(".notificacion").style.display = "none";

    // mostrar HOME correctamente
    ocultarTodasLasPantallas();
    document.querySelector(".home").style.display = "block";

    // mostrar nav
    document.getElementById("bottom-nav").style.display = "flex";

    // reactivar icono
    activarIconoHome();

    // actualizar tarjeta del modo activo si la hubiera
    actualizarModoActivoUI();
});





// -----------------------------
//  ESTADO GLOBAL
// -----------------------------
let modoActualSeleccionado = null; // ← MODO QUE ABRISTE EN DETALLE
let modoActivo = null;             // ← MODO QUE ESTÁ REALMENTE ACTIVO
let inicioModo = null;             // ← TIMESTAMP DEL INICIO PARA EL TIEMPO

let ultimaNotif = 0;
let cooldownNotif = 10000; // 3 segundos


activarIconoHome();

window.addEventListener("load", () => {
    setTimeout(() => {
        document.querySelector(".splash").style.display = "none";
        document.querySelector(".home").style.display = "block";
        document.getElementById("bottom-nav").style.display = "flex";
    }, 3000);
});

// ==========================
//  COLOR PICKER (CANVAS)
// ==========================
const canvas = document.getElementById("colorWheel");
const ctx = canvas.getContext("2d");
const indicator = document.getElementById("colorIndicator");

canvas.width = 260;
canvas.height = 260;

function drawWheel() {
    const radius = canvas.width / 2;

    for (let angle = 0; angle < 360; angle++) {
        const start = (angle - 1) * Math.PI / 180;
        const end = angle * Math.PI / 180;

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, start, end);
        ctx.closePath();

        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(radius, radius, radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#150B27";
    ctx.fill();
}
drawWheel();

canvas.style.touchAction = "none";

let selectedColor = null;
let isDragging = false;

function pickColor(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] === 0) return; // transparente

    selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    console.log("Color seleccionado:", selectedColor);

    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    indicator.style.background = selectedColor;
    indicator.style.display = "block";
    resetGuardarBoton();
}

// Click / drag
canvas.addEventListener("pointerdown", e => {
    isDragging = true;
    pickColor(e);
});
canvas.addEventListener("pointermove", e => {
    if (isDragging) pickColor(e);
});
canvas.addEventListener("pointerup", () => isDragging = false);
canvas.addEventListener("pointerleave", () => isDragging = false);

// ==========================
// GUARDAR COLOR EN FIREBASE
// ==========================
const guardarBtn = document.getElementById("guardarColor");

function resetGuardarBoton() {
    const guardarBtn = document.getElementById("guardarColor");
    guardarBtn.innerText = "Guardar";
    guardarBtn.classList.remove("btn-success");
    guardarBtn.disabled = false;
}

guardarBtn.addEventListener("click", async () => {

    // ⛔ BLOQUEO: si hay un modo activo no se puede guardar color
    if (modoActivo) {
        mostrarToast("Debes detener el modo activo para seleccionar un color.");
        return;
    }

    if (!selectedColor) {
        resetGuardarBoton();
        return;
    }

    try {
        await set(ref(db, "lumo/colorActual"), {
            color: selectedColor,
            timestamp: Date.now()
        });

        guardarBtn.innerText = "Color guardado!";
        guardarBtn.classList.add("btn-success");
        guardarBtn.disabled = true;

    } catch (error) {
        console.error("Error guardando color:", error);
        resetGuardarBoton();
    }
});



// =====================================================
//  INFO DE MODOS (PERSONA / MASCOTA / BEBÉ)
// =====================================================
const modosPersona = {
    respiracion: {
        titulo: "Respiración",
        desc: "Luz que acompaña tu respiración",
        icono: "imgs/persona.svg"
    },
    antiestres: {
        titulo: "Antiestrés",
        desc: "Transiciones de colores suaves",
        icono: "imgs/persona.svg"
    },
    concentracion: {
        titulo: "Concentración",
        desc: "Luz estable y enfocada",
        icono: "imgs/persona.svg"
    },
    energia: {
        titulo: "Energía",
        desc: "Impulsos de luz cálida",
        icono: "imgs/persona.svg"
    },
    sueno: {
        titulo: "Sueño",
        desc: "Ciclo de luz tenue",
        icono: "imgs/persona.svg"
    }
};

const modosMascota = {
    calma: {
        titulo: "Calma",
        desc: "Luz y vibración suave",
        icono: "imgs/mascota.svg"
    },
    compania: {
        titulo: "Compañía",
        desc: "Detecta sonidos y movimientos",
        icono: "imgs/mascota.svg"
    },
    juego: {
        titulo: "Juego",
        desc: "Detecta sonidos y reacciona",
        icono: "imgs/mascota.svg"
    },
    alerta: {
        titulo: "Alerta",
        desc: "Detecta cambios y avisa",
        icono: "imgs/mascota.svg"
    },
    noche: {
        titulo: "Noche",
        desc: "Luz muy suave",
        icono: "imgs/mascota.svg"
    }
};

const modosBebe = {
    tranquilo: {
        titulo: "Tranquilo",
        desc: "Luz suave y ambiente relajado",
        icono: "imgs/bebe.svg"
    },
    activo: {
        titulo: "Activo",
        desc: "Detecta movimientos e ilumina",
        icono: "imgs/bebe.svg"
    },
    inquieto: {
        titulo: "Inquieto",
        desc: "Luz y vibración en llantos",
        icono: "imgs/bebe.svg"
    },
    atencion: {
        titulo: "Atención",
        desc: "Reacción a ruidos y movimientos",
        icono: "imgs/bebe.svg"
    }
};

const idsPersona = ["respiracion", "antiestres", "concentracion", "energia", "sueno"];

// -----------------------------
//  PANTALLA DETALLE PERSONA
// -----------------------------
const pantallaDetalle = document.getElementById("modo-detalle");
const tituloDetalle = document.getElementById("modoTitulo");
const descDetalle = document.getElementById("modoDescripcion");
const circuloResp = document.getElementById("circuloRespiracion");
const botonModo = document.getElementById("botonModo");

function actualizarBotonModoPersona() {
    if (modoActivo === modoActualSeleccionado) {
        botonModo.textContent = "Detener modo";
        circuloResp.classList.add("activo");
    } else {
        botonModo.textContent = "Iniciar modo";
        circuloResp.classList.remove("activo");
    }
}

function abrirModoPersona(idModo) {
    const info = modosPersona[idModo];
    if (!info) return;

    modoActualSeleccionado = idModo;

    tituloDetalle.textContent = info.titulo;
    descDetalle.textContent = info.desc;

    actualizarBotonModoPersona();
    mostrarSolo("#modo-detalle");
}

// tarjetas persona
const tarjetasPersona = document.querySelectorAll(".modo-persona .persona-card");
tarjetasPersona.forEach((card, index) => {
    const idModo = idsPersona[index];
    card.addEventListener("click", () => abrirModoPersona(idModo));
});

// back del detalle
document.getElementById("volverPersona").addEventListener("click", () => {
    mostrarSolo(".modo-persona");
});

document.getElementById("volverHomeDesdeActivo").addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".home").style.display = "block";
    activarIconoHome();  // ← este es el correcto al volver a HOME
});

document.querySelectorAll(".modo-card")[1].addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modo-mascota").style.display = "block";
    activarIconoModos();
});


const tarjetasMascota = document.querySelectorAll(".mascota-card");

tarjetasMascota.forEach(card => {
    card.addEventListener("click", () => {
        const idModo = card.dataset.id;

        modoActualSeleccionado = idModo;

        const info = modosMascota[idModo];

        document.getElementById("modoMascotaTitulo").textContent = info.titulo;
        document.getElementById("modoMascotaDescripcion").textContent = info.desc;

        actualizarBotonModoMascota();

        ocultarTodasLasPantallas();
        document.getElementById("modo-mascota-detalle").style.display = "block";
    });
});

function actualizarBotonModoMascota() {
    const boton = document.getElementById("botonModoMascota");
    const circulo = document.getElementById("circuloMascota");

    if (modoActivo === modoActualSeleccionado) {
        boton.textContent = "Detener modo";
        circulo.classList.add("activo");
    } else {
        boton.textContent = "Iniciar modo";
        circulo.classList.remove("activo");
    }
}

document.getElementById("botonModoMascota").addEventListener("click", async () => {

    // ⛔ Bloquear si hay otro modo activo
    if (modoActivo && modoActivo !== modoActualSeleccionado) {
mostrarToast("Debes detener el modo activo para iniciar otro.");
        return;
    }

    if (!modoActualSeleccionado) return;

    if (!modoActivo) {
        modoActivo = modoActualSeleccionado;
        inicioModo = Date.now();

        await set(ref(db, "lumo/modoActivo"), {
            nombre: modoActivo,
            inicio: inicioModo
        });

    } else {
        modoActivo = null;
        inicioModo = null;
        await set(ref(db, "lumo/modoActivo"), null);
    }

    actualizarBotonModoMascota();
    actualizarModoActivoUI();
});



document.getElementById("volverMascota").addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modo-mascota").style.display = "block";
    activarIconoModos();
});

document.getElementById("volverModosMascota").addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modos").style.display = "block"; 
    activarIconoModos();
});


// =========================================
//           MODO BEBÉ
// =========================================

// Abrir lista de modos bebé
document.querySelectorAll(".modo-card")[2].addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modo-bebe").style.display = "block";
    activarIconoModos();
});

// Tarjetas bebé
const tarjetasBebe = document.querySelectorAll(".bebe-card");

tarjetasBebe.forEach(card => {
    card.addEventListener("click", () => {
        const idModo = card.dataset.id;
        modoActualSeleccionado = idModo;

        const info = modosBebe[idModo];

        document.getElementById("modoBebeTitulo").textContent = info.titulo;
        document.getElementById("modoBebeDescripcion").textContent = info.desc;

        actualizarBotonModoBebe();

        ocultarTodasLasPantallas();
        document.getElementById("modo-bebe-detalle").style.display = "block";
    });
});

// Actualizar botón iniciar/detener
function actualizarBotonModoBebe() {
    const boton = document.getElementById("botonModoBebe");
    const circulo = document.getElementById("circuloBebe");

    if (modoActivo === modoActualSeleccionado) {
        boton.textContent = "Detener modo";
        circulo.classList.add("activo");
    } else {
        boton.textContent = "Iniciar modo";
        circulo.classList.remove("activo");
    }
}

// Click iniciar/detener
document.getElementById("botonModoBebe").addEventListener("click", async () => {

    // ⛔ Bloqueo si ya hay un modo activo distinto
    if (modoActivo && modoActivo !== modoActualSeleccionado) {
mostrarToast("Debes detener el modo activo para iniciar otro.");
        return;
    }

    if (!modoActualSeleccionado) return;

    if (!modoActivo) {
        modoActivo = modoActualSeleccionado;
        inicioModo = Date.now();

        await set(ref(db, "lumo/modoActivo"), {
            nombre: modoActivo,
            inicio: inicioModo
        });

    } else {
        modoActivo = null;
        inicioModo = null;
        await set(ref(db, "lumo/modoActivo"), null);
    }

    actualizarBotonModoBebe();
    actualizarModoActivoUI();
});


// Volver atrás al listado de modos bebé
document.getElementById("volverBebe").addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modo-bebe").style.display = "block";
    activarIconoModos();
});

// Volver a "Modos"
document.getElementById("volverModosBebe").addEventListener("click", () => {
    ocultarTodasLasPantallas();
    document.querySelector(".modos").style.display = "block";
    activarIconoModos();
});




// =====================================================
//  MODO ACTIVO EN HOME (UI + TIEMPO + FIREBASE)
// =====================================================
function actualizarModoActivoUI() {
    const card = document.getElementById("home-modo-activo");
    const home = document.querySelector(".home");

    const homeVisible = home.style.display !== "none";

    // Si NO estamos en home → ocultar tarjeta y quitar scroll
    if (!homeVisible) {
        card.style.display = "none";
        home.classList.remove("scroll-activo");
        return;
    }

    // Si NO hay modo activo → ocultar tarjeta y quitar scroll
    if (!modoActivo) {
        card.style.display = "none";
        home.classList.remove("scroll-activo");
        return;
    }

    // ==== SI HAY MODO ACTIVO Y ESTAMOS EN HOME ====
    card.style.display = "flex";

    // Activar scroll SOLO aquí
    home.classList.add("scroll-activo");

    const data =
        modosPersona[modoActivo] ||
        modosMascota[modoActivo] ||
        modosBebe[modoActivo];

    document.getElementById("modoActivoTitulo").innerText = data.titulo;
    document.getElementById("modoActivoDesc").innerText = data.desc;
    document.getElementById("iconoModoActivo").src = data.icono;
}


document.getElementById("home-modo-activo").addEventListener("click", () => {
    if (!modoActivo) return;

    ocultarTodasLasPantallas();
    document.querySelector(".modo-activo-detalle").style.display = "block";

    activarIconoModos(); // ← ahora sí el icono de modos se marca activo

    cargarDatosModoActivo();
});



function cargarDatosModoActivo() {

    const titulo = document.getElementById("tituloModoActivoDetalle");
    const icono = document.getElementById("iconoModoActivoGrande");
    const contenedor = document.getElementById("modoDetalleDatos");

    const info =
        modosPersona[modoActivo] ||
        modosMascota[modoActivo] ||
        modosBebe[modoActivo];

    icono.src = info.icono;

    contenedor.innerHTML = "";

    function fila(label, idValor) {
        return `
            <p>
                <span class="label">${label}:</span>
                <span class="valor" id="${idValor}">—</span>
            </p>
        `;
    }

    // ----- PERSONA -----
    if (modosPersona[modoActivo]) {
        titulo.textContent = "Modo Persona";

        contenedor.innerHTML = `
            ${fila("Estado", "p_estado")}
            ${fila("Ritmo", "p_ritmo")}
            ${fila("Intensidad", "p_intensidad")}
            ${fila("Tipo", "p_tipo")}
        `;

        document.getElementById("p_tipo").innerText = info.titulo;
        return;
    }

    // ----- MASCOTA -----
    if (modosMascota[modoActivo]) {
        titulo.textContent = "Modo Mascota";

        contenedor.innerHTML = `
            ${fila("Ladrido", "m_ladrido")}
            ${fila("Movimiento", "m_mov")}
            ${fila("Motor", "m_motor")}
            ${fila("Luz", "m_luz")}
        `;
        return;
    }

    // ----- BEBÉ -----
    if (modosBebe[modoActivo]) {
        titulo.textContent = "Modo Bebé";

        contenedor.innerHTML = `
            ${fila("Movimiento", "b_mov")}
            ${fila("Llanto", "b_llanto")}
            ${fila("Motor", "b_motor")}
            ${fila("Luz", "b_luz")}
        `;
        return;
    }
}




document.getElementById("detenerModoDetalle").addEventListener("click", async () => {
    modoActivo = null;
    inicioModo = null;

    await set(ref(db, "lumo/modoActivo"), null);

    irAHome();
    actualizarModoActivoUI();
});





setInterval(() => {
    if (!modoActivo || !inicioModo) return;

    let s = Math.floor((Date.now() - inicioModo) / 1000);
    let textoTiempo =
        s < 60
            ? `${s}s`
            : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")} min`;

    document.getElementById("modoActivoTiempo").innerText = textoTiempo;
}, 1000);

// botón Activar / Detener modo
botonModo.addEventListener("click", async () => {

    // ⛔ Bloqueo si ya hay un modo activo y NO es este mismo
    if (modoActivo && modoActivo !== modoActualSeleccionado) {
mostrarToast("Debes detener el modo activo para iniciar otro.");
        return;
    }

    if (!modoActualSeleccionado) return;

    try {
        if (!modoActivo) {
            // ACTIVAR
            modoActivo = modoActualSeleccionado;
            inicioModo = Date.now();

            await set(ref(db, "lumo/modoActivo"), {
                nombre: modoActivo,
                inicio: inicioModo
            });
        } else {
            // DETENER
            modoActivo = null;
            inicioModo = null;
            await set(ref(db, "lumo/modoActivo"), null);
        }

        actualizarBotonModoPersona();
        actualizarModoActivoUI();

    } catch (err) {
        console.error("Error escribiendo modo activo:", err);
    }
});



// ================== NAVEGACIÓN ==================
function mostrarSolo(selector) {
    document.querySelectorAll(".pantalla").forEach(p => p.style.display = "none");
    const el = document.querySelector(selector);
    if (el) el.style.display = "block";
}

function ocultarTodasLasPantallas() {
    document.querySelectorAll(".pantalla").forEach(p => p.style.display = "none");
}

function irAModos() {
    ocultarTodasLasPantallas();
    document.querySelector(".modos").style.display = "block";
    activarIconoModos();
}

function volverHome() {
    document.querySelector(".modos").style.display = "none";
    document.querySelector(".home").style.display = "block";
    activarIconoHome();
    actualizarModoActivoUI(); // ← agregar este
}


function irAModoPersona() {
    ocultarTodasLasPantallas();
    document.querySelector(".modo-persona").style.display = "block";
    activarIconoModos();
}

function volverAModos() {
    ocultarTodasLasPantallas();
    document.querySelector(".modos").style.display = "block";
    activarIconoModos();
}

function irAHome() {
    ocultarTodasLasPantallas();
    document.querySelector(".home").style.display = "block";
    activarIconoHome();
    actualizarModoActivoUI(); // ← agregar este
}


function activarIconoModos() {
    document.querySelectorAll(".nav-item").forEach(i =>
        i.classList.remove("active")
    );
    document.querySelectorAll(".nav-item")[1].classList.add("active");
}

function activarIconoHome() {
    document.querySelectorAll(".nav-item").forEach(i =>
        i.classList.remove("active")
    );
    document.querySelectorAll(".nav-item")[0].classList.add("active");
}

// listeners navegación
document.getElementById("modoPersonaCard").addEventListener("click", irAModoPersona);
document.getElementById("volverModosPersona").addEventListener("click", volverAModos);

document.getElementById("navHome").addEventListener("click", irAHome);
document.querySelector(".btn-main").addEventListener("click", irAModos);
document.getElementById("volverHome").addEventListener("click", volverHome);

document.querySelectorAll(".nav-item")[1].addEventListener("click", irAModos);
document.getElementById("nav-home").addEventListener("click", volverHome);
document.getElementById("nav-modos").addEventListener("click", irAModos);

