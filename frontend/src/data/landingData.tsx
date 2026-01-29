import React from 'react';
import { GraduationCap, Building2, Code2, Monitor, Laptop, HelpCircle, Calendar, FileText, Search, PlayCircle } from 'lucide-react';

// --- Shared Interfaces ---
export interface FAQItem {
    icon?: React.ReactNode;
    color?: string;
    title: string;
    description: string;
    questions: string[];
    generalResponse: React.ReactNode;
    images?: string[];
    video?: string;
    id?: string;
    label?: string;
}

export interface ProgramOption {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    faqs: FAQItem[];
    loginRole: string;
    isOnline: boolean;
}

// --- Colors ---
export const COLORS = {
    orange: '#F06427', // Pantone 172 U
    orangeLight: '#F06427', // Using main orange for consistency or lighter if needed
    orangeDark: '#B83A00',
    black: '#000000', // Pure black
    white: '#FFFFFF',
    gray: '#F2F4F7',
    grayDark: '#475467',
    grayMedium: '#667085',
    blueUAH: '#003366'
};

// --- DATA FROM ORIGINAL PAGE ---

// FAQs para Plan Común
const faqPlanComun: FAQItem[] = [
    {
        color: COLORS.orange,
        title: 'Información General',
        description: 'Sobre el Plan Común de Ingeniería.',
        questions: [
            '¿Qué es el Plan Común de Ingeniería?',
            '¿Cuántos semestres dura el Plan Común?',
            '¿Cuándo elijo mi especialidad?'
        ],
        generalResponse: (
            <div>
                <p>El <strong>Plan Común</strong> es el ciclo inicial de todas las ingenierías civiles de la UAH.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Duración: </strong> 4 semestres (2 años).</li>
                    <li><strong>Especialidad: </strong> A partir del 5to semestre puedes elegir Industrial o Informática.</li>
                    <li><strong>Requisito: </strong> Todos los estudianes que lleguen al quinto semestre pasan a la especialidad.</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Pre Requisitos',
        description: 'Árbol de asignaturas Plan Común.',
        questions: [
            '¿Qué ramo abre cuál en Plan Común?',
            '¿Qué pasa si repruebo un ramo de primer año?'
        ],
        generalResponse: (
            <div>
                <p>El Plan Común tiene una estructura encadenada. Es vital aprobar los ramos de ciencias básicas para avanzar.</p>
                <p>Revisa el diagrama de prerrequisitos:</p>
            </div>
        ),
        images: [
            '/images/faq/PrerequisitoIndustrial.jpeg',
            '/images/faq/PrerequisitoInformatica.jpeg'
        ]
    },
    {
        color: COLORS.orange,
        title: 'Conducencia',
        description: 'Paso de Plan Común a Especialidad.',
        questions: [
            '¿Cuándo elijo Industrial o Informática?',
            '¿Es automático el paso a especialidad?',
            '¿Me falta un ramo, puedo tomar especialidad?'
        ],
        generalResponse: (
            <div>
                <p>Es el proceso formal al finalizar Plan Común. <strong>Lo gestiona Dirección deadmision@uahurtado.cl</strong>, no la coordinación.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Requisito: </strong> Haber aprobado 100% las asignaturas de Plan Común.</li>
                    <li><strong>Cuándo: </strong> A partir del 4to semestre.</li>
                    <li><strong>Nota: </strong> No se pueden inscribir ramos de especialidad si debes ramos de los primeros dos años.</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Matrículas',
        description: 'Proceso de matrícula.',
        questions: [
            '¿Dónde saco certificado de alumno regular?',
            'No puedo tomar ramos (error sistema).',
            'Quiero congelar semestre.',
            '¿Cómo renuncio a la carrera?'
        ],
        generalResponse: (
            <div>
                <p><strong>Mesa Central: </strong> +56 2 2692 0200</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Certificados: </strong> Portal Estudiantes (Autoservicio).</li>
                    <li><strong>Problemas Clave: </strong> informatica@uahurtado.cl (Indica RUT).</li>
                    <li><strong>Matrícula Alumnos Antiguos: </strong> Portal Estudiantes.</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Becas y Beneficios',
        description: 'Información sobre financiamiento.',
        questions: [
            '¿Qué becas ofrece la UAH?',
            '¿Cómo sé si me renovaron la Gratuidad?',
            '¿Dónde firmo el contrato del CAE?'
        ],
        generalResponse: (
            <div>
                <p>Temas de financiamiento estatal y ayudas internas: <strong>Unidad de Bienestar Estudiantil</strong>.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Ubicación: </strong> Sala DAE (Primer piso, frente al casino, Almte. Barroso #10).</li>
                    <li><strong>Horario: </strong> Lunes a viernes 9:00-13:30 y 15:00-18:00.</li>
                    <li><strong>Correo: </strong> beneficiosdae@uahurtado.cl</li>
                </ul>
            </div>
        ),
        video: '/videos/DireccionDaePresencial.mp4'
    },
    {
        color: COLORS.orange,
        title: 'TNE',
        description: 'Tarjeta Nacional Estudiantil.',
        questions: [
            '¿Dónde me saco la foto para el pase nuevo?',
            'Se me perdió la TNE, ¿cómo pido reposición?',
            '¿Cuándo pegan el sello de revalidación?'
        ],
        generalResponse: (
            <div>
                <p>Todo lo relacionado con tu pase escolar lo gestiona la <strong>Dirección de Asuntos Estudiantiles (DAE)</strong>.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Retiro: </strong> Revisa tu correo UAH.</li>
                    <li><strong>Correo: </strong> beneficiosdae@uahurtado.cl</li>
                    <li><strong>Dudas Junaeb: </strong> <a href="https://www.junaeb.cl/tarjeta-tne/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>Junaeb TNE</a></li>
                </ul>
            </div>
        ),
        video: '/videos/DireccionDaePresencial.mp4'
    },
    {
        color: COLORS.orange,
        title: 'Justificativos',
        description: 'Inasistencias y justificaciones académicas.',
        questions: [
            'Falté a prueba por enfermedad, ¿qué hago?',
            '¿Cuál es el plazo para subir un justificativo?',
            '¿Qué documentos necesito para justificar?',
            'No puedo acceder al formulario de justificación.',
            '¿Cómo sé si mi justificativo fue aprobado?',
            '¿Puedo justificar más de una evaluación?'
        ],
        generalResponse: (
            <div>
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ fontWeight: '700', color: '#c2410c', marginBottom: '8px', fontSize: '15px' }}>PLAZO IMPORTANTE</p>
                    <p style={{ color: '#ea580c', margin: 0 }}>Tienes <strong>5 días hábiles</strong> desde la fecha de la evaluación para subir tu justificativo. Después de este plazo, no se aceptan solicitudes.</p>
                </div>

                <h4 style={{ color: '#1a1a1a', marginBottom: '12px', fontSize: '16px' }}>Paso a paso para justificar:</h4>
                <ol style={{ paddingLeft: '20px', marginBottom: '20px', lineHeight: '1.8' }}>
                    <li><strong>Reúne tu documentación: </strong> Certificado médico o documento oficial que indique diagnóstico, fecha y período de reposo.</li>
                    <li><strong>Accede al formulario</strong> usando SOLO tu correo institucional (@uahurtado.cl).</li>
                    <li><strong>Completa todos los campos: </strong> Nombre, RUT, carrera, asignatura afectada, fecha de la evaluación.</li>
                    <li><strong>Adjunta el documento</strong> en formato PDF o imagen legible.</li>
                    <li><strong>Envía y guarda el comprobante</strong> que te llegará al correo.</li>
                </ol>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ fontWeight: '700', color: '#0369a1', marginBottom: '8px' }}>Documentos válidos:</p>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#0c4a6e' }}>
                        <li>Licencia médica emitida por profesional de salud</li>
                        <li>Certificado de atención en urgencias</li>
                        <li>Comprobante de hospitalización</li>
                        <li>Certificado de defunción (en caso de duelo familiar)</li>
                        <li>Citación judicial o documento oficial del Estado</li>
                    </ul>
                </div>

                <p style={{ marginBottom: '16px' }}>
                    <a href="https://forms.office.com/pages/responsepage.aspx?id=hqNJ4BwNMkazHcYnyM0H6Q4ha3C2koBDoytHaWO0GJ5UMzJSQ1FBOEM4UzNaNzVUM1hNQ1JUMFQ0Ty4u&route=shorturl"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-block',
                            background: '#F06427',
                            color: 'white',
                            padding: '14px 24px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '15px'
                        }}>
                        Ir al Formulario de Justificación
                    </a>
                </p>
            </div>
        )
    }
];

