import * as React from 'react';
import { GifEditor } from '../../components/editor';
import { SiteFooter } from '../../components/siteFooter';
import { Timeline } from '../../components/timeline';
import { AppStage, Loading } from '../../model/appState';
import { EditorState } from '../../model/editorState';
import { Storage } from '../../storage';
import { loadGifFromUrl } from '../../util/loadGif';
import * as actions from './actions';
import { reducer } from './reducer';

export function CreateView(): React.ReactElement {
    const [storage] = React.useState(new Storage());
    const [state, dispatch] = React.useReducer(reducer, Loading);

    const stateRef = React.useRef(state);
    stateRef.current = state;

    const backup = () => {
        if (state.type === AppStage.Ready) {
            storage.triggerStore(state.editorState);
        }
    };
    backup();

    React.useEffect(() => {
        loadInitialState();

        // Rendering loop
        setTimeout(function renderLoop() {
            let nextTimeout = 100;
            switch (stateRef.current.type) {
                case AppStage.Ready:
                    if (stateRef.current.editorState.playback.playing) {
                        dispatch(new actions.IncrementFrame(1));
                        const frame = stateRef.current.editorState.currentFrame;
                        nextTimeout = frame?.info.delay ? frame.info.delay * 10 : 30;
                    }
                    break;
            }
            setTimeout(renderLoop, nextTimeout);
        }, 100);
    }, []);

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            gridTemplateRows: '1fr auto auto',
            display: 'grid',
            gridTemplate: `
                'side-bar editor' 1fr
                'timeline timeline'
                'footer footer'
                / 120px 1fr
            `,
        }}>
            <GifEditor
                dispatch={dispatch}
                state={state}
                didTouchLayer={backup} />

            <Timeline
                dispatch={dispatch}
                state={state} />

            <SiteFooter />
        </div>
    );

    async function loadInitialState() {
        let newState: EditorState | undefined;
        try {
            newState = await storage.load();
        } catch (e) {
            await storage.reset();
            console.error('Error loading state', e);
        }

        if (newState) {
            dispatch(new actions.Loaded(newState));
        } else {
            dispatch(new actions.Loaded(EditorState.empty));

            const [rainbow, cage] = await Promise.all([
                loadGifFromUrl('images/example/rainbow.gif'),
                loadGifFromUrl('images/example/cage.gif'),
            ]);
            dispatch(new actions.AddLayer(rainbow));
            dispatch(new actions.AddLayer(cage));
            dispatch(new actions.SetPlaying(true));
        }
    }
}

