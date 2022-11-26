# remark-custom-container

[remarkjs][remarkjs] parser plugin for custom directive (compatible with new parser in remark. see [#536][536])

> **Note**
> This plugin is highly inspired by [vuepress-plugin-container][vuepress-plugin-container].

This package is ESM only: Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

## Syntax

Container described with `:::[space]{class name}[space]{container title}` and `:::`.

example:

```markdown
::: className Custom Title

Container Body

:::
```

will be rendered as follows

```html
<div class="remark-container className">
  <div class="remark-container__title">
    Custom Title
  </div>
  Container Body
</div>
```

## Install

```shell
$ npm install remark-custom-container
```

## Usage

```javascript
import remark from "remark";
import remark2rehype from "remark-rehype";
import stringify from "rehype-stringify";

import container from "remark-custom-container"

const html = await remark()
  .use(container)
  .use(remark2rehype)
  .use(stringify)
```

## Options

```javascript
use(container, {
  className: string, // default to "remark-container",
  containerTag: string // default to "div"
})
```

[remarkjs]: https://github.com/remarkjs/remark
[536]: https://github.com/remarkjs/remark/pull/536
[vuepress-plugin-container]: https://github.com/vuepress/vuepress-community/tree/main/packages/vuepress-plugin-container