// FAQs para Ingeniería Civil Industrial
const faqIndustrial: FAQItem[] = [
    {
        color: COLORS.orange,
        title: 'Malla Curricular',
        description: 'Plan de estudios Industrial.',
        questions: [
            '¿Cuántos semestres dura la carrera?',
            '¿Dónde veo la malla completa?',
            '¿Qué ramos me tocan el próximo semestre?'
        ],
        generalResponse: (
            <div>
                <p>Ingeniería Civil Industrial tiene una duración de <strong>10 semestres</strong> (5 años).</p>
                <p>Consulta con la coordinación para orientación personalizada sobre tu avance curricular.</p>
            </div>
        ),
        images: ['/images/mallas/MallaIndustrial.jpeg']
    },
    {
        color: COLORS.orange,
        title: 'Pre Requisitos',
        description: 'Árbol de asignaturas.',
        questions: [
            '¿Qué ramo abre cuál?',
            'Plan Visual de Prerrequisitos.'
        ],
        generalResponse: (
            <div>
                <p>Los pre-requisitos son las "llaves de acceso". Revisa visualmente las conexiones:</p>
            </div>
        ),
        images: ['/images/faq/PrerequisitoIndustrial.jpeg']
    },
    {
        color: COLORS.orange,
        title: 'Prácticas Profesionales',
        description: 'Requisitos y proceso.',
        questions: [
            '¿Cuándo puedo hacer la práctica?',
            '¿Cuántas horas debe durar?',
            '¿Dónde entrego el informe?'
        ],
        generalResponse: (
            <div>
                <p>Las prácticas profesionales son un requisito para titularse.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Práctica I: </strong> A partir del 6to semestre.</li>
                    <li><strong>Práctica II: </strong> A partir del 8vo semestre.</li>
                    <li><strong>Consultas: </strong> Coordinación de carrera.</li>
                </ul>
            </div>
        )
    },
    ...faqPlanComun.slice(3)
];

