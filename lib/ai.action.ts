import puter from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constants";

export async function fetchAsDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read blob"));

      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];  //we only take the 2nd part of it. Example - data:image/png;base64,iVBORw0KGgoAAA...  It takes the part after comma - ivBORw0KGgoAAA
    const mimeType = dataUrl.split(';')[0].split(':')[1];   //first it takes - data:image/png, then it takes imgage/png

    if(!mimeType || mimeType.trim() === '' || !base64Data || base64Data.trim() === '') {
      throw new Error('Invalid source image payload');
    }

    const response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
        provider: 'gemini',
        model: 'gemini-2.5-flash-image-preview',
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 }
    });

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if(!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    const renderedImage = rawImageUrl.startsWith('data:')
        ? rawImageUrl
        : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}