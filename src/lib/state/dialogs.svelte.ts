import { getContext, setContext } from "svelte";

export class DialogsState {
	public connectDialog = $state(true);

	public buyDialog = $state(false);
	public buyDialogContent = $state<{
		id: string;
		price: number;
	}>();

	private _buyResolver!: () => void;

	public openBuyDialog(id: string, price: number): Promise<void> {
		this.buyDialogContent = { id, price };
		this.buyDialog = true;
		return new Promise((resolve) => (this._buyResolver = resolve));
	}

	public closeBuyDialog(): void {
		this.buyDialogContent = undefined;
		this.buyDialog = false;
		if (this._buyResolver) {
			this._buyResolver();
		}
	}
}

const DIALOGS_STATE_KEY = "dialogs-state-key";

export function setDialogsState(): DialogsState {
	return setContext(DIALOGS_STATE_KEY, new DialogsState());
}

export function getDialogsState(): DialogsState {
	return getContext<DialogsState>(DIALOGS_STATE_KEY);
}
