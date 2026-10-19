// The Spanish course: content parsed once, plus the syllabus. Loaded on
// demand through COURSES[].load in src/courses.js, so none of it is in the
// main bundle.
import { parseCourse } from "../courses.js";
import part1 from "./es-1.js";
import part2 from "./es-2.js";
import part3 from "./es-3.js";

// The order a German school works through Spanish, after the NRW
// Kernlehrplan. Seven blocks, as the foreign-language tracks expect.
const blocks = [
  // B1 — first steps (A1)
  ["v1-hola", "v1-numeros", "v1-familia", "v1-instituto", "v1-tiempolibre", "v1-casa",
    "g1-articulos", "g1-presente", "g1-ser-estar-hay", "g1-preguntas", "g1-irregulares", "g1-posesivos"],
  // B2 — everyday life (A1)
  ["v1-ciudad", "v1-comida", "v1-dia", "v2-ropa", "v2-cuerpo",
    "g1-gustar", "g1-reflexivos", "g2-diptongo", "g2-futuro-proximo", "g2-gerundio", "g2-perfecto"],
  // B3 — telling what happened (A2)
  ["v2-viajes", "v2-naturaleza", "v2-fiestas", "v2-medios", "v2-amigos",
    "g2-indefinido", "g2-indefinido-irr", "g2-pronombres", "g2-comparativo", "g2-imperativo"],
  // B4 — Spain and Latin America (A2)
  ["v3-espana", "v3-latam", "v3-jovenes", "v3-vivienda",
    "g3-imperfecto", "g3-imperf-indef", "g3-futuro", "g3-condicional", "g3-relativos"],
  // B5 — the future and the planet (A2/B1)
  ["v3-futuro", "v3-medioambiente", "v4-analisis",
    "g3-subjuntivo", "g3-imperativo-neg", "g3-pluscuamperfecto"],
  // B6 — Abitur topics I (B1)
  ["v4-migracion", "v4-crisis", "v4-identidad", "v4-opinion",
    "g4-subj-conjunciones", "g4-subj-opinion", "g4-imperf-subj"],
  // B7 — Abitur topics II (B1)
  ["v4-globalizacion", "v4-memoria", "v4-turismo",
    "g4-si", "g4-estilo-indirecto", "g4-pasiva"],
];

export default { units: parseCourse([part1, part2, part3].join("\n")), blocks };
