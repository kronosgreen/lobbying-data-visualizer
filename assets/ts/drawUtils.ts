import type { PlainObject } from "sigma/types";

// Number Formatter
const nf = new Intl.NumberFormat('en-US');

const TEXT_COLOR = "#000000";
const GREEN = "#228c15";
const RED = "#8e0d07";

function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Custom hover renderer
*/
export function drawHover(context: CanvasRenderingContext2D, data: PlainObject, settings: PlainObject) {
    const size = settings.labelSize;
    const font = settings.labelFont;
    const weight = settings.labelWeight;
    const subLabelSize = size - 2;

    let label = data.label;
    let hasPerformanceData = false;
    if(data.nodeType == "Firm" && data.fundamentals) {
        label += " (" + data.ticker + ")";
        hasPerformanceData = true;
    }
    const subLabel = data.extraDetails !== "unknown" ? data.extraDetails : "";
    const sectorLabel = data.nodeType == "Firm" ? data.sector : data.nodeType;

    // Then we draw the label background
    context.beginPath();
    context.fillStyle = "#fff";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;
    context.shadowBlur = 8;
    context.shadowColor = "#000";

    context.font = `${weight} ${size}px ${font}`;
    const labelWidth = context.measureText(label).width;
    context.font = `${weight} ${subLabelSize}px ${font}`;
    const subLabelWidth = subLabel ? context.measureText(subLabel).width : 0;
    context.font = `${weight} ${subLabelSize}px ${font}`;
    const sectorLabelWidth = sectorLabel ? context.measureText(sectorLabel).width : 0;

    const textWidth = Math.max(labelWidth, subLabelWidth, sectorLabelWidth);

    const x = Math.round(data.x);
    const y = Math.round(data.y);
    const w = Math.round(textWidth + size / 2 + data.size + 3);
    const hLabel = Math.round(size / 2 + 4);
    const hSubLabel = subLabel ? Math.round(subLabelSize / 2 + 9) : 0;
    const hsectorLabel = Math.round(subLabelSize / 2 + 9);
    const hFundamentalsLabel = hasPerformanceData ? Math.round(subLabelSize / 2 + 9) : 0;

    drawRoundRect(context, x, y - hSubLabel - 14, w, hsectorLabel + hLabel + 3*hFundamentalsLabel + hSubLabel + 12, 5);
    context.closePath();
    context.fill();

    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    const textStartX: number = data.x + data.size + 3;

    // And finally we draw the labels
    context.fillStyle = TEXT_COLOR;
    context.font = `${weight} ${size}px ${font}`;
    context.fillText(label, textStartX, data.y + size / 3);

    if (subLabel) {
        context.fillStyle = TEXT_COLOR;
        context.font = `${weight} ${subLabelSize}px ${font}`;
        context.fillText(subLabel, textStartX, data.y - (2 * size) / 3 - 4);
    }
    if (hasPerformanceData) {

        context.fillStyle = TEXT_COLOR;
        context.font = `${weight} ${subLabelSize}px ${font}`;
        const ebitdaLabel = "EBITDA: " + nf.format(Math.round(data.ebitda)) + " (";
        context.fillText(ebitdaLabel, textStartX, data.y + hFundamentalsLabel + (2 * size) / 3);

        context.fillStyle = data.ebitdaChange > 0 ? GREEN : RED;
        const ebitdaChangeLabel = String(Math.round(data.ebitdaChange)) + "%";
        context.fillText(ebitdaChangeLabel, textStartX + context.measureText(ebitdaLabel).width, 
            data.y + hFundamentalsLabel + (2 * size) / 3);
        context.fillStyle = TEXT_COLOR;
        context.fillText(")", 
            textStartX + context.measureText(ebitdaLabel).width + context.measureText(ebitdaChangeLabel).width,
            data.y + hFundamentalsLabel + (2 * size) / 3);

        context.fillStyle = TEXT_COLOR;
        const mktValLabel = "Mkt Val: " + nf.format(Math.round(data.marketValue)) + " (";
        context.fillText(mktValLabel, textStartX, data.y + 2*hFundamentalsLabel + (2 * size) / 3 + 2);

        context.fillStyle = data.marketValueChange > 0 ? GREEN : RED;
        const mktValChangeLabel = String(Math.round(data.marketValueChange)) + "%";
        context.fillText(mktValChangeLabel, textStartX + context.measureText(mktValLabel).width, 
            data.y + 2*hFundamentalsLabel + (2 * size) / 3 + 2);
        context.fillStyle = TEXT_COLOR;
        context.fillText(")", 
            textStartX + context.measureText(mktValLabel).width + context.measureText(mktValChangeLabel).width,
            data.y + 2*hFundamentalsLabel + (2 * size) / 3 + 2);
    }

    context.fillStyle = data.color;
    context.fillText(sectorLabel, textStartX, data.y + 2.5*hFundamentalsLabel + size / 3 + 3 + subLabelSize);
}