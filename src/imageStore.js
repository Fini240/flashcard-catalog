// Card pictures are intentionally device-local: they're kept out of the
// synced `cards` payload (which has to stay under Firestore's 1MB document
// cap) and live here instead, under their own localStorage keys. Cards only
// carry a small id pointing into this store, so the fact that a card has a
// picture syncs across devices even though the picture itself doesn't.
const PREFIX = "fc-img-";
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.75;

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function resizeAndCompress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function saveImage(file) {
  const dataUrl = await resizeAndCompress(file);
  const id = genId();
  try {
    localStorage.setItem(PREFIX + id, dataUrl);
  } catch (e) {
    throw new Error("Couldn't save that image — your device may be low on storage.");
  }
  return id;
}

export function getImage(id) {
  if (!id) return null;
  try {
    return localStorage.getItem(PREFIX + id);
  } catch (e) {
    return null;
  }
}

export function removeImage(id) {
  if (!id) return;
  try {
    localStorage.removeItem(PREFIX + id);
  } catch (e) {
    // ignore
  }
}
