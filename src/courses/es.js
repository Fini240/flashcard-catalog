// The Spanish course content, parsed once. Loaded on demand through
// COURSES[].load in src/courses.js, so none of it is in the main bundle.
import { parseCourse } from "../courses.js";
import part1 from "./es-1.js";
import part2 from "./es-2.js";
import part3 from "./es-3.js";

export default parseCourse([part1, part2, part3].join("\n"));
