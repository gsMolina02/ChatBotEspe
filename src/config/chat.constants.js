const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const MAX_MESSAGE_LENGTH = 500;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const SOCKET_EVENTS = {
    CONNECT: 'connection',
    USER_JOINED: 'userJoined',
    USER_LEFT: 'userLeft',
    MESSAGE: 'message',
    TYPING: 'typing',
    STOP_TYPING: 'stopTyping',
    ROOM_HISTORY: 'roomHistory'
};

const MAX_ROOM_HISTORY = 100;

const ROOMS = {
    materias: {
        label: 'Materias',
        emoji: '📚',
        subcategories: [
            {
                id: 'primer-pao',
                label: 'Primer PAO',
                rooms: [
                    { id: 'calculo-diferencial', name: 'Cálculo Diferencial e Integral' },
                    { id: 'quimica-1', name: 'Química I' },
                    { id: 'fundamentos-programacion', name: 'Fundamentos de Programación' },
                    { id: 'algebra-lineal', name: 'Álgebra Lineal' },
                    { id: 'fundamentos-ing-software', name: 'Fundamentos de la Ingeniería de Software' },
                    { id: 'metodologia-investigacion', name: 'Metodología de la Investigación Científica' },
                ]
            },
            {
                id: 'segundo-pao',
                label: 'Segundo PAO',
                rooms: [
                    { id: 'calculo-vectorial', name: 'Cálculo Vectorial' },
                    { id: 'fisica-1', name: 'Física I' },
                    { id: 'ecuaciones-diferenciales', name: 'Ecuaciones Diferenciales Ordinarias' },
                    { id: 'liderazgo', name: 'Liderazgo' },
                    { id: 'programacion-oo', name: 'Programación Orientada a Objetos' },
                ]
            },
            {
                id: 'tercer-pao',
                label: 'Tercer PAO',
                rooms: [
                    { id: 'estructura-datos', name: 'Estructura de Datos' },
                    { id: 'modelos-discretos', name: 'Modelos Discretos para Ingeniería SO' },
                    { id: 'estadistica', name: 'Estadística' },
                    { id: 'metodos-numericos', name: 'Métodos Numéricos' },
                    { id: 'cultura-ambiental', name: 'Cultura Ambiental' },
                    { id: 'realidad-nacional', name: 'Realidad Nacional y Geopolítica' },
                ]
            },
            {
                id: 'cuarto-pao',
                label: 'Cuarto PAO',
                rooms: [
                    { id: 'computacion-digital', name: 'Computación Digital' },
                    { id: 'programacion-web', name: 'Programación Web' },
                    { id: 'modelos-procesos-software', name: 'Modelos de Procesos de Desarrollo de Software' },
                    { id: 'bases-datos', name: 'Sistemas de Bases de Datos' },
                    { id: 'ingenieria-usabilidad', name: 'Ingeniería de Usabilidad' },
                    { id: 'computacion-paralela', name: 'Computación Paralela' },
                ]
            },
            {
                id: 'quinto-pao',
                label: 'Quinto PAO',
                rooms: [
                    { id: 'bases-datos-avanzado', name: 'Sistemas Avanzados de Bases de Datos' },
                    { id: 'desarrollo-web-avanzado', name: 'Desarrollo Web Avanzado' },
                    { id: 'ingenieria-requisitos', name: 'Ingeniería de Requisitos de Software' },
                    { id: 'computacion-grafica', name: 'Computación Gráfica' },
                    { id: 'investigacion-ingenieria', name: 'Investigación en la Ingeniería de Software' },
                    { id: 'redes-computadores', name: 'Redes de Computadores' },
                ]
            },
            {
                id: 'sexto-pao',
                label: 'Sexto PAO',
                rooms: [
                    { id: 'apps-conocimiento', name: 'Aplicaciones Basadas en el Conocimiento' },
                    { id: 'pruebas-software', name: 'Pruebas de Software' },
                    { id: 'analisis-diseno-software', name: 'Análisis y Diseño de Software' },
                    { id: 'sistemas-operativos', name: 'Sistemas Operativos' },
                    { id: 'lectura-escritura-academica', name: 'Lectura y Escritura de Textos Académicos' },
                    { id: 'apps-moviles', name: 'Desarrollo de Aplicaciones Móviles' },
                ]
            },
            {
                id: 'septimo-pao',
                label: 'Séptimo PAO',
                rooms: [
                    { id: 'aseguramiento-calidad', name: 'Aseguramiento de la Calidad de Software' },
                    { id: 'apps-distribuidas', name: 'Aplicaciones Distribuidas' },
                    { id: 'seguridad-software', name: 'Ingeniería de la Seguridad del Software' },
                    { id: 'desarrollo-videojuegos', name: 'Desarrollo de Video Juegos' },
                    { id: 'software-seguro', name: 'Desarrollo de Software Seguro' },
                ]
            },
            {
                id: 'octavo-pao',
                label: 'Octavo PAO',
                rooms: [
                    { id: 'construccion-software', name: 'Construcción y Evolución del Software' },
                    { id: 'arquitectura-software', name: 'Arquitectura de Software' },
                    { id: 'software-interculturalidad', name: 'Desarrollo de Software e Interculturalidad' },
                    { id: 'gestion-emprendimiento', name: 'Gestión y Emprendimiento' },
                    { id: 'gestion-proyectos', name: 'Gestión de Proyectos de Software' },
                ]
            },
        ]
    },
    profesores: {
        label: 'Profesores',
        emoji: '👨‍🏫',
        rooms: [
            { id: 'prof-carlos-mendoza', name: 'Dr. Carlos Mendoza' },
            { id: 'prof-maria-fernandez', name: 'Ing. María Fernández' },
            { id: 'prof-roberto-jativa', name: 'Dr. Roberto Játiva' },
            { id: 'prof-patricia-salazar', name: 'Ing. Patricia Salazar' },
            { id: 'prof-andres-villarroel', name: 'Dr. Andrés Villarroel' },
            { id: 'prof-claudia-rivadeneira', name: 'Ing. Claudia Rivadeneira' },
            { id: 'prof-felipe-morocho', name: 'Dr. Felipe Morocho' },
            { id: 'prof-gabriela-espinosa', name: 'Ing. Gabriela Espinosa' },
            { id: 'prof-miguel-ortega', name: 'Dr. Miguel Ortega' },
            { id: 'prof-sofia-caicedo', name: 'Ing. Sofía Caicedo' },
            { id: 'prof-juan-perez', name: 'Dr. Juan Pérez' },
            { id: 'prof-laura-castellanos', name: 'Ing. Laura Castellanos' },
            { id: 'prof-eduardo-naranjo', name: 'Dr. Eduardo Naranjo' },
            { id: 'prof-valeria-torres', name: 'Ing. Valeria Torres' },
            { id: 'prof-hugo-chavez', name: 'Dr. Hugo Chávez' },
            { id: 'prof-diana-molina', name: 'Ing. Diana Molina' },
            { id: 'prof-sebastian-aguirre', name: 'Dr. Sebastián Aguirre' },
            { id: 'prof-andrea-suarez', name: 'Ing. Andrea Suárez' },
            { id: 'prof-pablo-vasquez', name: 'Dr. Pablo Vásquez' },
            { id: 'prof-cristina-landazuri', name: 'Ing. Cristina Landázuri' },
        ]
    },
    clubes: {
        label: 'Clubes',
        emoji: '🏆',
        rooms: [
            { id: 'club-robotica', name: 'Club de Robótica ESPE' },
            { id: 'club-programacion', name: 'Club de Programación Competitiva' },
            { id: 'club-ciberseguridad', name: 'Club de Ciberseguridad' },
            { id: 'club-ia', name: 'Club de Inteligencia Artificial' },
            { id: 'club-emprendimiento', name: 'Club de Emprendimiento Tech' },
        ]
    },
    pasatiempos: {
        label: 'Pasatiempos',
        emoji: '🎮',
        rooms: [
            { id: 'gaming', name: 'Gaming y Videojuegos' },
            { id: 'musica', name: 'Música' },
            { id: 'deportes', name: 'Deportes' },
            { id: 'arte-diseno', name: 'Arte y Diseño' },
        ]
    }
};

module.exports = {
    DEFAULT_AVATAR,
    MAX_MESSAGE_LENGTH,
    MAX_AVATAR_SIZE,
    MAX_ROOM_HISTORY,
    SOCKET_EVENTS,
    ROOMS
};