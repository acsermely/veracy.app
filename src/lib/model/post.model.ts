export type PostContentType = "TEXT" | "IMG";
export type PostContentPrivacy = "PUBLIC" | "PRIVATE";
export type PostContentAlign = "left" | "center" | "right";

export type Post = {
	id: string;
	content: PostContent[];
	title: string;
	tags: string[];
	uploader: string;
	price?: string;
	// settings?: PostSettings;
};

export type PostContent = {
	type: PostContentType;
	privacy: PostContentPrivacy;
	data: string;
	align?: PostContentAlign;
};

export type PostSettings = {
	disableComments: boolean;
};

export type PostUploadMedia = {
	index: number;
	file: string;
};

export const genId = (): string => {
	return Date.now().toString(36);
};
