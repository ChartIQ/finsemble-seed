import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContext } from "./App"
import { useContext, useState, useEffect } from "react"
import { injectCSS } from "../copyCSS"
let nextTop = 50
const isNullish = (thing) => {
    return thing === null || typeof (thing) === "undefined";
}

export const Portal = ({ children, id, customWidth = 550, customHeight = 210 }) => {
    const { state, dispatch } = useContext(AppContext)
    // Container div for React portal
    const [element, setElement] = useState();
    // The external window where our menu content live
    let childWindow
    const getParentWindowBounds = async () => {
        if (typeof FSBL !== "undefined") {
            const { data } = await finsembleWindow.getBounds();
            return data;
        }
        return {
            top: window.screenTop,
            left: window.screenLeft,
            width: window.outerWidth,
            height: window.outerHeight
        }
    }
    const initWindow = async () => {
        const containerDiv = document.createElement("div");
        containerDiv.classList = "portal";
        const parentWindowBounds = await getParentWindowBounds();
        // Open the external window.
        const bounds = state.popouts[id]
        const width = isNullish(bounds.width) ? customWidth : bounds.width;
        const height = isNullish(bounds.height) ? customHeight : bounds.height;
        const top = isNullish(bounds.top) ? nextTop : bounds.top;
        // put the window butted up to the left edge of the parent if the left bound is nullish
        const left = isNullish(bounds.left) ? (parentWindowBounds.left - bounds.width) : bounds.left;
        childWindow = window.open(undefined, undefined, `width=${width},height=${height},top=${top},left=${left}`);
        // Allows us to access the childWindow outside of the portal. Used
        // in the control panel when the window is popped out.
        dispatch({
            type: 'addchildwindow',
            value: {
                id,
                childWindow
            }
        });

        // sets the intial bounds
        dispatch({
            type: 'add',
            value: {
                id,
                top,
                left,
                width,
                height
            }
        });
        dispatch({ type: 'persistState' })
        childWindow.document.body.appendChild(containerDiv);
        setElement(containerDiv);
        childWindow.addEventListener("beforeunload", () => {
            // stops tracking bounds for this window.
            dispatch({
                type: 'remove',
                value: { id }
            });
            dispatch({ type: 'persistState' });
        })
        childWindow.addEventListener("FSBLReady", async () => {
            const tearoutFinsembleWindow = childWindow.finsembleWindow;
            // window.open won't let you create a window on a separate monitor.
            // so we move it after it opens.
            tearoutFinsembleWindow.setBounds({
                top,
                left,
                width,
                height
            })
            tearoutFinsembleWindow.addEventListener('bounds-change-end', (event) => {
                dispatch({
                    type: 'add',
                    value: {
                        id,
                        ...event.data
                    }
                });
                dispatch({ type: 'persistState' });
            })
        })
        // Copy css from parent to child window
        injectCSS(childWindow)
        nextTop = nextTop + 40
    }

    useEffect(() => {
        initWindow();
        return () => {
            if (childWindow) {
                // removes childWindow reference to avoid memory leaks.
                dispatch({
                    type: 'removechildwindow',
                    value: {
                        id
                    }
                });
                childWindow.close();
            }
        }
    }, [])
    return element ? ReactDOM.createPortal(children, element) : null;
}