// FAQs para Ingeniería Civil en Informática
const faqInformatica: FAQItem[] = [
    {
        color: COLORS.orange,
        title: 'Malla Curricular',
        description: 'Plan de estudios Informática.',
        questions: [
            '¿Cuántos semestres dura la carrera?',
            '¿Dónde veo la malla completa?',
            '¿Qué ramos me tocan el próximo semestre?'
        ],
        generalResponse: (
            <div>
                <p>Ingeniería Civil en Informática tiene una duración de <strong>10 semestres</strong> (5 años).</p>
                <p>Consulta con la coordinación para orientación personalizada.</p>
            </div>
        ),
        images: ['/images/mallas/MallaInformatica.jpeg']
    },
    {
        color: COLORS.orange,
        title: 'Pre Requisitos',
        description: 'Árbol de asignaturas.',
        questions: [
            '¿Qué ramo abre cuál?',
            'Plan Visual de Prerrequisitos.'
        ],
        generalResponse: (
            <div>
                <p>Los pre-requisitos son las "llaves de acceso". Revisa el diagrama:</p>
            </div>
        ),
        images: ['/images/faq/PrerequisitoInformatica.jpeg']
    },
    {
        color: COLORS.orange,
        title: 'Laboratorios y Herramientas',
        description: 'Recursos tecnológicos.',
        questions: [
            '¿Qué software necesito?',
            '¿Hay licencias gratuitas?',
            '¿Dónde están los laboratorios?'
        ],
        generalResponse: (
            <div>
                <p>La facultad cuenta con espacios dedicados al desarrollo tecnológico e innovación:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Desarrollo Tecnológico (2do piso): </strong> Espacio equipado para el desarrollo tecnológico de alto nivel.</li>
                    <li><strong>HackerLab (1er piso): </strong> Laboratorio diseñado para desarrollar ideas que cambien o traigan soluciones a la sociedad.</li>
                </ul>
                <p style={{ marginTop: '8px' }}>Ambos espacios están totalmente equipados tanto para trabajar como para investigar.</p>
            </div>
        )
    },
    ...faqPlanComun.slice(3)
];

