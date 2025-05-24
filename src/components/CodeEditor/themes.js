import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

const colors = {
    background: "#1b1e28",
    foreground: "#a6accd",
    selection: "#30343c",
    selectionMatch: "#454b57",
    caret: "#a6accd",
    lineHighlight: "#232734",
    gutterBackground: "#1b1e28",
    gutterForeground: "#506477",
    comment: "#637777",
    keyword: "#5DE4c7",
    string: "#addb67",
    number: "#d0679d",
    typeName: "#fffac2",
    function: "#82aaff",
    variableName: "#e4f0fb",
    operator: "#89ddff",
    namespace: "#5DE4c7",
    propertyName: "#e4f0fb",
    invalid: "#e57878",
};

export const alexCodeMirrorTheme = createTheme({
    theme: "dark",
    settings: {
        background: colors.background,
        foreground: colors.foreground,
        caret: colors.caret,
        selection: colors.selection,
        selectionMatch: colors.selectionMatch,
        lineHighlight: colors.lineHighlight,
        gutterBackground: colors.gutterBackground,
        gutterForeground: colors.gutterForeground,
    },
    styles: [
        { tag: t.comment, color: colors.comment },
        { tag: t.string, color: colors.string },
        { tag: t.keyword, color: colors.keyword },
        { tag: t.number, color: colors.number },
        { tag: t.operator, color: colors.operator },
        {
            tag: t.function(t.variableName),
            color: colors.foreground,
        },
        {
            tag: t.function(t.variableName),
            color: colors.foreground,
        },
        { tag: t.variableName, color: colors.variableName },
        { tag: t.definition(t.variableName), color: colors.variableName },
        { tag: [t.typeName, t.className], color: colors.typeName },
        { tag: t.propertyName, color: colors.propertyName },
        { tag: t.tagName, color: colors.keyword },
        { tag: t.attributeName, color: colors.keyword },
    ],
});
//inspired by poimandres theme
