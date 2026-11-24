export async function imageFileToDataUrl(file: File, size = 900): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 8_000_000) throw new Error("Choose an image smaller than 8 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    let dimension = Math.min(size, 900);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const ratio = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser can’t prepare the image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.78, 0.68, 0.58, 0.48]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (!blob) continue;
        // Firestore rules cap imageURL at 500 KB. Keep headroom for the data-URL prefix.
        if (blob.size > 350_000) continue;
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Could not read that image."));
          reader.onload = () => typeof reader.result === "string" && reader.result.length <= 480_000
            ? resolve(reader.result)
            : reject(new Error("The prepared image is too large. Choose a smaller image."));
          reader.readAsDataURL(blob);
        });
      }
      dimension = Math.floor(dimension * 0.78);
    }
    throw new Error("This image could not be compressed enough. Choose a smaller or simpler image.");
  } finally {
    bitmap.close();
  }
}
