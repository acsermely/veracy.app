<script lang="ts">
  import { Loader } from "lucide-svelte";
  import { link } from "svelte-routing";
  import type { Post } from "../model/post.model";
  import { setContentNodeState } from "../state/node.svelte";
  import AvatarFallback from "./ui/avatar/avatar-fallback.svelte";
  import Avatar from "./ui/avatar/avatar.svelte";
  import CardContent from "./ui/card/card-content.svelte";
  import CardDescription from "./ui/card/card-description.svelte";
  import CardFooter from "./ui/card/card-footer.svelte";
  import CardHeader from "./ui/card/card-header.svelte";
  import CardTitle from "./ui/card/card-title.svelte";
  import Card from "./ui/card/card.svelte";

  const { data }: { data: Post } = $props();

  const nodeState = setContentNodeState();

  const getImagePromise = async (id: string): Promise<string> => {
    return data?.id && nodeState.getImage(id);
  };
</script>

<Card class="max-w-[500px] w-full my-5">
  <a class="flex p-6 pb-3 cursor-pointer" href={"/p/" + data.uploader} use:link>
    <Avatar class="inline-flex">
      <AvatarFallback>{data.uploader.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <CardHeader class="inline-flex pt-0">
      <CardTitle>{data.title}</CardTitle>
      <CardDescription>{data.uploader.slice(0, 30)}</CardDescription>
    </CardHeader>
  </a>
  <CardContent class="p-0">
    <div
      class="inline-flex w-full overflow-x-scroll scroll-smooth snap-x snap-mandatory max-h-[70vh]"
    >
      {#each data.content as content, i}
        <div
          id={data.id + "_" + i}
          class="min-w-full box-content snap-start inline-flex justify-center min-h-[45vh]"
        >
          {#if content.type === "TEXT"}
            <pre
              class="min-w-full p-5 border-y-2 text-wrap"
              class:text-left={content.align === "left"}
              class:text-center={content.align === "center"}
              class:text-right={content.align ===
                "right"}>{content.data.trim()}</pre>
          {:else}
            {#await getImagePromise(content.data)}
              <div
                class="flex-1 flex w-full h-full items-center justify-center"
              >
                <Loader class="size-10 animate-spin text-secondary" />
              </div>
            {:then src}
              <img class="h-full object-contain" {src} alt={"image_" + i} />
            {:catch e}
              <div
                class="min-w-full p-5 flex items-center justify-center text-destructive"
              >
                {e} <br />
                Check your connection!
              </div>
            {/await}
          {/if}
        </div>
      {/each}
    </div>
  </CardContent>
  <CardFooter class="pt-3 flex flex-col">
    {#if data.content.length > 1}
      <div class="flex justify-center w-full">
        {#each data.content as _, i}
          <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
          <span
            onclick={() => {
              const id = data.id + "_" + i;
              const elem = document.getElementById(id);
              elem?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
            class="px-2 w-6 h-6 flex items-center justify-center hover:bg-slate-500 opacity-50 rounded-full cursor-pointer mx-2"
          >
            {i + 1}
          </span>
        {/each}
      </div>
      <br />
    {/if}
    <div class=" w-full flex justify-start">
      {#each data.tags as tag}
        <small class="m-2">{tag}</small>
      {/each}
    </div>
  </CardFooter>
</Card>
