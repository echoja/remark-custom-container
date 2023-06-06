import { visit } from "unist-util-visit";

import type { Plugin, Transformer } from "unified";
import type { Node, Literal, Parent } from "unist";
import type { Paragraph } from "mdast";
import type { Data } from "vfile";

export const REGEX_BEGIN = /^\s*:::\s*(\w+)\s*(.*)?/;
export const REGEX_END = /^\s*:::$/;

export interface CustomContainerOptions {
  /**
   * @defaultValue "remark-container"
   */
  className?: string;
  /**
   * @defaultValue "div"
   */
  containerTag?: string;
  /**
   * @defaultValue {className: string[]}
   */
  titleElement?: Record<string, unknown> | null;
  /**
   * @defaultValue undefined
   */
  additionalProperties?: (
    className?: string,
    title?: string
  ) => Record<string, unknown>;

  /**
   * @defaultValue undefined
   */
  optionsByClassName?: {
    /** className selector. */
    selector: string;
    /**
     * @defaultValue "div"
     */
    containerTag?: string;
    /**
     * @defaultValue "div"
     */
    titleTag?: string;
    /**
     * @defaultValue {className: string[]}
     */
    titleElement?: Record<string, unknown> | null;
    /**
     * @defaultValue undefined
     */
    additionalProperties?: (
      className?: string,
      title?: string
    ) => Record<string, unknown>;
  }[];
}

const DEFAULT_SETTINGS = {
  className: "remark-container",
  containerTag: "div",
  titleElement: {},
  additionalProperties: undefined,
  optionsByClassName: undefined,
} satisfies CustomContainerOptions;

const isLiteralNode = (node: Node): node is Literal => {
  return "value" in node;
};

const isParagraph = (node: Node): node is Paragraph => {
  return "paragraph" === node.type;
};

const constructTitle = ({
  title,
  defaultClassName,
  titleElement,
  tag = "div",
}: {
  title: string;
  tag?: string;
  defaultClassName: string;
  titleElement: Record<string, unknown>;
}): Paragraph => {
  return {
    type: "paragraph",
    children: [{ type: "text", value: title }],
    data: {
      hName: tag,
      hProperties: {
        className: [`${defaultClassName}__title`],
        ...titleElement,
      },
    },
  };
};

// Constructs `Parent` node of custom directive which contains given children.
const constructContainer = ({
  children,
  defaultClassName,
  className,
  title,
  tag = "div",
  additionalProperties,
}: {
  children: Node<Data>[];
  defaultClassName: string;
  className: string;
  title?: string;
  tag?: string;
  additionalProperties?: (
    className?: string,
    title?: string
  ) => Record<string, unknown>;
}): Parent => {
  let properties: Record<string, unknown> | undefined;

  if (additionalProperties) {
    properties = additionalProperties(className, title ?? "");
  }

  return {
    type: "container",
    children,
    data: {
      hName: tag,
      hProperties: {
        className: [defaultClassName, className.toLowerCase()],
        ...(properties && { ...properties }),
      },
    },
  };
};

export const plugin: Plugin<[CustomContainerOptions?]> = (
  options?: CustomContainerOptions
): Transformer => {
  // const settings = Object.assign({}, DEFAULT_SETTINGS, options);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...options,
  };

  const transformer: Transformer = (tree: Node): void => {
    visit(tree, (_node: Node, _index: number | null, parent?: Parent): void => {
      if (!parent) return;

      const children: Node<Data>[] = [];
      const len = parent.children.length;
      // we walk through each children in `parent` to look for custom directive.
      let currentIndex = -1;
      while (currentIndex < len - 1) {
        currentIndex += 1;
        // check if currentIndex of children contains begin node of custom directive
        const currentNode = parent.children[currentIndex];
        children.push(currentNode);
        if (!isParagraph(currentNode)) {
          continue;
        }

        // XXX: Consider checking other children in currentNode
        const currentElem = currentNode.children[0];
        if (!isLiteralNode(currentElem)) {
          continue;
        }

        const match = currentElem.value.match(REGEX_BEGIN);
        if (!match) {
          continue;
        }

        // Here we're inside of the custom directive. let's find nearest closing directive.
        // remove last element, which is custom directive marker.
        children.pop();

        const beginIndex = currentIndex;
        let innerIndex = currentIndex - 1;
        while (innerIndex < len - 1) {
          innerIndex += 1;
          const currentNode = parent.children[innerIndex];
          if (!isParagraph(currentNode)) {
            continue;
          }

          const currentElem = currentNode.children[0];
          if (
            !isLiteralNode(currentElem) ||
            !currentElem.value.match(REGEX_END)
          ) {
            continue;
          }

          // here we found the closing directive.
          const [_input, className, title] = match;

          // remove surrounding `:::` markers and treat rest of them as children of the container
          const containerChildren = parent.children.slice(
            beginIndex + 1,
            innerIndex
          );

          const optionByClassName = settings.optionsByClassName?.find(
            (option) => option.selector === className
          );

          // if the title exists and the settings.titleElement is not null, then construct the title div element
          const titleElement =
            optionByClassName?.titleElement || settings.titleElement;
          if (title?.length && titleElement) {
            containerChildren.splice(
              0,
              0,
              constructTitle({
                title,
                defaultClassName: settings.className,
                tag: optionByClassName?.titleTag,
                titleElement,
              })
            );
          }

          const container = constructContainer({
            tag: optionByClassName?.containerTag || settings.containerTag,
            children: containerChildren,
            defaultClassName: settings.className,
            className: className.toLowerCase(),
            title,
            additionalProperties:
              optionByClassName?.additionalProperties ||
              settings.additionalProperties,
          });

          children.push(container);
          currentIndex = innerIndex - 1;
          break;
        }

        currentIndex += 1;
      }

      parent.children = children;
    });
  };

  return transformer;
};

export default plugin;
