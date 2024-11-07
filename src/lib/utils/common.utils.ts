export const runDelayed = (fn: () => void, ms: number = 1): void => {
	const timeout = setTimeout(() => {
		fn();
		clearTimeout(timeout);
	}, ms);
};
