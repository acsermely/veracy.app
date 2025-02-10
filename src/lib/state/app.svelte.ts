import { getContext, setContext } from "svelte";

export class AppState {
	public installPrompt = $state<any>();
}

const APP_STATE_KEY = "app-state-key";

export function setAppState(): AppState {
	return setContext(APP_STATE_KEY, new AppState());
}

export function getAppState(): AppState {
	return getContext<AppState>(APP_STATE_KEY);
}
