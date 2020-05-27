import { Document } from '../../model/document';
import { LayerId } from '../../model/layer';

const getScratchCanvas = (() => {
    let canvas: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | undefined;
    return () => {
        if (!canvas) {
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d')!;
        }
        return [canvas, ctx!] as const;
    };
})();

export function render(
    doc: Document,
    currentFrameIndex: number,
    zoom: number,
    outCtx: CanvasRenderingContext2D,
    options: {
        showBordersFor?: readonly LayerId[],
    } = {},
) {
    let { width, height } = doc;
    width *= zoom;
    height *= zoom;

    const [scratchCanvas, scratchCtx] = getScratchCanvas();
    scratchCanvas.width = width;
    scratchCanvas.height = height;

    for (const layer of doc.layers) {
        if (!layer.gif) {
            continue;
        }

        if (layer.hidden) {
            continue;
        }

        const frameToDraw = layer.getFrame(currentFrameIndex, doc.frameCount);
        if (!frameToDraw) {
            continue;
        }

        const isBaseLayer = layer === doc.baseLayer;
        const drawX = isBaseLayer ? 0 : (layer.position.x * zoom);
        const drawY = isBaseLayer ? 0 : (layer.position.y * zoom);

        scratchCtx.clearRect(0, 0, 10000, 10000);

        scratchCtx.save();
        {
            const layerWidth = layer.gif.width * layer.scale.x * zoom;
            const layerHeight = layer.gif.height * layer.scale.y * zoom;

            if (!isBaseLayer) {
                scratchCtx.drawImage(layer.mask,
                    drawX,
                    drawY,
                    layerWidth,
                    layerHeight);
                scratchCtx.globalCompositeOperation = 'source-in';
            }

            scratchCtx.drawImage(frameToDraw.canvas,
                drawX,
                drawY,
                layerWidth,
                layerHeight);
        }
        scratchCtx.restore();

        outCtx.drawImage(scratchCanvas, 0, 0);
    }

    for (const layer of doc.layers) {
        if (options.showBordersFor?.some(id => id.equals(layer.id))) {
            const isBaseLayer = layer === doc.baseLayer;
            const drawX = isBaseLayer ? 0 : (layer.position.x * zoom);
            const drawY = isBaseLayer ? 0 : (layer.position.y * zoom);

            const layerWidth = layer.width * layer.scale.x * zoom;
            const layerHeight = layer.height * layer.scale.y * zoom;

            outCtx.strokeStyle = 'red';
            outCtx.beginPath();
            outCtx.rect(drawX - 1, drawY - 1, layerWidth + 2, layerHeight + 2);
            outCtx.stroke();
        }
    }
}