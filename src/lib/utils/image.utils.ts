const IMAGE_WIDTH_PX = 500;
const IMAGE_FORMAT = "image/webp";
const IMAGE_FORMAT_FALLBACK = "image/jpeg"; // Some browsers are not supporintg webp
const IMAGE_SIZE_TRESHOLD = 200 * 1024; // 200 kb

/**
 * Convert (resize, compress) image to smaller dataURL
 * @param {File} file
 * @returns {Promise<string>} Compressed image as DataURL
 */
export const compressImageInput = async (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			reject("Not an Image file!");
		}
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				resolve(compressImage(img));
			};

			img.src = event.target?.result?.toString()!;
		};
		reader.readAsDataURL(file);
	});
};

/**
 * Recursively compresses the image until it is under the IMAGE_SIZE_TRESHOLD
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality
 * @returns {string}
 */
const recursiveImgCompress = (
	canvas: HTMLCanvasElement,
	quality = 1,
): string => {
	let format = IMAGE_FORMAT;
	let size = Math.ceil(canvas.toDataURL(IMAGE_FORMAT, quality).length);
	const size_fallback = Math.ceil(
		canvas.toDataURL(IMAGE_FORMAT_FALLBACK, quality).length,
	);
	if (size_fallback < size) {
		size = size_fallback;
		format = IMAGE_FORMAT_FALLBACK;
	}
	if (size < IMAGE_SIZE_TRESHOLD) {
		return canvas.toDataURL(format, quality);
	}
	return recursiveImgCompress(canvas, quality - 0.1);
};

/**
 * @param {HTMLImageElement} img
 * @returns {string} DataURL
 */
export const compressImage = (img: HTMLImageElement): string => {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return "";
	}
	const aspectRatio = img.width / img.height;

	canvas.width = IMAGE_WIDTH_PX;
	canvas.height = IMAGE_WIDTH_PX / aspectRatio;
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	return recursiveImgCompress(canvas);
};
