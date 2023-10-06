import stringify from "rehype-stringify";
import { remark } from "remark";
import gfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import type { VFileCompatible } from "vfile";
import { describe, expect, it } from "vitest";

import plugin, { type CustomContainerOptions } from "..";

const compiler = remark()
  .use(gfm)
  .use(plugin, {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    additionalProperties: () => {},
  } as CustomContainerOptions)
  // to check if it handles HTML in markdown
  .use(remark2rehype, { allowDangerousHtml: true })
  .use(stringify, { allowDangerousHtml: true });

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("Options for remark-custom-container", () => {
  it("the option additionalProperties (empty function returns empty object) is processed", async () => {
    const input = `
::: warning My Custom Title

markdown content
    
:::
  `;
    const expected = `
<div class="remark-container warning">
<div class="remark-container__title">My Custom Title</div>
<p>markdown content</p>
</div>`.replace(/\n/g, "");
    expect(await process(input)).toBe(expected);
  });

  it("the option additionalProperties (empty function returns empty object) is processed when the title is not provided in markdown", async () => {
    const input = `
::: warning

markdown content
    
:::
  `;
    const expected = `
<div class="remark-container warning">
<p>markdown content</p>
</div>`.replace(/\n/g, "");
    expect(await process(input)).toBe(expected);
  });
});
