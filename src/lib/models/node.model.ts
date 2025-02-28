export type NodeInfo = {
	imageSize: number;
	imageWidth: number;
	inboxCount: number;
	walletId: string;
};

export type InboxMessage = {
	id: number;
	user: string;
	sender: string;
	message: string;
	timestamp: string;
};
