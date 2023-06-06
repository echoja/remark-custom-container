import { remark } from "remark";
import type { Processor } from "unified";
import type { VFileCompatible } from "vfile";
import gfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import stringify from "rehype-stringify";

import plugin from "..";

const compiler: Processor = remark()
  .use(gfm)
  .use(plugin, {
    optionsByClassName: [
      {
        selector: "details",
        containerTag: "details",
        titleTag: "summary",
        titleElement: {
          className: ["summary-title"],
        }
      }
    ]
  })
  // to check if it handles HTML in markdown
  .use(remark2rehype, { allowDangerousHtml: true })
  .use(stringify, { allowDangerousHtml: true });

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

it("with className, containerTag, titleTag", async () => {
  const input = `
::: details My Custom Details

markdown content

:::
  `;
  const expected = `
<details class="remark-container details">
<summary class="summary-title">My Custom Details
</summary>
<p>markdown content</p>
</details>`.replace(/\n/g, "");
  expect(await process(input)).toBe(expected);
});