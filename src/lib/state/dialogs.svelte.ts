import { getContext, setContext } from "svelte";

export class DialogsState {
	public connectDialog = $state(false);
}

const DIALOGS_STATE_KEY = "dialogs-state-key";

export function setDialogsState(): DialogsState {
	return setContext(DIALOGS_STATE_KEY, new DialogsState());
}

export function getDialogsState(): DialogsState {
	return getContext<DialogsState>(DIALOGS_STATE_KEY);
}
