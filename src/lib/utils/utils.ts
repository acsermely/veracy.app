export const runDelayed = (fn: () => void): void => {
	const timeout = setTimeout(() => {
		fn();
		clearTimeout(timeout);
	}, 1);
};
