import { EditorView } from "@codemirror/view";
import { useCallback } from "react";

const useCursorListener = (editorViewRef, setCursorPos) => {
  useEffect(() => {
    if (!editorViewRef.current) return;

    // Create a plugin to listen for selection changes
    const plugin = EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        const pos = update.state.selection.main.head;
        const doc = update.state.doc;
        const line = doc.lineAt(pos);
        setCursorPos({
          line: line.number - 1,
          ch: pos - line.from,
        });
      }
    });

    // Add the plugin to the editor
    const view = editorViewRef.current;
    view.dispatch({
      effects: EditorView.appendConfig.of([plugin]),
    });

    // Cleanup: remove the plugin when unmounting
    return () => {
      view.dispatch({
        effects: EditorView.reconfigure.of([]),
      });
    };
  }, [editorViewRef, setCursorPos]);
};