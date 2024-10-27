<script>
  import { link } from "svelte-routing";
  import { getWalletState } from "../state/wallet.svelte";
  import { buttonVariants } from "./ui/button";
  import Button from "./ui/button/button.svelte";

  const walletState = getWalletState();
</script>

<div
  class="w-full flex justify-center md:max-w-[200px] md:justify-start md:flex-col"
>
  <a href="/" use:link class={buttonVariants({ variant: "ghost" })}> Home </a>
  <a href="/create" use:link class={buttonVariants({ variant: "ghost" })}>
    New
  </a>
  {#if walletState.address}
    <a
      href={"/p/" + walletState.address}
      use:link
      class={buttonVariants({ variant: "ghost" })}
    >
      Profile
    </a>
  {:else}
    <Button variant="ghost" disabled>Profile</Button>
  {/if}
</div>