// FAQs para Industrial Online
const faqIndustrialOnline: FAQItem[] = [
    {
        color: COLORS.orange,
        title: 'Credenciales de Acceso',
        description: 'Acceso a plataformas virtuales.',
        questions: [
            '¿Dónde encuentro mi correo institucional?',
            '¿Cómo ingreso al aula virtual?',
            'No me ha llegado el correo con mis accesos.'
        ],
        generalResponse: (
            <div>
                <p>Tus credenciales de acceso se generan automáticamente al finalizar tu matrícula.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Ubicación: </strong> Revisa el "Correo de Confirmación de Matrícula".</li>
                    <li><strong>Soporte: </strong> informatica@uahurtado.cl</li>
                    <li><strong>Link de Acceso: </strong> <a href="https://campusvirtual.uahurtado.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>campusvirtual.uahurtado.cl</a></li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'CAE',
        description: 'Crédito con Aval del Estado.',
        questions: [
            '¿El programa online acepta CAE?',
            '¿Cómo renuevo el crédito?',
            'Ya tengo CAE de otra carrera.'
        ],
        generalResponse: (
            <div>
                <p>Sí, el programa permite financiamiento vía CAE si cumples con los requisitos.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Cobertura: </strong> El CAE cubre hasta el Arancel de Referencia.</li>
                    <li><strong>Portal: </strong> <a href="https://portal.ingresa.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>portal.ingresa.cl</a></li>
                    <li><strong>Dudas UAH: </strong> beneficiosdae@uahurtado.cl</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Pagos y Finanzas',
        description: 'Aranceles y mensualidades.',
        questions: [
            '¿Cuáles son las formas de pago?',
            '¿Cómo regularizo una deuda?',
            'Necesito pagar la cuota del mes.'
        ],
        generalResponse: (
            <div>
                <p>Todos los pagos se realizan de forma digital:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Pago Rápido: </strong> <a href="https://estudiantes.uahurtado.cl/pagocuotas/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>estudiantes.uahurtado.cl/pagocuotas/</a></li>
                    <li><strong>Contacto: </strong> serviciosfinancieros@uahurtado.cl</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Matrículas',
        description: 'Inscripción y gestión académica.',
        questions: [
            '¿Cómo me matriculo para el próximo semestre?',
            'Necesito un certificado.',
            'Quiero suspender o renunciar.'
        ],
        generalResponse: (
            <div>
                <p>Si tienes dudas sobre tu proceso de matrícula:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Mesa Central: </strong> +56 2 2692 0200</li>
                    <li><strong>Plataforma: </strong> U-Campus</li>
                    <li><strong>Suspensión: </strong> Contactar coordinadora rradziev@uahurtado.cl</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'TNE',
        description: 'Tarjeta Nacional Estudiantil.',
        questions: [
            '¿Puedo tener TNE si estudio online?',
            '¿Cómo obtengo mi tarjeta siendo de región?'
        ],
        generalResponse: (
            <div>
                <p>Sí, puedes optar a la TNE como alumno regular de pregrado.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Proceso: </strong> Junaeb te inscribe automáticamente.</li>
                    <li><strong>Link: </strong> <a href="https://www.tne.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>tne.cl</a></li>
                    <li><strong>Contacto UAH: </strong> tnecredencialuah@uahurtado.cl</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Competencias Habilitantes',
        description: 'Evaluaciones diagnóstico.',
        questions: [
            '¿Cuándo debo rendir la evaluación?',
            'No me llegó el link para la prueba.',
            'Tengo problemas para ingresar.'
        ],
        generalResponse: (
            <div>
                <p><strong>Nota Importante: </strong> Requisito institucional. Si no las realizas, no podrás inscribir ramos.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Correo: </strong> competencias@uahurtado.cl</li>
                    <li><strong>WhatsApp: </strong> +56 9 75184541 (Días de rendición)</li>
                </ul>
            </div>
        )
    }
];

// FAQs para Programa Continuidad TNS
const faqContinuidadTNS: FAQItem[] = [
    {
        color: COLORS.orange,
        title: 'Requisitos de Ingreso',
        description: 'Condiciones para el programa.',
        questions: [
            '¿Qué título técnico necesito?',
            '¿Se convalidan ramos?',
            '¿Cuánto dura el programa?'
        ],
        generalResponse: (
            <div>
                <p>El programa de Continuidad está diseñado para <strong>Técnicos de Nivel Superior</strong>.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Requisito: </strong> Título TNS en área afín.</li>
                    <li><strong>Convalidación: </strong> Se evalúa caso a caso según malla de origen.</li>
                    <li><strong>Duración: </strong> Variable según convalidaciones aprobadas.</li>
                </ul>
            </div>
        )
    },
    {
        color: COLORS.orange,
        title: 'Proceso de Convalidación',
        description: 'Reconocimiento de estudios previos.',
        questions: [
            '¿Cómo solicito convalidación?',
            '¿Qué documentos necesito?',
            '¿Cuánto demora el proceso?'
        ],
        generalResponse: (
            <div>
                <p>La convalidación se realiza durante el proceso de admisión:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Documentos: </strong> Certificado de título, concentración de notas, programas de asignaturas.</li>
                    <li><strong>Evaluación: </strong> Comité académico de la facultad.</li>
                    <li><strong>Consultas: </strong> admision@uahurtado.cl</li>
                </ul>
            </div>
        )
    },
    ...faqIndustrialOnline.slice(1)
];


// --- REMOTE MODALITY DATA ---
export const REMOTE_CATEGORIES: FAQItem[] = [
    {
        id: 'tne',
        label: '1. TNE (TARJETA NACIONAL ESTUDIANTIL)',
        title: 'TNE (Tarjeta Nacional Estudiantil)',
        description: 'Pase escolar para modalidad online.',
        icon: <GraduationCap size={48} />,
        questions: [
            'Estudio online, ¿puedo tener pase escolar (TNE)?',
            'Soy de región, ¿cómo obtengo mi tarjeta si no voy a Santiago?',
            '¿Qué requisitos debo cumplir para tener la TNE?'
        ],
        generalResponse: (
            <div>
                <p>Sí, puedes optar a la TNE. Al ser alumno regular de un programa de pregrado, tienes derecho al beneficio del pase escolar.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Proceso: </strong> La universidad te inscribe en el sistema Junaeb. Debes asegurarte de pagar la cuota de la tarjeta (si corresponde) y tomarte la fotografía en los capturadores online de Junaeb.</li>
                    <li><strong>Link Oficial Junaeb: </strong> Para ver el estado de tu pase o buscar puntos de captura fotográfica, ingresa a <a href="https://www.tne.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>https://www.tne.cl/</a>.</li>
                    <li><strong>Retiro / Envío: </strong> Una vez que la tarjeta física llegue a la universidad (en Santiago), debes contactar a la DAE para coordinar el retiro o consultar opciones de envío a oficinas regionales.</li>
                    <li><strong>Contacto UAH: </strong> tnecredencialuah@uahurtado.cl.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'credenciales',
        label: '2. CREDENCIALES (ACCESO A PLATAFORMAS)',
        title: 'Credenciales de Acceso',
        description: 'Acceso corporativo y Aula Virtual.',
        icon: <Monitor size={48} />,
        questions: [
            '¿Dónde encuentro mi correo institucional y clave para entrar al aula virtual?',
            'No me ha llegado el correo con mis accesos al aula virtual.',
            '¿Cómo ingreso al aula virtual?'
        ],
        generalResponse: (
            <div>
                <p>Tus credenciales de acceso se generan automáticamente al finalizar tu matrícula.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Ubicación: </strong> Revisa el "Correo de Confirmación de Matrícula" que se envió a tu email personal. Allí vienen tus datos de ingreso iniciales.</li>
                    <li><strong>Soporte: </strong> En caso de que la clave sea incorrecta o no encuentres el correo (revisa Spam), contacta a Soporte TI: informatica@uahurtado.cl.</li>
                    <li><strong>Link de Acceso: </strong> <a href="https://campusvirtual.uahurtado.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>https://campusvirtual.uahurtado.cl/</a></li>
                </ul>
            </div>
        )
    },
    {
        id: 'cae',
        label: '3. CAE (CRÉDITO CON AVAL DEL ESTADO)',
        title: 'CAE (Crédito con Aval del Estado)',
        description: 'Financiamiento del arancel.',
        icon: <FileText size={48} />,
        questions: [
            '¿El programa de Ingeniería Industrial Online acepta CAE?',
            'Ya tengo el CAE de una carrera anterior, ¿puedo usarlo aquí?',
            '¿Cómo renuevo el crédito si soy estudiante online?'
        ],
        generalResponse: (
            <div>
                <p>Sí, el programa permite financiamiento vía CAE si cumples con los requisitos de renovación o postulación en Ingresa.cl.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Cobertura: </strong> Recuerda que el CAE cubre hasta el Arancel de Referencia, y la diferencia con el arancel real debes cubrirla tú.</li>
                    <li><strong>Portal Oficial (Postulación y Renovación): </strong> <a href="https://portal.ingresa.cl/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>https://portal.ingresa.cl/</a>.</li>
                    <li><strong>Dudas UAH: </strong> Para confirmar montos y procesos internos, escribe a beneficiosdae@uahurtado.cl.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'finanzas',
        label: '4. PAGOS DE ARANCELES Y FINANZAS',
        title: 'Pagos y Finanzas',
        description: 'Regularización y formas de pago.',
        icon: <FileText size={48} />,
        questions: [
            '¿Cuáles son las formas de pago aceptadas?',
            'Necesito pagar la matrícula o cuota del mes.',
            '¿Cómo regularizo una deuda o pago atrasado?'
        ],
        generalResponse: (
            <div>
                <p>Todos los pagos se realizan de forma digital a través de los canales oficiales.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Enlace de Pago Rápido: </strong> <a href="https://estudiantes.uahurtado.cl/pagocuotas/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>estudiantes.uahurtado.cl/pagocuotas/</a> (Ingresa solo con tu RUT).</li>
                    <li><strong>Instructivos Oficiales (PDF): </strong>
                        <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '4px' }}>
                            <li>Canales de Pago Detallados: Ver PDF Instructivo.</li>
                            <li>Formas de Pago Actualizadas: Ver PDF 2024.</li>
                        </ul>
                    </li>
                    <li><strong>Más Información: </strong> Para detalles completos visita el <a href="https://www.uahurtado.cl/estudiantes/servicios-financieros-estudiantes/" target="_blank" rel="noreferrer" style={{ color: COLORS.orange, textDecoration: 'underline' }}>Sitio Web Servicios Financieros</a>.</li>
                    <li><strong>Contacto: </strong> serviciosfinancieros@uahurtado.cl.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'gestion',
        label: '5. MATRÍCULAS Y GESTIÓN ACADÉMICA',
        title: 'Matrículas y Gestión',
        description: 'Inscripción, certificados y gestión.',
        icon: <Calendar size={48} />,
        questions: [
            '¿Cómo me matriculo para el próximo semestre?',
            'Necesito un certificado.',
            '¿Dónde inscribo mis ramos?',
            'Quiero suspender o renunciar.'
        ],
        generalResponse: (
            <div>
                <p>Si tienes dudas sobre tu proceso de matrícula, ya seas estudiante nuevo o antiguo, aquí tienes los canales oficiales: </p>
                <h4 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>Matrículas: Contactos Clave</h4>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>Mesa Central (General): </strong> +56 2 2692 0200.</li>
                    <li><strong>Alumnos Nuevos (Admisión): </strong>
                        <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                            <li>Call Center: +56 2 2692 0221 (08:00 a 20:00 hrs).</li>
                            <li>WhatsApp: +56 9 2382 5490 / +56 9 2381 8810.</li>
                            <li>Correo: matriculaestudiantesnuevos@uahurtado.cl.</li>
                        </ul>
                    </li>
                    <li><strong>Alumnos Antiguos (Renovación): </strong> Portal "Estudiantes" en www.uahurtado.cl. Problemas de acceso: informatica@uahurtado.cl.</li>
                </ul>

                <h4 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>Certificados y Ramos:</h4>
                <ul style={{ paddingLeft: '20px' }}>
                    <li><strong>Plataforma: </strong> Inscripción de ramos y certificados en U-Campus.</li>
                </ul>

                <h4 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>Proceso de Suspensión o Renuncia:</h4>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>Suspensión: </strong> Contactar a coordinadora Giannina Radzievski (rradziev@uahurtado.cl).</li>
                    <li><strong>Renuncia: </strong> Contactar a Servicios Financieros (serviciosfinancieros@uahurtado.cl) para regularizar situación antes de formalizar.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'competencias',
        label: '6. EVALUACIONES DE COMPETENCIAS HABILITANTES',
        title: 'Competencias Habilitantes',
        description: 'Requisito Institucional de diagnóstico.',
        icon: <Monitor size={48} />,
        questions: [
            '¿Cuándo debo rendir la evaluación de competencias (diagnóstico)?',
            'No me llegó el link para la prueba habilitante.',
            'Tengo problemas para ingresar a la evaluación o se me cayó la conexión.'
        ],
        generalResponse: (
            <div>
                <p><strong>Nota Importante: </strong> Las Evaluaciones de Competencias son un Requisito Institucional. Si no las realizas, no podrás inscribir ramos.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Correo Oficial: </strong> competencias@uahurtado.cl.</li>
                    <li><strong>WhatsApp de Soporte: </strong> +56 9 75184541. (Días de rendición, de 10:00 a 18:00 hrs).</li>
                </ul>
            </div>
        )
    },
    {
        id: 'malla',
        label: '7. MALLA CURRICULAR (PLAN DE ESTUDIOS)',
        title: 'Malla Curricular',
        description: 'Mapa de la carrera.',
        icon: <GraduationCap size={48} />,
        questions: [
            '¿Qué ramos me toca tomar el próximo ciclo?',
            '¿Dónde puedo ver el mapa completo de la carrera?',
            '¿Cuántos semestres me faltan para terminar?'
        ],
        generalResponse: (
            <div>
                <p>Tu Malla Curricular es tu mapa de ruta. Es fundamental que la tengas siempre a mano.</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Plan de Estudios: </strong> El programa tiene una estructura secuencial.</li>
                    <li><strong>Descarga Oficial: </strong> Ver Malla Online (PDF).</li>
                </ul>
            </div>
        ),
        images: ['/images/mallas/MallaRemota.jpeg']
    },
    {
        id: 'comunicacion',
        label: '8. COMUNICACIÓN',
        title: 'Comunicación',
        description: 'Canales oficiales y contacto.',
        icon: <HelpCircle size={48} />,
        questions: [
            '¿Cómo me comunico con mis profesores o compañeros?',
            '¿Dónde recibo la información importante de la carrera?'
        ],
        generalResponse: (
            <div>
                <p>La comunicación oficial se realiza a través de dos canales principales: </p>
                <ol style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Foro del Campus Virtual UAH: </strong> Espacio para consultas académicas directas.</li>
                    <li><strong>Correo Institucional: </strong> Canal formal. Información oficial, plazos y beneficios llegan aquí.</li>
                </ol>
            </div>
        )
    }
];

// --- All Programs Data ---
export const ALL_PROGRAMS: ProgramOption[] = [
    {
        id: 'plan-comun',
        name: 'Ingeniería Civil Plan Común',
        subtitle: 'Ciclo Básico',
        description: 'Ciclo fundamental de 4 semestres para bases sólidas en ingeniería.',
        icon: <GraduationCap size={28} />,
        faqs: faqPlanComun,
        loginRole: 'estudiante',
        isOnline: false
    },
    {
        id: 'industrial',
        name: 'Ingeniería Civil Industrial',
        subtitle: 'Especialidad',
        description: 'Optimización de procesos y gestión estratégica.',
        icon: <Building2 size={28} />,
        faqs: faqIndustrial,
        loginRole: 'estudiante',
        isOnline: false
    },
    {
        id: 'informatica',
        name: 'Ingeniería Civil en Informática',
        subtitle: 'Especialidad',
        description: 'Diseño de software y transformación digital.',
        icon: <Code2 size={28} />,
        faqs: faqInformatica,
        loginRole: 'estudiante',
        isOnline: false
    },
    {
        id: 'industrial-online',
        name: 'Ing. Civil Industrial',
        subtitle: '100% Online',
        description: 'Flexibilidad laboral-académica con excelencia UAH.',
        icon: <Monitor size={28} />,
        faqs: faqIndustrialOnline,
        loginRole: 'estudiante-remoto',
        isOnline: true
    },
    {
        id: 'continuidad-tns',
        name: 'Programa Continuidad TNS',
        subtitle: 'Industrial e Informática',
        description: 'Prosecución de estudios para Técnicos Nivel Superior.',
        icon: <Laptop size={28} />,
        faqs: faqContinuidadTNS,
        loginRole: 'estudiante-remoto',
        isOnline: true
    }
];
