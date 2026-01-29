import React from 'react';

export interface FAQItem {
    icon: string;
    color: string;
    title: string;
    description: string;
    questions: string[];
    generalResponse: React.ReactNode;
    images?: string[];
    video?: string;
}

export const faqItemsPresencial: FAQItem[] = [
    {
        icon: '',
        color: '#3b82f6', // Azul
        title: 'Gratuidad',
        description: 'Información sobre beneficios.',
        questions: [
            '¿Cómo sé si me renovaron la Gratuidad?',
            'Tengo dudas con los resultados del FUAS.',
            'No me cargaron la BAES este mes.',
            'Necesito hablar con una asistente social urgente.'
        ],
        generalResponse: (
            <div>
                <p>Temas de financiamiento estatal y ayudas internas: <strong>Unidad de Bienestar Estudiantil</strong>.</p>
                <ul>
                    <li><strong>Ubicación:</strong> Sala DAE (Primer piso, frente al casino, Almte. Barroso #10).</li>
                    <li><strong>Horario:</strong> Lunes a viernes 9:00-13:30 y 15:00-18:00.</li>
                    <li><strong>Correo:</strong> beneficiosdae@uahurtado.cl</li>
                </ul>
            </div>
        ),
        video: '/videos/DireccionDaePresencial.mp4'
    },
    {
        icon: '',
        color: '#ec4899', // Rosa
        title: 'TNE',
        description: 'Tarjeta Nacional Estudiantil.',
        questions: [
            '¿Dónde me saco la foto para el pase nuevo?',
            'Se me perdió la TNE, ¿cómo pido la reposición?',
            '¿Cuándo pegan el sello de revalidación de este año?',
            '¿Qué hago si mi pase está roto o deteriorado?',
            '¿Dónde retiro mi TNE si soy de primer año?'
        ],
        generalResponse: (
            <div>
                <p>Todo lo relacionado con tu pase escolar lo gestiona la <strong>Dirección de Asuntos Estudiantiles (DAE)</strong>.</p>
                <ul>
                    <li><strong>Retiro:</strong> Revisa tu correo UAH, avisarán cuándo y dónde retirar (generalmente Casa Estudiantil).</li>
                    <li><strong>Correo:</strong> beneficiosdae@uahurtado.cl</li>
                    <li><strong>Dudas Junaeb:</strong> <a href="https://www.junaeb.cl/tarjeta-tne/" target="_blank" rel="noreferrer">Junaeb TNE</a></li>
                </ul>
            </div>
        ),
        video: '/videos/DireccionDaePresencial.mp4'
    },
    {
        icon: '',
        color: '#8b5cf6', // Morado
        title: 'Becas',
        description: 'Becas internas y externas.',
        questions: [
            '¿Qué becas ofrece la UAH y requisitos?',
            '¿Los beneficios cubren toda la carrera si me atraso?',
            'Tengo Gratuidad, ¿puedo sumar beca interna?',
            '¿A qué beneficios de mantención postulo?'
        ],
        generalResponse: (
            <div>
                <p>Las becas de arancel son incompatibles entre sí y con becas estatales de arancel (solo cubren la diferencia si aplica).</p>
                <p>Postulaciones y consultas en <a href="https://www.uahurtado.cl/estudiantes/direccion-de-asuntos-estudiantilesdae/bienestar-estudiantil/" target="_blank" rel="noreferrer">Web Bienestar Estudiantil</a>.</p>
            </div>
        )
    },
    {
        icon: '',
        color: '#10b981', // Verde
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
                <p><strong>Mesa Central:</strong> +56 2 2692 0200</p>
                <ul>
                    <li><strong>Certificados:</strong> Portal Estudiantes (Autoservicio).</li>
                    <li><strong>Problemas Clave:</strong> informatica@uahurtado.cl (Indica RUT).</li>
                    <li><strong>Matrícula Alumnos Antiguos:</strong> Portal Estudiantes.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#f59e0b', // Amarillo/Naranja
        title: 'CAE',
        description: 'Crédito con Aval del Estado.',
        questions: [
            '¿Dónde firmo el contrato del CAE?',
            'Quiero pedir un monto menor, ¿cómo lo bajo?',
            '¿Fecha tope para renovar el crédito?',
            'Dudas sobre deuda o copago.'
        ],
        generalResponse: (
            <div>
                <p>Toda la gestión del CAE es externa y regulada por Comisión Ingresa.</p>
                <p>Ingresa a <a href="https://www.ingresa.cl" target="_blank" rel="noreferrer">www.ingresa.cl</a> para ver tu estado y trámites.</p>
            </div>
        )
    },
    {
        icon: '',
        color: '#6366f1', // Indigo
        title: 'Horarios',
        description: 'Consultas de horario modalidad remota.',
        questions: [
            'No encuentro mi sala.',
            '¿Dónde descargo reglamento de conducta?',
            '¿Talleres deportivos disponibles?',
            'Necesito orientación general.'
        ],
        generalResponse: (
            <div>
                <p>La información oficial sobre reglas y fechas está en la web UAH - Sección Estudiantes.</p>
                <ul>
                    <li><strong>Calendario Académico:</strong> Fechas fatales para renuncias/suspensión.</li>
                    <li><strong>Reglamentos:</strong> Asistencia, notas mínimas, eliminación.</li>
                    <li><strong>Orientación Física:</strong> DAE (Casa Estudiantil) o Mesa de Ayuda.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#3b82f6',
        title: 'Credencial universitaria UAH',
        description: 'Tarjeta Universitaria.',
        questions: [
            'Se me perdió la credencial, ¿dónde pido otra?',
            'No me funciona para entrar a la biblioteca.',
            'Soy estudiante nuevo, ¿dónde la retiro?',
            'Me robaron la billetera, ¿debo bloquearla?'
        ],
        generalResponse: (
            <div>
                <p>La emisión y problemas con tu TUI los ve <strong>Servicios Tecnológicos / DAE</strong>.</p>
                <ul>
                    <li><strong>Ubicación:</strong> Casa Estudiantil.</li>
                    <li><strong>Correo:</strong> tnecredencialuah@uahurtado.cl</li>
                    <li><strong>Más info:</strong> <a href="https://estudiantes.uahurtado.cl/credencialuniversitaria" target="_blank" rel="noreferrer">Portal Credencial</a></li>
                </ul>
            </div>
        ),
        video: '/videos/DireccionDaePresencial.mp4'
    },
    {
        icon: '',
        color: '#ec4899',
        title: 'Beneficios',
        description: 'Ayudas complementarias y bienestar.',
        questions: [
            '¿Qué tipo de beneficios ofrece la UAH?',
            '¿Opeinen hay por buen rendimiento PAES?'
        ],
        generalResponse: (
            <div>
                <p>Existen beneficios de alimentación, fotocopias y conectividad según evaluación socioeconómica.</p>
                <p>Revisa detalles en <a href="https://www.uahurtado.cl/estudiantes/direccion-de-asuntos-estudiantiles-dae/bienestar-estudiantil/" target="_blank" rel="noreferrer">Sitio DAE</a>.</p>
            </div>
        )
    },
    {
        icon: '',
        color: '#8b5cf6',
        title: 'Conducencia',
        description: 'Paso de Plan Común a Especialidad.',
        questions: [
            '¿Cuándo elijo Industrial o Informática?',
            '¿Es automático?',
            '¿Me falta un ramo, puedo tomar especialidad?'
        ],
        generalResponse: (
            <div>
                <p>Es el proceso formal al finalizar Plan Común. <strong>Lo gestiona Dirección de Admisión (admision@uahurtado.cl)</strong>, no la coordinación.</p>
                <ul>
                    <li><strong>Requisito:</strong> Haber aprobado 100% las asignaturas de Plan Común.</li>
                    <li><strong>Cuándo:</strong> A partir del 4to semestre.</li>
                    <li><strong>Nota:</strong> No se pueden inscribir ramos de especialidad si debes ramos de los primeros dos años.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#10b981',
        title: 'Pre Requisitos',
        description: 'Árbol de asignaturas.',
        questions: [
            '¿Qué ramo abre cuál?',
            'Plan Visual de Prerrequisitos.'
        ],
        generalResponse: (
            <div>
                <p>Los pre-requisitos son las "llaves de acceso". Revisa visualmente las conexiones en los siguientes diagramas:</p>
                <p><em>(Pincha las imágenes abajo para ampliar)</em></p>
            </div>
        ),
        images: [
            '/images/faq/PrerequisitoIndustrial.jpeg',
            '/images/faq/PrerequisitoInformatica.jpeg'
        ]
    },
    {
        icon: '',
        color: '#f59e0b',
        title: 'Malla Curricular',
        description: 'Programas de Ingeniería.',
        questions: [
            'Ver malla Industrial (Diurno).',
            'Ver malla Informática (Diurno).'
        ],
        generalResponse: (
            <div>
                <p>Programas regulares diurnos (5 años):</p>
                <ul>
                    <li><strong>Ingeniería Civil Industrial:</strong> <a href="https://www.uahurtado.cl/carreras/ingenieria-civil-industrial/" target="_blank" rel="noreferrer">Ver Malla</a></li>
                    <li><strong>Ingeniería Civil en Informática:</strong> <a href="https://www.uahurtado.cl/carreras/ingenieria-civil-informatica/" target="_blank" rel="noreferrer">Ver Malla</a></li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#6366f1',
        title: 'Justificativos',
        description: 'Inasistencias por enfermedad.',
        questions: [
            'Falté a prueba por enfermedad.',
            'No me deja entrar al formulario.',
            'Plazo para subir justificativo.'
        ],
        generalResponse: (
            <div>
                <p>Debes completar el <strong>Formulario Único de Justificación</strong>:</p>
                <p style={{ margin: '12px 0' }}><a href="https://forms.office.com/pages/responsepage.aspx?id=hqNJ4BwNMkazHcYnyM0H6Q4ha3C2koBDoytHaWO0GJ5UMzJSQ1FBOEM4UzNaNzVUM1hNQ1JUMFQ0Ty4u&route=shorturl" target="_blank" rel="noreferrer" style={{ color: '#1a73e8', fontWeight: 'bold' }}>📋 Ir al Formulario de Justificación</a></p>
                <p><strong>IMPORTANTE:</strong> Acceso restringido a correo institucional (@uahurtado.cl). Si usas Gmail personal, te saldrá "Permiso denegado".</p>
                <p>Usa ventana de incógnito si tienes problemas.</p>
            </div>
        )
    }
];

export const faqItemsOnline: FAQItem[] = [
    {
        icon: '',
        color: '#ec4899', // Rosa
        title: '1. TNE (TARJETA NACIONAL ESTUDIANTIL)',
        description: 'Pase escolar para modalidad online.',
        questions: [
            'Estudio online, ¿puedo tener pase escolar (TNE)?',
            'Soy de región, ¿cómo obtengo mi tarjeta si no voy a Santiago?',
            '¿Qué requisitos debo cumplir para tener la TNE?'
        ],
        generalResponse: (
            <div>
                <p>Sí, puedes optar a la TNE. Al ser alumno regular de un programa de pregrado, tienes derecho al beneficio del pase escolar.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Proceso:</strong> La universidad te inscribe en el sistema Junaeb. Debes asegurarte de pagar la cuota de la tarjeta (si corresponde) y tomarte la fotografía en los capturadores online de Junaeb.</li>
                    <li><strong>Link Oficial Junaeb:</strong> Para ver el estado de tu pase o buscar puntos de captura fotográfica, ingresa a <a href="https://www.tne.cl/" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://www.tne.cl/</a>.</li>
                    <li><strong>Retiro/Envío:</strong> Una vez que la tarjeta física llegue a la universidad (en Santiago), debes contactar a la DAE para coordinar el retiro o consultar opciones de envío a oficinas regionales.</li>
                    <li><strong>Contacto UAH:</strong> <a href="mailto:tnecredencialuah@uahurtado.cl" className="text-blue-600">tnecredencialuah@uahurtado.cl</a>.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#3b82f6', // Azul
        title: '2. CREDENCIALES (ACCESO A PLATAFORMAS)',
        description: 'Acceso corporativo y Aula Virtual.',
        questions: [
            '¿Dónde encuentro mi correo institucional y clave para entrar al aula virtual?',
            'No me ha llegado el correo con mis accesos al aula virtual.',
            '¿Cómo ingreso al aula virtual?'
        ],
        generalResponse: (
            <div>
                <p>Tus credenciales de acceso se generan automáticamente al finalizar tu matrícula.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Ubicación:</strong> Revisa el "Correo de Confirmación de Matrícula" que se envió a tu email personal. Allí vienen tus datos de ingreso iniciales.</li>
                    <li><strong>Soporte:</strong> En caso de que la clave sea incorrecta o no encuentres el correo (revisa Spam), contacta a Soporte TI: <a href="mailto:informatica@uahurtado.cl" className="text-blue-600">informatica@uahurtado.cl</a>.</li>
                    <li><strong>Link de Acceso:</strong> <a href="https://campusvirtual.uahurtado.cl/" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://campusvirtual.uahurtado.cl/</a></li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#f59e0b', // Naranja
        title: '3. CAE (CRÉDITO CON AVAL DEL ESTADO)',
        description: 'Financiamiento del arancel.',
        questions: [
            '¿El programa de Ingeniería Industrial Online acepta CAE?',
            'Ya tengo el CAE de una carrera anterior, ¿puedo usarlo aquí?',
            '¿Cómo renuevo el crédito si soy estudiante online?'
        ],
        generalResponse: (
            <div>
                <p>Sí, el programa permite financiamiento vía CAE si cumples con los requisitos de renovación o postulación en Ingresa.cl.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Cobertura:</strong> Recuerda que el CAE cubre hasta el Arancel de Referencia, y la diferencia con el arancel real debes cubrirla tú.</li>
                    <li><strong>Portal Oficial (Postulación y Renovación):</strong> <a href="https://portal.ingresa.cl/" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://portal.ingresa.cl/</a>.</li>
                    <li><strong>Dudas UAH:</strong> Para confirmar montos y procesos internos, escribe a <a href="mailto:beneficiosdae@uahurtado.cl" className="text-blue-600">beneficiosdae@uahurtado.cl</a>.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#10b981', // Verde
        title: '4. PAGOS DE ARANCELES Y FINANZAS',
        description: 'Regularización y formas de pago.',
        questions: [
            '¿Cuáles son las formas de pago aceptadas?',
            'Necesito pagar la matrícula o cuota del mes.',
            '¿Cómo regularizo una deuda o pago atrasado?'
        ],
        generalResponse: (
            <div>
                <p>Todos los pagos se realizan de forma digital a través de los canales oficiales.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Enlace de Pago Rápido:</strong> <a href="https://estudiantes.uahurtado.cl/pagocuotas/" target="_blank" rel="noreferrer" className="text-blue-600 underline">estudiantes.uahurtado.cl/pagocuotas/</a> (Ingresa solo con tu RUT).</li>
                    <li><strong>Instructivos Oficiales (PDF):</strong>
                        <ul className="list-disc pl-5 mt-1">
                            <li>Canales de Pago Detallados: Ver PDF Instructivo.</li>
                            <li>Formas de Pago Actualizadas: Ver PDF 2024.</li>
                        </ul>
                    </li>
                    <li><strong>Más Información:</strong> Para detalles completos visita el <a href="https://www.uahurtado.cl/estudiantes/servicios-financieros-estudiantes/" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://www.uahurtado.cl/estudiantes/servicios-financieros-estudiantes/</a></li>
                    <li><strong>Contacto:</strong> <a href="mailto:serviciosfinancieros@uahurtado.cl" className="text-blue-600">serviciosfinancieros@uahurtado.cl</a>.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#8b5cf6', // Morado
        title: '5. MATRÍCULAS Y GESTIÓN ACADÉMICA',
        description: 'Inscripción y certificados.',
        questions: [
            '¿Cómo me matriculo para el próximo semestre?',
            'Necesito un certificado.',
            '¿Dónde inscribo mis ramos?',
            'Quiero suspender o renunciar.'
        ],
        generalResponse: (
            <div>
                <p>Si tienes dudas sobre tu proceso de matrícula, ya seas estudiante nuevo o antiguo, aquí tienes los canales oficiales para contactarte con la universidad y resolver problemas de acceso o inscripción:</p>

                <h4 className="font-bold mt-3 mb-1">Matrículas: Contactos Clave</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Mesa Central (General):</strong> +56 2 2692 0200.</li>
                    <li><strong>Alumnos Nuevos (Admisión):</strong>
                        <ul className="list-circle pl-5 mt-1">
                            <li>Call Center: +56 2 2692 0221 (08:00 a 20:00 hrs).</li>
                            <li>WhatsApp: +56 9 2382 5490 / +56 9 2381 8810.</li>
                            <li>Correo: <a href="mailto:matriculaestudiantesnuevos@uahurtado.cl" className="text-blue-600">matriculaestudiantesnuevos@uahurtado.cl</a>.</li>
                        </ul>
                    </li>
                    <li><strong>Alumnos Antiguos (Renovación):</strong>
                        <ul className="list-circle pl-5 mt-1">
                            <li>Dónde: Portal "Estudiantes" en <a href="https://www.uahurtado.cl" target="_blank" rel="noreferrer" className="text-blue-600 underline">www.uahurtado.cl</a>.</li>
                            <li>Problemas de acceso/clave: Escribe a <a href="mailto:informatica@uahurtado.cl" className="text-blue-600">informatica@uahurtado.cl</a> (indica tu RUT en el asunto).</li>
                        </ul>
                    </li>
                </ul>

                <h4 className="font-bold mt-3 mb-1">Certificados y Ramos:</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Plataforma:</strong> Tanto la descarga de certificados de notas/alumno regular como la inscripción de ramos se realizan exclusivamente en U-Campus.</li>
                </ul>

                <h4 className="font-bold mt-3 mb-1">Proceso de Suspensión o Renuncia:</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Suspensión:</strong> Antes de cualquier trámite, debes comunicarte primero con tu coordinadora, Giannina Radzievski (<a href="mailto:rradziev@uahurtado.cl" className="text-blue-600">rradziev@uahurtado.cl</a>), para evaluar tu situación.</li>
                    <li><strong>Renuncia:</strong> Este proceso se rige estrictamente por el Reglamento Académico. Debes contactar a Servicios Financieros (atención Giannina) mediante el correo <a href="mailto:serviciosfinancieros@uahurtado.cl" className="text-blue-600">serviciosfinancieros@uahurtado.cl</a> para regularizar tu situación antes de formalizar la renuncia.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#ef4444', // Rojo
        title: '6. EVALUACIONES DE COMPETENCIAS HABILITANTES',
        description: 'Requisito Institucional de diagnóstico.',
        questions: [
            '¿Cuándo debo rendir la evaluación de competencias (diagnóstico)?',
            'No me llegó el link para la prueba habilitante.',
            'Tengo problemas para ingresar a la evaluación o se me cayó la conexión.'
        ],
        generalResponse: (
            <div>
                <p className="mb-2"><strong>Nota Importante:</strong> Las Evaluaciones de Competencias son un Requisito Institucional de diagnóstico. Si no las realizas, no podrás inscribir ramos, ya que el sistema bloqueará tu avance académico.</p>
                <p>Estas evaluaciones son administradas por una unidad específica: Competencias Habilitantes. Cualquier duda sobre fechas, accesos o problemas durante la rendición, debes canalizarla directamente con ellos.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Correo Oficial:</strong> <a href="mailto:competencias@uahurtado.cl" className="text-blue-600">competencias@uahurtado.cl</a>.</li>
                    <li><strong>WhatsApp de Soporte:</strong> +56 9 75184541.</li>
                    <li>Horario de atención WhatsApp: Días de rendición, de 10:00 a 18:00 hrs.</li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#f59e0b', // Amarillo
        title: '7. MALLA CURRICULAR (PLAN DE ESTUDIOS)',
        description: 'Mapa de la carrera.',
        questions: [
            '¿Qué ramos me toca tomar el próximo ciclo?',
            '¿Dónde puedo ver el mapa completo de la carrera?',
            '¿Cuántos semestres me faltan para terminar?'
        ],
        generalResponse: (
            <div>
                <p>Tu Malla Curricular es tu mapa de ruta. Es fundamental que la tengas siempre a mano para conocer el orden de tus asignaturas y planificar tu avance académico trimestre a trimestre.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Plan de Estudios:</strong> El programa de Ingeniería Civil Industrial (Online) tiene una estructura secuencial diseñada para avanzar de forma ordenada.</li>
                    <li><strong>Descarga Oficial:</strong>
                        <ul className="list-circle pl-5 mt-1">
                            <li>Ver Malla Online (PDF): <a href="#" className="text-blue-600 underline">Descargar aquí</a>.</li>
                        </ul>
                    </li>
                </ul>
            </div>
        )
    },
    {
        icon: '',
        color: '#64748b', // Gris/Slate
        title: '8. COMUNICACIÓN',
        description: 'Canales oficiales.',
        questions: [
            '¿Cómo me comunico con mis profesores o compañeros?',
            '¿Dónde recibo la información importante de la carrera?'
        ],
        generalResponse: (
            <div>
                <p>La comunicación oficial se realiza a través de dos canales principales:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li><strong>Foro del Campus Virtual UAH:</strong> Es el espacio para consultas académicas directas sobre tus asignaturas.</li>
                    <li><strong>Correo Institucional:</strong> Es el canal formal de comunicación. Toda información oficial sobre plazos, beneficios y avisos importantes llegará a esta casilla, por lo que debes revisarla periódicamente.</li>
                </ol>
            </div>
        )
    }
];
