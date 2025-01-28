export type PostContentType = "TEXT" | "IMG";
export type PostContentPrivacy = "PUBLIC" | "PRIVATE";
export type PostContentAlign = "left" | "center" | "right";
export type PostAge = "3+" | "12+" | "16+" | "18+";

export type Post = {
	id: string;
	content: PostContent[];
	age: PostAge;
	tags?: string[];
	uploader: string;
	// settings?: PostSettings;
};

export type PostContent = {
	type: PostContentType;
	privacy: PostContentPrivacy;
	data: string;
	hash: string;
	align?: PostContentAlign;
};

export const genPostId = (): string => {
	return Date.now().toString(36);
};
