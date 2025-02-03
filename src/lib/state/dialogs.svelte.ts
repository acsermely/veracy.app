import { getContext, setContext } from "svelte";

export class DialogsState {
	public connectDialog = $state(false);

	public feedbackDialog = $state(false);

	public shareSheet = $state(false);
	public shareSheetContent = $state<{
		txId?: string;
	}>();

	public buyDialog = $state(false);
	public buyDialogContent = $state<{
		id: string;
		price: number;
	}>();

	public setPaymentDialog = $state(false);
	public setPaymentDialogContent = $state<{
		id: string;
		price?: number;
	}>();

	private _setPaymentResolver!: (success: boolean) => void;

	public openSetPaymentDialog(id: string, price?: number): Promise<boolean> {
		this.setPaymentDialogContent = { id, price };
		this.setPaymentDialog = true;
		return new Promise((resolve) => (this._setPaymentResolver = resolve));
	}

	public closeSetPaymentDialog(success: boolean): void {
		this.setPaymentDialogContent = undefined;
		this.setPaymentDialog = false;
		if (this._setPaymentResolver) {
			this._setPaymentResolver(success);
		}
	}

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

	public openShareDialog(txId?: string): void {
		this.shareSheetContent = { txId };
		this.shareSheet = true;
	}

	public closeShareDialog(): void {
		this.shareSheet = false;
		this.shareSheetContent = undefined;
	}
}

const DIALOGS_STATE_KEY = "dialogs-state-key";

export function setDialogsState(): DialogsState {
	return setContext(DIALOGS_STATE_KEY, new DialogsState());
}

export function getDialogsState(): DialogsState {
	return getContext<DialogsState>(DIALOGS_STATE_KEY);
}
