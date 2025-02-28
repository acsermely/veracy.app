import { getContext, setContext } from "svelte";

export class AppState {
	public installPrompt = $state<any>();
	public imageSize = $state<number>(200);
	public imageWidth = $state<number>(1000);
}

const APP_STATE_KEY = "app-state-key";

export function setAppState(): AppState {
	return setContext(APP_STATE_KEY, new AppState());
}

export function getAppState(): AppState {
	return getContext<AppState>(APP_STATE_KEY);
}
