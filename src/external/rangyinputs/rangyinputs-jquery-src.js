/**
 * @license Rangy Inputs, a jQuery plug-in for selection and caret manipulation within textareas and text inputs.
 * 
 * https://github.com/timdown/rangyinputs
 *
 * For range and selection features for contenteditable, see Rangy.

 * http://code.google.com/p/rangy/
 *
 * Depends on jQuery 1.0 or later.
 *
 * Copyright 2014, Tim Down
 * Licensed under the MIT license.
 * Version: 1.2.0
 * Build date: 30 November 2014
 */
(function($) {
    const UNDEF = 'undefined';
    let getSelection,
        setSelection,
        deleteSelectedText,
        deleteText,
        insertText;
    let replaceSelectedText,
        surroundSelectedText,
        extractSelectedText,
        collapseSelection;

    // Trio of isHost* functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(object, property) {
        const t = typeof object[property];
        return t === 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
    }

    function isHostProperty(object, property) {
        return typeof (object[property]) !== UNDEF;
    }

    function isHostObject(object, property) {
        return !!(typeof (object[property]) === 'object' && object[property]);
    }

    function fail(reason) {
        if (window.console && window.console.log) {
            window.console.log(`RangyInputs not supported in your browser. Reason: ${reason}`);
        }
    }

    function adjustOffsets(el, start, end) {
        if (start < 0) {
            start += el.value.length;
        }
        if (typeof end === UNDEF) {
            end = start;
        }
        if (end < 0) {
            end += el.value.length;
        }
        return { start, end };
    }

    function makeSelection(el, start, end) {
        return {
            start,
            end,
            length: end - start,
            text: el.value.slice(start, end)
        };
    }

    function getBody() {
        return isHostObject(document, 'body') ? document.body : document.getElementsByTagName('body')[0];
    }

    $(document).ready(() => {
        const testTextArea = document.createElement('textarea');

        getBody().appendChild(testTextArea);

        if (isHostProperty(testTextArea, 'selectionStart') && isHostProperty(testTextArea, 'selectionEnd')) {
            getSelection = function(el) {
                let start = el.selectionStart,
                    end = el.selectionEnd;
                return makeSelection(el, start, end);
            };

            setSelection = function(el, startOffset, endOffset) {
                const offsets = adjustOffsets(el, startOffset, endOffset);
                el.selectionStart = offsets.start;
                el.selectionEnd = offsets.end;
            };

            collapseSelection = function(el, toStart) {
                if (toStart) {
                    el.selectionEnd = el.selectionStart;
                } else {
                    el.selectionStart = el.selectionEnd;
                }
            };
        } else if (isHostMethod(testTextArea, 'createTextRange') && isHostObject(document, 'selection') &&
                   isHostMethod(document.selection, 'createRange')) {
            getSelection = function(el) {
                let start = 0,
                    end = 0,
                    normalizedValue,
                    textInputRange,
                    len,
                    endRange;
                const range = document.selection.createRange();

                if (range && range.parentElement() == el) {
                    len = el.value.length;

                    normalizedValue = el.value.replace(/\r\n/g, '\n');
                    textInputRange = el.createTextRange();
                    textInputRange.moveToBookmark(range.getBookmark());
                    endRange = el.createTextRange();
                    endRange.collapse(false);
                    if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                        start = end = len;
                    } else {
                        start = -textInputRange.moveStart('character', -len);
                        start += normalizedValue.slice(0, start).split('\n').length - 1;
                        if (textInputRange.compareEndPoints('EndToEnd', endRange) > -1) {
                            end = len;
                        } else {
                            end = -textInputRange.moveEnd('character', -len);
                            end += normalizedValue.slice(0, end).split('\n').length - 1;
                        }
                    }
                }

                return makeSelection(el, start, end);
            };

            // Moving across a line break only counts as moving one character in a TextRange, whereas a line break in
            // the textarea value is two characters. This function corrects for that by converting a text offset into a
            // range character offset by subtracting one character for every line break in the textarea prior to the
            // offset
            const offsetToRangeCharacterMove = function(el, offset) {
                return offset - (el.value.slice(0, offset).split('\r\n').length - 1);
            };

            setSelection = function(el, startOffset, endOffset) {
                const offsets = adjustOffsets(el, startOffset, endOffset);
                const range = el.createTextRange();
                const startCharMove = offsetToRangeCharacterMove(el, offsets.start);
                range.collapse(true);
                if (offsets.start == offsets.end) {
                    range.move('character', startCharMove);
                } else {
                    range.moveEnd('character', offsetToRangeCharacterMove(el, offsets.end));
                    range.moveStart('character', startCharMove);
                }
                range.select();
            };

            collapseSelection = function(el, toStart) {
                const range = document.selection.createRange();
                range.collapse(toStart);
                range.select();
            };
        } else {
            getBody().removeChild(testTextArea);
            fail('No means of finding text input caret position');
            return;
        }

        // Clean up
        getBody().removeChild(testTextArea);

        function getValueAfterPaste(el, text) {
            let val = el.value,
                sel = getSelection(el),
                selStart = sel.start;
            return {
                value: val.slice(0, selStart) + text + val.slice(sel.end),
                index: selStart,
                replaced: sel.text
            };
        }
        
        function pasteTextWithCommand(el, text) {
            el.focus();
            const sel = getSelection(el);

            // Hack to work around incorrect delete command when deleting the last word on a line
            setSelection(el, sel.start, sel.end);
            if (text == '') {
                document.execCommand('delete', false, null);
            } else {
                document.execCommand('insertText', false, text);
            }

            return {
                replaced: sel.text,
                index: sel.start
            };
        }

        function pasteTextWithValueChange(el, text) {
            el.focus();
            const valueAfterPaste = getValueAfterPaste(el, text);
            el.value = valueAfterPaste.value;
            return valueAfterPaste;
        }

        var pasteText = function(el, text) {
            const valueAfterPaste = getValueAfterPaste(el, text);
            try {
                const pasteInfo = pasteTextWithCommand(el, text);
                if (el.value == valueAfterPaste.value) {
                    pasteText = pasteTextWithCommand;
                    return pasteInfo;
                }
            } catch (ex) {
                // Do nothing and fall back to changing the value manually
            }
            pasteText = pasteTextWithValueChange;
            el.value = valueAfterPaste.value;
            return valueAfterPaste;
        };

        deleteText = function(el, start, end, moveSelection) {
            if (start != end) {
                setSelection(el, start, end);
                pasteText(el, '');
            }
            if (moveSelection) {
                setSelection(el, start);
            }
        };

        deleteSelectedText = function(el) {
            setSelection(el, pasteText(el, '').index);
        };

        extractSelectedText = function(el) {
            const pasteInfo = pasteText(el, '');
            setSelection(el, pasteInfo.index);
            return pasteInfo.replaced;
        };

        const updateSelectionAfterInsert = function(el, startIndex, text, selectionBehaviour) {
            let endIndex = startIndex + text.length;
            
            selectionBehaviour = (typeof selectionBehaviour === 'string') ?
                selectionBehaviour.toLowerCase() : '';

            if ((selectionBehaviour == 'collapsetoend' || selectionBehaviour == 'select') && /[\r\n]/.test(text)) {
                // Find the length of the actual text inserted, which could vary
                // depending on how the browser deals with line breaks
                const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                endIndex = startIndex + normalizedText.length;
                const firstLineBreakIndex = startIndex + normalizedText.indexOf('\n');
                
                if (el.value.slice(firstLineBreakIndex, firstLineBreakIndex + 2) == '\r\n') {
                    // Browser uses \r\n, so we need to account for extra \r characters
                    endIndex += normalizedText.match(/\n/g).length;
                }
            }

            switch (selectionBehaviour) {
                case 'collapsetostart':
                    setSelection(el, startIndex, startIndex);
                    break;
                case 'collapsetoend':
                    setSelection(el, endIndex, endIndex);
                    break;
                case 'select':
                    setSelection(el, startIndex, endIndex);
                    break;
            }
        };

        insertText = function(el, text, index, selectionBehaviour) {
            setSelection(el, index);
            pasteText(el, text);
            if (typeof selectionBehaviour === 'boolean') {
                selectionBehaviour = selectionBehaviour ? 'collapseToEnd' : '';
            }
            updateSelectionAfterInsert(el, index, text, selectionBehaviour);
        };

        replaceSelectedText = function(el, text, selectionBehaviour) {
            const pasteInfo = pasteText(el, text);
            updateSelectionAfterInsert(el, pasteInfo.index, text, selectionBehaviour || 'collapseToEnd');
        };

        surroundSelectedText = function(el, before, after, selectionBehaviour) {
            if (typeof after === UNDEF) {
                after = before;
            }
            const sel = getSelection(el);
            const pasteInfo = pasteText(el, before + sel.text + after);
            updateSelectionAfterInsert(el, pasteInfo.index + before.length, sel.text, selectionBehaviour || 'select');
        };

        function jQuerify(func, returnThis) {
            return function() {
                const el = this.jquery ? this[0] : this;
                const nodeName = el.nodeName.toLowerCase();

                if (el.nodeType == 1 && (nodeName == 'textarea' ||
                        (nodeName == 'input' && /^(?:text|email|number|search|tel|url|password)$/i.test(el.type)))) {
                    const args = [el].concat(Array.prototype.slice.call(arguments));
                    const result = func.apply(this, args);
                    if (!returnThis) {
                        return result;
                    }
                }
                if (returnThis) {
                    return this;
                }
            };
        }

        $.fn.extend({
            getSelection: jQuerify(getSelection, false),
            setSelection: jQuerify(setSelection, true),
            collapseSelection: jQuerify(collapseSelection, true),
            deleteSelectedText: jQuerify(deleteSelectedText, true),
            deleteText: jQuerify(deleteText, true),
            extractSelectedText: jQuerify(extractSelectedText, false),
            insertText: jQuerify(insertText, true),
            replaceSelectedText: jQuerify(replaceSelectedText, true),
            surroundSelectedText: jQuerify(surroundSelectedText, true)
        });
    });
}(jQuery));
