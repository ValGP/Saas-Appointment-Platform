export type TreatmentItem = {
  title: string;
  description: string;
  indicatedFor: string[];
};

export type TreatmentCategory = {
  slug: string;
  title: string;
  shortDescription: string;
  heroText: string;
  intro: string[];
  ctaLabel: string;
  imageSrc: string;
  treatments: TreatmentItem[];
  benefits: string[];
};

export const treatmentCategories: TreatmentCategory[] = [
  {
    slug: "recuperacion-capilar",
    title: "Recuperacion capilar",
    shortDescription:
      "Tratamientos orientados a fortalecer el cabello, mejorar la densidad capilar y acompanar casos de caida o debilitamiento.",
    heroText:
      "Evaluacion personalizada y tratamientos capilares para acompanar la salud del cuero cabelludo.",
    intro: [
      "La caida, el afinamiento o la perdida de densidad pueden afectar la imagen personal y la confianza. En BIBE trabajamos con una evaluacion cuidada para orientar el tratamiento mas adecuado segun cada caso.",
      "Los tratamientos capilares pueden ayudar a fortalecer el cabello, mejorar la calidad del cuero cabelludo y acompanar procesos de debilitamiento. La indicacion depende de las necesidades de cada persona.",
    ],
    ctaLabel: "Consultar recuperacion capilar",
    imageSrc: "/treatments/recuperacion-capilar.png",
    benefits: [
      "Evaluacion segun cada caso",
      "Tratamientos capilares no quirurgicos",
      "Acompanamiento durante el proceso",
      "Orientacion profesional personalizada",
    ],
    treatments: [
      {
        title: "Recuperacion capilar masculina",
        description:
          "Orientada a hombres con entradas, menor densidad, debilitamiento o caida progresiva.",
        indicatedFor: [
          "Entradas o coronilla con menor densidad",
          "Afinamiento progresivo",
          "Caida sostenida",
        ],
      },
      {
        title: "Recuperacion capilar femenina",
        description:
          "Pensada para mujeres con afinamiento, perdida de volumen o caida mayor a la habitual.",
        indicatedFor: [
          "Cabello fino o debilitado",
          "Perdida de volumen",
          "Cambios capilares por estres u otros factores",
        ],
      },
      {
        title: "PRP capilar",
        description:
          "Utiliza componentes obtenidos de la propia sangre para estimular el cuero cabelludo.",
        indicatedFor: [
          "Debilitamiento capilar",
          "Perdida de densidad",
          "Complemento en tratamientos capilares",
        ],
      },
      {
        title: "Mesoterapia capilar",
        description:
          "Aplicacion de activos en cuero cabelludo para acompanar la vitalidad y fortaleza del cabello.",
        indicatedFor: [
          "Cabello debilitado",
          "Necesidad de nutricion capilar",
          "Acompanamiento de otros tratamientos",
        ],
      },
      {
        title: "Alta frecuencia capilar",
        description:
          "Tratamiento de apoyo que estimula la zona y complementa el cuidado capilar.",
        indicatedFor: [
          "Cuero cabelludo con necesidad de estimulo",
          "Procesos de fortalecimiento",
          "Tratamientos complementarios",
        ],
      },
      {
        title: "Microneedling capilar",
        description:
          "Tecnica que genera microcanales para favorecer la absorcion de activos y estimular la zona tratada.",
        indicatedFor: [
          "Debilitamiento localizado",
          "Estimulo del cuero cabelludo",
          "Complemento segun evaluacion",
        ],
      },
    ],
  },
  {
    slug: "estetica-facial",
    title: "Estetica facial",
    shortDescription:
      "Procedimientos para mejorar la calidad de la piel, aportar luminosidad y acompanar el cuidado facial.",
    heroText:
      "Tratamientos para cuidar la piel, realzar la expresion natural y acompanar tus objetivos esteticos.",
    intro: [
      "La estetica facial en BIBE busca mejorar la calidad de la piel y acompanar el cuidado del rostro con indicaciones personalizadas.",
      "Cada procedimiento se elige segun el objetivo, el tipo de piel y la evaluacion profesional, evitando promesas absolutas y priorizando un resultado cuidado.",
    ],
    ctaLabel: "Consultar tratamiento facial",
    imageSrc: "/treatments/estetica-facial.png",
    benefits: [
      "Evaluacion de piel",
      "Opciones adaptadas al objetivo",
      "Cuidado de textura y luminosidad",
      "Asesoramiento previo a decidir",
    ],
    treatments: [
      {
        title: "Toxina botulinica",
        description:
          "Tratamiento inyectable que ayuda a suavizar lineas de expresion y lograr un aspecto mas descansado.",
        indicatedFor: [
          "Lineas de expresion",
          "Frente, entrecejo o contorno de ojos",
          "Prevencion estetica segun evaluacion",
        ],
      },
      {
        title: "Acido hialuronico",
        description:
          "Relleno facial que ayuda a reponer volumen, mejorar contornos y aportar hidratacion segun la zona.",
        indicatedFor: [
          "Perdida de volumen",
          "Contorno facial",
          "Hidratacion y calidad de piel",
        ],
      },
      {
        title: "Hollywood Peel",
        description:
          "Tratamiento facial no invasivo que combina carbon y laser para limpiar la piel y mejorar su luminosidad.",
        indicatedFor: [
          "Piel apagada",
          "Poros visibles",
          "Exceso de grasitud",
        ],
      },
      {
        title: "Microneedling facial",
        description:
          "Tecnica con microagujas que estimula la renovacion de la piel y la produccion de colageno.",
        indicatedFor: [
          "Textura irregular",
          "Marcas superficiales",
          "Falta de luminosidad",
        ],
      },
      {
        title: "Peeling",
        description:
          "Renovacion cutanea para mejorar textura, luminosidad y aspecto general de la piel.",
        indicatedFor: [
          "Piel opaca",
          "Tono irregular segun evaluacion",
          "Renovacion facial",
        ],
      },
      {
        title: "PRP estetico",
        description:
          "Uso estetico del plasma rico en plaquetas para favorecer la regeneracion y calidad de la piel.",
        indicatedFor: [
          "Piel apagada",
          "Lineas de expresion",
          "Mejora general de textura",
        ],
      },
      {
        title: "Limpieza facial ultrasonica",
        description:
          "Limpieza profunda con espatula ultrasonica para remover impurezas y exceso de grasitud.",
        indicatedFor: [
          "Impurezas",
          "Puntos negros",
          "Mantenimiento facial",
        ],
      },
      {
        title: "Mesoterapia facial",
        description:
          "Aplicacion de activos para mejorar hidratacion, vitalidad y aspecto general del rostro.",
        indicatedFor: [
          "Deshidratacion",
          "Falta de vitalidad",
          "Cuidado facial complementario",
        ],
      },
    ],
  },
  {
    slug: "estetica-corporal",
    title: "Estetica corporal",
    shortDescription:
      "Tratamientos corporales orientados al cuidado de la piel, modelacion y bienestar.",
    heroText:
      "Opciones corporales para acompanar objetivos de cuidado, modelacion y bienestar.",
    intro: [
      "Los tratamientos corporales se orientan al cuidado de la piel, la comodidad diaria y objetivos esteticos concretos.",
      "En cada consulta se revisa que opcion puede ser mas adecuada, con una comunicacion clara sobre alcances y expectativas.",
    ],
    ctaLabel: "Consultar tratamiento corporal",
    imageSrc: "/treatments/estetica-corporal.png",
    benefits: [
      "Indicacion segun objetivo",
      "Cuidado corporal progresivo",
      "Opciones no invasivas",
      "Seguimiento profesional",
    ],
    treatments: [
      {
        title: "Depilacion laser",
        description:
          "Metodo de depilacion progresiva que ayuda a reducir el crecimiento del vello.",
        indicatedFor: [
          "Reduccion progresiva del vello",
          "Comodidad en la rutina",
          "Diferentes zonas corporales",
        ],
      },
      {
        title: "HIFU / HIMFU",
        description:
          "Tratamiento con ultrasonido focalizado orientado a mejorar firmeza y acompanar objetivos localizados.",
        indicatedFor: [
          "Firmeza de la piel",
          "Objetivos corporales localizados",
          "Evaluacion previa personalizada",
        ],
      },
      {
        title: "Vela Velvet",
        description:
          "Tratamiento no invasivo que combina tecnologias para acompanar modelacion, celulitis y firmeza.",
        indicatedFor: [
          "Modelacion corporal",
          "Celulitis",
          "Textura y firmeza de la piel",
        ],
      },
    ],
  },
  {
    slug: "pestanas-cejas",
    title: "Pestanas y cejas",
    shortDescription:
      "Servicios para realzar la mirada con terminaciones prolijas y personalizadas.",
    heroText:
      "Diseno y cuidado de mirada con acabados prolijos, naturales o mas intensos segun tu estilo.",
    intro: [
      "Los servicios de pestanas y cejas buscan realzar la mirada sin perder armonia con el rostro.",
      "Cada diseno se adapta al estilo de la persona, desde terminaciones naturales hasta efectos de mayor presencia.",
    ],
    ctaLabel: "Consultar pestanas y cejas",
    imageSrc: "/treatments/pestanas-cejas.png",
    benefits: [
      "Diseno segun tu estilo",
      "Terminaciones prolijas",
      "Opciones naturales o intensas",
      "Asesoramiento previo",
    ],
    treatments: [
      {
        title: "Volumen natural",
        description:
          "Extension de pestanas con acabado suave para realzar la mirada de forma discreta.",
        indicatedFor: [
          "Resultado natural",
          "Mas definicion diaria",
          "Primer acercamiento a extensiones",
        ],
      },
      {
        title: "Efecto rimel",
        description:
          "Acabado mas marcado que simula una mirada maquillada y definida.",
        indicatedFor: [
          "Mayor intensidad",
          "Mirada definida",
          "Rutina diaria mas practica",
        ],
      },
      {
        title: "Volumen ruso",
        description:
          "Tecnica de mayor volumen para una mirada intensa y con mas presencia.",
        indicatedFor: [
          "Efecto intenso",
          "Mayor volumen",
          "Eventos o estilo marcado",
        ],
      },
      {
        title: "Pestanas pelo por pelo",
        description:
          "Aplicacion individual para lograr extension y definicion personalizada.",
        indicatedFor: [
          "Definicion personalizada",
          "Resultado prolijo",
          "Realce de longitud",
        ],
      },
      {
        title: "Perfilado de cejas",
        description:
          "Diseno y orden de cejas para acompanar la expresion natural del rostro.",
        indicatedFor: [
          "Cejas desordenadas",
          "Definicion de forma",
          "Mantenimiento",
        ],
      },
      {
        title: "Laminado de cejas",
        description:
          "Tecnica para ordenar, peinar y dar mayor presencia visual a las cejas.",
        indicatedFor: [
          "Cejas rebeldes",
          "Efecto peinado",
          "Mayor definicion",
        ],
      },
      {
        title: "Diseno con henna",
        description:
          "Diseno de cejas con coloracion temporal para aportar definicion y estructura.",
        indicatedFor: [
          "Cejas poco definidas",
          "Prueba de forma y color",
          "Acabado mas completo",
        ],
      },
    ],
  },
  {
    slug: "podologia",
    title: "Podologia",
    shortDescription:
      "Cuidado profesional de los pies para mejorar bienestar, higiene y confort diario.",
    heroText:
      "Atencion podologica profesional para cuidar tus pies y acompanar molestias frecuentes.",
    intro: [
      "El cuidado de los pies es fundamental para el bienestar diario. En BIBE ofrecemos atencion podologica para tratar molestias frecuentes y mejorar el confort.",
      "La consulta permite orientar cada caso, revisar habitos de cuidado y definir el abordaje mas adecuado.",
    ],
    ctaLabel: "Consultar podologia",
    imageSrc: "/treatments/podologia.webp",
    benefits: [
      "Cuidado profesional de pies",
      "Orientacion ante molestias",
      "Higiene y confort diario",
      "Seguimiento cuando haga falta",
    ],
    treatments: [
      {
        title: "Cuidado profesional de pies",
        description:
          "Atencion integral para higiene, confort y mantenimiento podologico.",
        indicatedFor: [
          "Mantenimiento regular",
          "Molestias leves",
          "Cuidado preventivo",
        ],
      },
      {
        title: "Hongos en unas",
        description:
          "Evaluacion y acompanamiento ante alteraciones compatibles con hongos.",
        indicatedFor: [
          "Cambios de color",
          "Engrosamiento",
          "Molestias o fragilidad",
        ],
      },
      {
        title: "Callos y callosidades",
        description:
          "Tratamiento de zonas endurecidas que pueden generar incomodidad al caminar.",
        indicatedFor: [
          "Durezas",
          "Dolor por roce",
          "Molestias al calzarse",
        ],
      },
      {
        title: "Pie de atleta",
        description:
          "Orientacion y cuidado ante molestias, picazon o alteraciones en la piel del pie.",
        indicatedFor: [
          "Picazon",
          "Descamacion",
          "Incomodidad interdigital",
        ],
      },
      {
        title: "Unas encarnadas",
        description:
          "Atencion profesional para molestias producidas por el crecimiento de la una.",
        indicatedFor: [
          "Dolor localizado",
          "Inflamacion",
          "Dificultad al caminar",
        ],
      },
      {
        title: "Queratosis subungueal",
        description:
          "Cuidado de engrosamientos o acumulaciones debajo de la una segun evaluacion.",
        indicatedFor: [
          "Engrosamiento subungueal",
          "Molestia al presionar",
          "Alteraciones visibles",
        ],
      },
      {
        title: "Hiperqueratosis plantar",
        description:
          "Tratamiento de engrosamientos en planta del pie para mejorar confort.",
        indicatedFor: [
          "Durezas plantares",
          "Molestia al caminar",
          "Cuidado podologico regular",
        ],
      },
    ],
  },
];

export const commonTreatmentFaqs = [
  {
    answer:
      "Lo ideal es realizar una consulta para evaluar tu caso, escuchar que buscas y recomendar una opcion posible sin apurarte a decidir.",
    question: "Como se que tratamiento necesito?",
  },
  {
    answer:
      "Depende del tratamiento, la zona y el objetivo. En la consulta se puede orientar una frecuencia realista segun cada caso.",
    question: "Cuantas sesiones hacen falta?",
  },
  {
    answer:
      "Si. La idea es que puedas consultar antes, resolver dudas y decidir con informacion clara.",
    question: "Puedo consultar antes de decidir?",
  },
  {
    answer:
      "Algunos cambios pueden verse rapido y otros requieren proceso. No se prometen resultados garantizados: cada persona responde de forma distinta.",
    question: "Los resultados son inmediatos?",
  },
];

export function getTreatmentCategory(slug?: string) {
  return treatmentCategories.find((category) => category.slug === slug);
}
